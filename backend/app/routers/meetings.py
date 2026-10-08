import secrets
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Meeting, Participant, User, utcnow
from app.schemas import (
    JoinRequest,
    MeetingCreate,
    MeetingOut,
    MeetingPublic,
    RecentMeetingOut,
)
from app.utils import generate_meeting_code, generate_passcode

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def create_meeting(db: Session, **fields) -> Meeting:
    """Insert a meeting with a random code, retrying if the code is already taken.

    The UNIQUE constraint on meetings.code is what guarantees uniqueness;
    the retry just handles the (very unlikely) collision.
    """
    for _ in range(5):
        meeting = Meeting(code=generate_meeting_code(), passcode=generate_passcode(), **fields)
        db.add(meeting)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(meeting)
        return meeting
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not generate a meeting ID")


def get_meeting_or_404(db: Session, code: str) -> Meeting:
    meeting = db.scalar(select(Meeting).where(Meeting.code == code))
    if meeting is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found")
    return meeting


def to_public(meeting: Meeting) -> MeetingPublic:
    return MeetingPublic(
        code=meeting.code,
        title=meeting.title,
        host_name=meeting.host.name,
        has_ended=meeting.ended_at is not None,
    )


@router.post("/instant", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # An instant meeting starts the moment it's created
    return create_meeting(
        db,
        host_id=user.id,
        type="instant",
        title=f"{user.name}'s Zoom Meeting",
        started_at=utcnow(),
    )


@router.post("", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    body: MeetingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_meeting(
        db,
        host_id=user.id,
        type="scheduled",
        title=body.title,
        description=body.description,
        # Store as naive UTC, like every other datetime in the DB
        scheduled_start=body.start_time.astimezone(timezone.utc).replace(tzinfo=None),
        duration_minutes=body.duration_minutes,
    )


@router.get("/upcoming", response_model=list[MeetingOut])
def list_upcoming_meetings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    meetings = db.scalars(
        select(Meeting)
        .where(
            Meeting.host_id == user.id,
            Meeting.type == "scheduled",
            Meeting.ended_at.is_(None),
        )
        .order_by(Meeting.scheduled_start)
    ).all()
    # A scheduled meeting stays "upcoming" until its scheduled end time has passed
    now = utcnow()
    return [m for m in meetings if m.scheduled_end > now]


@router.get("/recent", response_model=list[RecentMeetingOut])
def list_recent_meetings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # LEFT JOIN so meetings with no participant rows still show up, with a count of 0
    rows = db.execute(
        select(Meeting, func.count(Participant.id))
        .outerjoin(Meeting.participants)
        .where(Meeting.host_id == user.id, Meeting.started_at.is_not(None))
        .group_by(Meeting.id)
        .order_by(Meeting.started_at.desc())
        .limit(20)
    ).all()
    return [
        RecentMeetingOut.model_validate(meeting).model_copy(update={"participant_count": count})
        for meeting, count in rows
    ]


@router.get("/{code}", response_model=MeetingPublic)
def get_meeting(code: str, db: Session = Depends(get_db)):
    return to_public(get_meeting_or_404(db, code))


@router.post("/{code}/join", response_model=MeetingPublic)
def join_meeting(code: str, body: JoinRequest, db: Session = Depends(get_db)):
    """Check that a meeting can be joined. The actual joining happens over the WebSocket."""
    meeting = get_meeting_or_404(db, code)
    # compare_digest takes the same time whether the passcode is close or not
    if not secrets.compare_digest(body.passcode, meeting.passcode):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Incorrect passcode")
    if meeting.ended_at is not None:
        raise HTTPException(status.HTTP_410_GONE, "This meeting has ended")
    return to_public(meeting)
