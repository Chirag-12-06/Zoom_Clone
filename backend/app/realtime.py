"""Who is connected to which meeting right now.

Kept in memory because WebSocket connections only exist in this server process.
The DB `participants` table is the durable attendance log; this is the live roster.
(With several server processes this would need a shared store such as Redis pub/sub.)
"""

from dataclasses import dataclass

from fastapi import WebSocket


@dataclass
class Connection:
    websocket: WebSocket
    participant_id: int  # the participants.id row created for this join
    display_name: str
    is_host: bool
    audio: bool
    video: bool

    def to_dict(self) -> dict:
        return {
            "id": self.participant_id,
            "display_name": self.display_name,
            "is_host": self.is_host,
            "audio": self.audio,
            "video": self.video,
        }


class ConnectionManager:
    def __init__(self) -> None:
        # meeting code -> {participant id -> connection}
        self.rooms: dict[str, dict[int, Connection]] = {}

    def add(self, code: str, connection: Connection) -> None:
        self.rooms.setdefault(code, {})[connection.participant_id] = connection

    def remove(self, code: str, participant_id: int) -> None:
        room = self.rooms.get(code, {})
        room.pop(participant_id, None)
        if not room:
            self.rooms.pop(code, None)  # forget empty rooms

    def roster(self, code: str) -> list[dict]:
        return [connection.to_dict() for connection in self.rooms.get(code, {}).values()]

    async def broadcast(self, code: str, message: dict, exclude: int | None = None) -> None:
        # list(...) copies the values, so the room can change while we're awaiting sends
        for connection in list(self.rooms.get(code, {}).values()):
            if connection.participant_id == exclude:
                continue
            try:
                await connection.websocket.send_json(message)
            except Exception:
                # That socket is already closing; its own handler will clean it up
                pass


manager = ConnectionManager()
