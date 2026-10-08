import pytest
from starlette.websockets import WebSocketDisconnect

from app.models import Meeting, Participant, utcnow


@pytest.fixture
def meeting(client):
    return client.post("/api/meetings/instant").json()


def join_message(meeting, name="Asha", **extra):
    return {"type": "join", "display_name": name, "passcode": meeting["passcode"]} | extra


def ws_url(meeting):
    return f"/ws/meetings/{meeting['code']}"


def test_join_gets_welcome_with_self_in_roster(client, meeting, db_session):
    with client.websocket_connect(ws_url(meeting)) as ws:
        ws.send_json(join_message(meeting, audio=False))
        welcome = ws.receive_json()

    assert welcome["type"] == "welcome"
    assert welcome["is_host"] is False
    assert welcome["participants"] == [
        {"id": welcome["self_id"], "display_name": "Asha", "is_host": False, "audio": False, "video": True}
    ]
    # Attendance row written, and left_at set once the socket closed
    row = db_session.get(Participant, welcome["self_id"])
    assert row.display_name == "Asha" and row.left_at is not None


def test_host_is_recognised_by_user_id(client, meeting):
    with client.websocket_connect(ws_url(meeting)) as ws:
        ws.send_json(join_message(meeting, name="Chirag", user_id=1))
        assert ws.receive_json()["is_host"] is True

    with client.websocket_connect(ws_url(meeting)) as ws:
        ws.send_json(join_message(meeting, user_id=999))
        assert ws.receive_json()["is_host"] is False


def test_first_join_starts_scheduled_meeting(client, db_session):
    from tests.test_meetings import schedule

    meeting = schedule(client).json()
    assert meeting["started_at"] is None
    with client.websocket_connect(ws_url(meeting)) as ws:
        ws.send_json(join_message(meeting))
        ws.receive_json()
    assert db_session.query(Meeting).filter_by(code=meeting["code"]).one().started_at is not None


def test_others_see_joins_updates_and_leaves(client, meeting):
    with client.websocket_connect(ws_url(meeting)) as first:
        first.send_json(join_message(meeting, name="Asha"))
        first.receive_json()  # welcome

        with client.websocket_connect(ws_url(meeting)) as second:
            second.send_json(join_message(meeting, name="Ravi"))
            welcome = second.receive_json()
            assert [p["display_name"] for p in welcome["participants"]] == ["Asha", "Ravi"]

            joined = first.receive_json()
            assert joined["type"] == "participant_joined"
            assert joined["participant"]["display_name"] == "Ravi"

            second.send_json({"type": "media_state", "audio": False, "video": False})
            for ws in (first, second):  # everyone, including the sender, gets the update
                update = ws.receive_json()
                assert update["type"] == "participant_updated"
                assert update["participant"]["audio"] is False

        left = first.receive_json()
        assert left == {"type": "participant_left", "participant_id": welcome["self_id"]}


@pytest.mark.parametrize(
    "message, error",
    [
        ({"type": "join", "display_name": "Asha", "passcode": "wrong"}, "Incorrect passcode"),
        ({"type": "join", "display_name": "   ", "passcode": "x"}, "Invalid join message"),
        ({"type": "media_state"}, "Invalid join message"),
    ],
)
def test_bad_join_is_rejected(client, meeting, message, error):
    with client.websocket_connect(ws_url(meeting)) as ws:
        ws.send_json(message)
        assert ws.receive_json() == {"type": "error", "message": error}
        with pytest.raises(WebSocketDisconnect) as closed:
            ws.receive_json()
        assert closed.value.code == 4001


def test_unknown_and_ended_meetings_are_rejected(client, meeting, db_session):
    with client.websocket_connect("/ws/meetings/99999999999") as ws:
        ws.send_json(join_message(meeting))
        assert ws.receive_json()["message"] == "Meeting not found"

    db_session.query(Meeting).filter_by(code=meeting["code"]).one().ended_at = utcnow()
    db_session.commit()
    with client.websocket_connect(ws_url(meeting)) as ws:
        ws.send_json(join_message(meeting))
        assert ws.receive_json()["message"] == "This meeting has ended"


# --- host controls ---


def join_pair(client, meeting, host, guest):
    """Host and one guest in the meeting; returns once both have drained their join messages."""
    host.send_json(join_message(meeting, name="Chirag", user_id=1))
    host.receive_json()  # welcome
    guest.send_json(join_message(meeting, name="Asha"))
    guest_welcome = guest.receive_json()
    host.receive_json()  # participant_joined (Asha)
    return guest_welcome["self_id"]


def test_mute_all_mutes_everyone_but_the_host(client, meeting):
    with client.websocket_connect(ws_url(meeting)) as host, client.websocket_connect(ws_url(meeting)) as guest:
        join_pair(client, meeting, host, guest)
        host.send_json({"type": "mute_all"})

        assert guest.receive_json() == {"type": "force_mute"}
        assert guest.receive_json()["participant"]["audio"] is False
        update = host.receive_json()
        assert update["type"] == "participant_updated"
        assert update["participant"]["display_name"] == "Asha"
        assert update["participant"]["audio"] is False


def test_guests_cannot_use_host_commands(client, meeting):
    with client.websocket_connect(ws_url(meeting)) as host, client.websocket_connect(ws_url(meeting)) as guest:
        join_pair(client, meeting, host, guest)
        for command in ("mute_all", "end_meeting"):
            guest.send_json({"type": command})
            assert guest.receive_json() == {"type": "error", "message": "Only the host can do that"}


def test_end_meeting_disconnects_everyone_and_blocks_joins(client, meeting, db_session):
    with client.websocket_connect(ws_url(meeting)) as host, client.websocket_connect(ws_url(meeting)) as guest:
        join_pair(client, meeting, host, guest)
        host.send_json({"type": "end_meeting"})

        assert guest.receive_json() == {"type": "meeting_ended"}
        with pytest.raises(WebSocketDisconnect) as closed:
            guest.receive_json()
        assert closed.value.code == 4004

    assert db_session.query(Meeting).filter_by(code=meeting["code"]).one().ended_at is not None
    with client.websocket_connect(ws_url(meeting)) as late:
        late.send_json(join_message(meeting))
        assert late.receive_json()["message"] == "This meeting has ended"
