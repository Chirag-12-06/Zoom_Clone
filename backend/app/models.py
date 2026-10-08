from datetime import datetime, timedelta, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    # SQLite has no timezone support, so every datetime in the DB is a naive datetime in UTC
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    meetings: Mapped[list["Meeting"]] = relationship(back_populates="host")


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint("type IN ('instant', 'scheduled')", name="ck_meetings_type"),
        CheckConstraint("duration_minutes > 0", name="ck_meetings_duration_positive"),
        # Matches the "upcoming meetings" query: WHERE host_id = ? ORDER BY scheduled_start
        Index("ix_meetings_host_start", "host_id", "scheduled_start"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Public 11-digit meeting ID. Text, not a number: it's an identifier, never used in arithmetic.
    code: Mapped[str] = mapped_column(String(11), unique=True)
    passcode: Mapped[str] = mapped_column(String(10))
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(10))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime)
    duration_minutes: Mapped[int | None]
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    host: Mapped[User] = relationship(back_populates="meetings")
    participants: Mapped[list["Participant"]] = relationship(back_populates="meeting")

    @property
    def scheduled_end(self) -> datetime | None:
        if self.scheduled_start is None or self.duration_minutes is None:
            return None
        return self.scheduled_start + timedelta(minutes=self.duration_minutes)


class Participant(Base):
    """Attendance log: one row each time someone joins a meeting."""

    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    # NULL for guests: they join with a display name only
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    display_name: Mapped[str] = mapped_column(String(100))
    is_host: Mapped[bool] = mapped_column(default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    left_at: Mapped[datetime | None] = mapped_column(DateTime)
    removed: Mapped[bool] = mapped_column(default=False)

    meeting: Mapped[Meeting] = relationship(back_populates="participants")
