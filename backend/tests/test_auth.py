import time

import jwt

from app import auth
from app.seed import DEFAULT_USER_EMAIL, DEFAULT_USER_PASSWORD


def signup(client, **overrides):
    body = {"name": "Asha Rao", "email": "asha@example.com", "password": "correct horse"} | overrides
    return client.post("/api/auth/signup", json=body)


def test_signup_returns_token_and_user(client):
    response = signup(client, email="Asha@Example.com")
    assert response.status_code == 201
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "asha@example.com"  # stored lower-case
    me = client.get("/api/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me.json()["name"] == "Asha Rao"


def test_password_is_hashed_not_stored(client, db_session):
    from app.models import User

    signup(client)
    user = db_session.query(User).filter_by(email="asha@example.com").one()
    assert "correct horse" not in user.password_hash
    assert auth.verify_password("correct horse", user.password_hash)


def test_signup_validation(client):
    assert signup(client).status_code == 201
    duplicate = signup(client, email="ASHA@example.com")
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "An account with this email already exists"
    assert signup(client, email="not-an-email").status_code == 422
    assert signup(client, email="b@example.com", password="short").status_code == 422
    assert signup(client, email="c@example.com", name="   ").status_code == 422


def test_login(client):
    ok = client.post("/api/auth/login", json={"email": DEFAULT_USER_EMAIL.upper(), "password": DEFAULT_USER_PASSWORD})
    assert ok.status_code == 200
    assert ok.json()["user"]["email"] == DEFAULT_USER_EMAIL

    for body in (
        {"email": DEFAULT_USER_EMAIL, "password": "wrong password"},
        {"email": "nobody@example.com", "password": DEFAULT_USER_PASSWORD},
    ):
        bad = client.post("/api/auth/login", json=body)
        assert bad.status_code == 401
        assert bad.json()["detail"] == "Incorrect email or password"  # same message either way


def test_protected_routes_need_a_valid_token(client):
    del client.headers["Authorization"]
    for method, path in (("get", "/api/me"), ("post", "/api/meetings/instant"), ("get", "/api/meetings/upcoming"), ("get", "/api/meetings/recent")):
        assert getattr(client, method)(path).status_code == 401

    forged = jwt.encode({"sub": "1", "exp": time.time() + 60}, "not-the-secret", algorithm="HS256")
    expired = jwt.encode({"sub": "1", "exp": time.time() - 1}, auth.JWT_SECRET, algorithm="HS256")
    for token in (forged, expired, "garbage"):
        assert client.get("/api/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_public_routes_stay_public(client):
    meeting = client.post("/api/meetings/instant").json()
    del client.headers["Authorization"]
    assert client.get(f"/api/meetings/{meeting['code']}").status_code == 200
    joined = client.post(
        f"/api/meetings/{meeting['code']}/join", json={"passcode": meeting["passcode"], "display_name": "Guest"}
    )
    assert joined.status_code == 200  # guests join without an account


def test_each_user_sees_only_their_own_meetings(client):
    mine = client.post("/api/meetings/instant").json()
    token = signup(client).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}

    theirs = client.post("/api/meetings/instant", headers=other).json()
    assert [m["code"] for m in client.get("/api/meetings/recent", headers=other).json()] == [theirs["code"]]
    assert theirs["title"] == "Asha Rao's Zoom Meeting"
    assert mine["code"] in [m["code"] for m in client.get("/api/meetings/recent").json()]
