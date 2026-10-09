import asyncio

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Meeting, Participant, utcnow
from app.realtime import Connection, manager
from app.routers.meetings import get_joinable_meeting
from app.schemas import JoinMessage

router = APIRouter()

# Custom close codes (4000-4999 are reserved for applications)
CLOSE_CANNOT_JOIN = 4001
CLOSE_REMOVED = 4003
CLOSE_MEETING_ENDED = 4004
CLOSE_REPLACED = 4005

HOST_COMMANDS = {"mute_all", "mute_participant", "remove_participant", "end_meeting"}

# When the last person leaves, wait this long before ending the meeting, so that a page
# refresh (old socket closes, new one connects a moment later) doesn't end it by accident
EMPTY_MEETING_GRACE_SECONDS = 30.0

# At most one pending "end this meeting" timer per meeting code. Keeping the task here also
# matters because asyncio itself only holds a weak reference to running tasks.
_end_timers: dict[str, asyncio.Task] = {}


async def reject(websocket: WebSocket, message: str) -> None:
    await websocket.send_json({"type": "error", "message": message})
    await websocket.close(code=CLOSE_CANNOT_JOIN)


async def find_target(code: str, host: Connection, participant_id: object) -> Connection | None:
    """The participant a host command is aimed at, or None (after telling the host why)."""
    # participant_id comes straight from client JSON, so check it really is an int
    target = manager.get(code, participant_id) if isinstance(participant_id, int) else None
    if target is None or target is host:
        await manager.send(host, {"type": "error", "message": "Participant not found"})
        return None
    return target


async def mute(code: str, connection: Connection) -> None:
    if not connection.audio:
        return  # already muted
    connection.audio = False
    await manager.send(connection, {"type": "force_mute"})  # their browser turns the mic off
    await manager.broadcast(code, {"type": "participant_updated", "participant": connection.to_dict()})


async def mute_all(code: str, host: Connection) -> None:
    for connection in manager.connections(code):
        if connection is not host:
            await mute(code, connection)


async def mute_participant(code: str, host: Connection, participant_id: object) -> None:
    target = await find_target(code, host, participant_id)
    if target is not None:
        await mute(code, target)


def was_removed(db: Session, meeting: Meeting, display_name: str) -> bool:
    # There are no accounts for guests, so the display name is the only identity we have:
    # someone the host removed can't come back under the same name (case-insensitive).
    return db.scalar(
        select(Participant.id)
        .where(
            Participant.meeting_id == meeting.id,
            Participant.removed.is_(True),
            func.lower(Participant.display_name) == display_name.lower(),
        )
        .limit(1)
    ) is not None


async def remove_participant(db: Session, code: str, host: Connection, participant_id: object) -> None:
    target = await find_target(code, host, participant_id)
    if target is None:
        return
    db.get(Participant, target.participant_id).removed = True
    db.commit()
    await manager.send(target, {"type": "removed"})
    try:
        # Their own handler sees the disconnect and broadcasts participant_left
        await target.websocket.close(code=CLOSE_REMOVED)
    except Exception:
        pass


async def replace_old_host(code: str) -> None:
    """Only one host connection per meeting: the newest one wins.

    Covers the host opening the meeting in a second window, and a page refresh whose new
    socket arrives before the old one has finished closing.
    """
    for other in manager.connections(code):
        if other.is_host:
            manager.remove(code, other.participant_id)  # so the newcomer's roster doesn't list it
            await manager.send(other, {"type": "replaced"})
            try:
                # Its own handler then records left_at and broadcasts participant_left
                await other.websocket.close(code=CLOSE_REPLACED)
            except Exception:
                pass


async def end_if_still_empty(code: str, meeting_id: int, engine: Engine) -> None:
    """Background task: end the meeting if nobody has come back within the grace period."""
    try:
        await asyncio.sleep(EMPTY_MEETING_GRACE_SECONDS)
        if manager.connections(code):
            return  # safety net; a join normally cancels this timer first
        # The handler's session is closed by now, so use a short-lived one of our own
        with Session(engine) as db:
            meeting = db.get(Meeting, meeting_id)
            if meeting is not None and meeting.ended_at is None:
                meeting.ended_at = utcnow()
                db.commit()
    finally:
        if _end_timers.get(code) is asyncio.current_task():
            del _end_timers[code]


def start_end_timer(code: str, meeting: Meeting, db: Session) -> None:
    """The room just became empty: (re)start its grace-period timer."""
    cancel_end_timer(code)
    _end_timers[code] = asyncio.create_task(end_if_still_empty(code, meeting.id, db.get_bind()))


def cancel_end_timer(code: str) -> None:
    """Someone joined: the meeting isn't empty any more."""
    timer = _end_timers.pop(code, None)
    if timer is not None:
        timer.cancel()


async def end_meeting(db: Session, meeting: Meeting, code: str) -> None:
    meeting.ended_at = utcnow()  # from now on, joins are rejected with 410 / "has ended"
    db.commit()
    await manager.broadcast(code, {"type": "meeting_ended"})
    for connection in manager.connections(code):
        try:
            await connection.websocket.close(code=CLOSE_MEETING_ENDED)
        except Exception:
            pass


@router.websocket("/ws/meetings/{code}")
async def meeting_socket(websocket: WebSocket, code: str, db: Session = Depends(get_db)):
    await websocket.accept()

    # 1. The first message must be a valid "join". Same rules as the REST join check.
    try:
        join = JoinMessage.model_validate(await websocket.receive_json())
        meeting = get_joinable_meeting(db, code, join.passcode)
    except ValueError:  # bad JSON, or a Pydantic ValidationError (a ValueError subclass)
        await reject(websocket, "Invalid join message")
        return
    except HTTPException as exc:
        await reject(websocket, exc.detail)
        return
    except WebSocketDisconnect:
        return
    if was_removed(db, meeting, join.display_name):
        await reject(websocket, "You were removed from this meeting")
        return

    # 2. Record the attendance and start the meeting if this is the first person in
    is_host = join.user_id is not None and join.user_id == meeting.host_id
    participant = Participant(
        meeting_id=meeting.id,
        user_id=join.user_id if is_host else None,
        display_name=join.display_name,
        is_host=is_host,
    )
    db.add(participant)
    if meeting.started_at is None:
        meeting.started_at = utcnow()
    db.commit()

    # 3. Tell the newcomer who's here, and tell everyone else about the newcomer
    connection = Connection(
        websocket=websocket,
        participant_id=participant.id,
        display_name=participant.display_name,
        is_host=is_host,
        audio=join.audio,
        video=join.video,
    )
    if is_host:
        await replace_old_host(code)
    manager.add(code, connection)
    cancel_end_timer(code)  # if the room was empty and counting down, it isn't any more
    await websocket.send_json(
        {
            "type": "welcome",
            "self_id": participant.id,
            "is_host": is_host,
            "participants": manager.roster(code),
        }
    )
    await manager.broadcast(
        code, {"type": "participant_joined", "participant": connection.to_dict()}, exclude=participant.id
    )

    # 4. Handle messages until the browser disconnects
    try:
        while True:
            message = await websocket.receive_json()
            kind = message.get("type")
            if kind == "media_state":
                connection.audio = bool(message.get("audio"))
                connection.video = bool(message.get("video"))
                await manager.broadcast(
                    code, {"type": "participant_updated", "participant": connection.to_dict()}
                )
            elif kind in HOST_COMMANDS and not connection.is_host:
                await websocket.send_json({"type": "error", "message": "Only the host can do that"})
            elif kind == "mute_all":
                await mute_all(code, connection)
            elif kind == "mute_participant":
                await mute_participant(code, connection, message.get("participant_id"))
            elif kind == "remove_participant":
                await remove_participant(db, code, connection, message.get("participant_id"))
            elif kind == "end_meeting":
                await end_meeting(db, meeting, code)
                break  # our own socket was closed too
            else:
                await websocket.send_json({"type": "error", "message": "Unknown message type"})
    except (WebSocketDisconnect, ValueError):
        pass
    finally:
        # 5. Runs however the connection ended: update the roster and the attendance log
        manager.remove(code, participant.id)
        participant.left_at = utcnow()
        db.commit()
        await manager.broadcast(code, {"type": "participant_left", "participant_id": participant.id})
        # 6. Last one out: the meeting ends unless someone comes back within the grace period
        if not manager.connections(code):
            start_end_timer(code, meeting, db)
