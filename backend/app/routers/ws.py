from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Meeting, Participant, utcnow
from app.realtime import Connection, manager
from app.routers.meetings import get_joinable_meeting
from app.schemas import JoinMessage

router = APIRouter()

# Custom close codes (4000-4999 are reserved for applications)
CLOSE_CANNOT_JOIN = 4001
CLOSE_MEETING_ENDED = 4004

HOST_COMMANDS = {"mute_all", "end_meeting"}


async def reject(websocket: WebSocket, message: str) -> None:
    await websocket.send_json({"type": "error", "message": message})
    await websocket.close(code=CLOSE_CANNOT_JOIN)


async def mute_all(code: str, host: Connection) -> None:
    for connection in manager.connections(code):
        if connection.participant_id == host.participant_id or not connection.audio:
            continue
        connection.audio = False
        await manager.send(connection, {"type": "force_mute"})  # their browser turns the mic off
        await manager.broadcast(code, {"type": "participant_updated", "participant": connection.to_dict()})


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
    manager.add(code, connection)
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
