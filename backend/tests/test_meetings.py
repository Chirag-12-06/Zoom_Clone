from datetime import datetime, timedelta, timezone

from app.models import Meeting, Participant, utcnow


def future_iso(**delta) -> str:
    """An ISO datetime in IST (+05:30), the way the browser will send it."""
    ist = timezone(timedelta(hours=5, minutes=30))
    return (datetime.now(ist) + timedelta(**delta)).isoformat()


def schedule(client, **overrides):
    body = {"title": "Standup", "start_time": future_iso(hours=1), "duration_minutes": 30}
    return client.post("/api/meetings", json=body | overrides)


# --- instant meetings ---


def test_instant_meeting_has_code_passcode_and_link(client):
    response = client.post("/api/meetings/instant")
    assert response.status_code == 201
    data = response.json()
    assert len(data["code"]) == 11 and data["code"].isdigit()
    assert data["code"][0] != "0"
    assert len(data["passcode"]) == 6
    assert data["invite_link"].endswith(f"/j/{data['code']}?pwd={data['passcode']}")
    assert data["started_at"].endswith("Z")


def test_instant_meetings_get_different_codes(client):
    codes = {client.post("/api/meetings/instant").json()["code"] for _ in range(5)}
    assert len(codes) == 5


# --- scheduling ---


def test_schedule_meeting_stores_utc(client):
    start = future_iso(days=1)
    response = schedule(client, start_time=start)
    assert response.status_code == 201
    stored = datetime.fromisoformat(response.json()["scheduled_start"])
    assert stored == datetime.fromisoformat(start)  # same instant, now expressed in UTC
    assert stored.utcoffset() == timedelta(0)


def test_schedule_rejects_past_time(client):
    assert schedule(client, start_time=future_iso(hours=-1)).status_code == 422


def test_schedule_rejects_time_without_offset(client):
    naive = (datetime.now() + timedelta(hours=1)).replace(tzinfo=None).isoformat()
    assert schedule(client, start_time=naive).status_code == 422


def test_schedule_rejects_blank_title_and_bad_duration(client):
    assert schedule(client, title="   ").status_code == 422
    assert schedule(client, duration_minutes=0).status_code == 422


# --- listing ---


def test_upcoming_lists_scheduled_meetings_soonest_first(client):
    later = schedule(client, title="Later", start_time=future_iso(days=2)).json()
    sooner = schedule(client, title="Sooner", start_time=future_iso(hours=2)).json()
    client.post("/api/meetings/instant")  # instant meetings are never "upcoming"

    titles = [m["title"] for m in client.get("/api/meetings/upcoming").json()]
    assert titles == [sooner["title"], later["title"]]


def test_upcoming_hides_ended_and_finished_meetings(client, db_session):
    code = schedule(client).json()["code"]
    meeting = db_session.query(Meeting).filter_by(code=code).one()
    meeting.ended_at = utcnow()
    db_session.commit()

    # Scheduled in the past (inserted directly, the API wouldn't allow it) and already over
    db_session.add(
        Meeting(
            code="10000000001", passcode="abc123", host_id=1, type="scheduled", title="Old",
            scheduled_start=utcnow() - timedelta(hours=2), duration_minutes=30,
        )
    )
    db_session.commit()

    assert client.get("/api/meetings/upcoming").json() == []


def test_recent_lists_started_meetings_with_participant_count(client, db_session):
    first = client.post("/api/meetings/instant").json()
    second = client.post("/api/meetings/instant").json()
    schedule(client)  # not started yet, so not recent

    meeting = db_session.query(Meeting).filter_by(code=first["code"]).one()
    db_session.add_all(
        [Participant(meeting_id=meeting.id, display_name=n) for n in ("Asha", "Ravi")]
    )
    db_session.commit()

    recent = client.get("/api/meetings/recent").json()
    assert [m["code"] for m in recent] == [second["code"], first["code"]]
    assert [m["participant_count"] for m in recent] == [0, 2]


# --- lookup and join ---


def test_get_meeting_hides_passcode(client):
    meeting = client.post("/api/meetings/instant").json()
    data = client.get(f"/api/meetings/{meeting['code']}").json()
    assert data == {
        "code": meeting["code"],
        "title": meeting["title"],
        "host_name": "Chirag Gupta",
        "has_ended": False,
    }


def test_get_unknown_meeting_is_404(client):
    assert client.get("/api/meetings/99999999999").status_code == 404


def test_join_succeeds_with_correct_passcode(client):
    meeting = client.post("/api/meetings/instant").json()
    response = client.post(
        f"/api/meetings/{meeting['code']}/join",
        json={"passcode": meeting["passcode"], "display_name": "  Asha  "},
    )
    assert response.status_code == 200
    assert response.json()["code"] == meeting["code"]


def test_join_errors(client, db_session):
    meeting = client.post("/api/meetings/instant").json()
    url = f"/api/meetings/{meeting['code']}/join"
    good = {"passcode": meeting["passcode"], "display_name": "Asha"}

    assert client.post("/api/meetings/99999999999/join", json=good).status_code == 404
    assert client.post(url, json=good | {"passcode": "wrong"}).status_code == 403
    assert client.post(url, json=good | {"display_name": "   "}).status_code == 422
    assert client.post(url, json={"display_name": "Asha"}).status_code == 422

    row = db_session.query(Meeting).filter_by(code=meeting["code"]).one()
    row.ended_at = utcnow()
    db_session.commit()
    assert client.post(url, json=good).status_code == 410
