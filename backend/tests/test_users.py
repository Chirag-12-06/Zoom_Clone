import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.models import Meeting, User
from app.seed import DEFAULT_USER_EMAIL, seed_default_user


def test_me_returns_default_user(client):
    response = client.get("/api/me")
    assert response.status_code == 200
    assert response.json()["email"] == DEFAULT_USER_EMAIL


def test_seed_is_idempotent(db_session):
    seed_default_user(db_session)
    seed_default_user(db_session)
    assert db_session.scalar(select(func.count()).select_from(User)) == 1


def test_foreign_keys_are_enforced(db_session):
    db_session.add(
        Meeting(code="12345678901", passcode="abc123", host_id=999, type="instant", title="x")
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
