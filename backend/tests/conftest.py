import os

# Must be set before the app is imported: the app's own engine (used by its startup code)
# then points at a throwaway in-memory DB instead of backend/zoom.db.
os.environ["DATABASE_URL"] = "sqlite://"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base, enable_foreign_keys, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import DEFAULT_USER_EMAIL, DEFAULT_USER_PASSWORD, seed_default_user  # noqa: E402


@pytest.fixture(autouse=True)
def fast_password_hashing(monkeypatch):
    """Argon2 is slow on purpose; in tests use its cheapest settings (still real Argon2)."""
    from pwdlib import PasswordHash
    from pwdlib.hashers.argon2 import Argon2Hasher

    from app import auth

    monkeypatch.setattr(auth, "password_hash", PasswordHash((Argon2Hasher(time_cost=1, memory_cost=1024),)))


@pytest.fixture
def session_factory(tmp_path):
    """A fresh SQLite file per test (pytest deletes tmp_path afterwards)."""
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    event.listen(engine, "connect", enable_foreign_keys)
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine, autoflush=False)
    engine.dispose()


@pytest.fixture
def db_session(session_factory):
    """A session for the test itself, to set up rows or check what the API wrote."""
    session = session_factory()
    seed_default_user(session)
    yield session
    session.close()


@pytest.fixture
def client(session_factory, db_session):
    # Like the real get_db: every request / WebSocket gets its own session
    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    # "with": all requests and WebSockets share one event loop, as they do under uvicorn.
    # Without it each WebSocket gets its own loop, and messages one handler sends to
    # another connection may never wake that connection's reader.
    with TestClient(app) as test_client:
        # Logged in as the demo user by default; tests that need a logged-out client
        # remove the header with: del client.headers["Authorization"]
        login = {"email": DEFAULT_USER_EMAIL, "password": DEFAULT_USER_PASSWORD}
        token = test_client.post("/api/auth/login", json=login).json()["access_token"]
        test_client.headers["Authorization"] = f"Bearer {token}"
        yield test_client
    app.dependency_overrides.clear()
