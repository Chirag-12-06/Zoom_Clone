import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, enable_foreign_keys, get_db
from app.main import app
from app.seed import seed_default_user


@pytest.fixture
def db_session():
    """A fresh in-memory SQLite database for each test."""
    # StaticPool: reuse one connection, otherwise each connection would get its own empty in-memory DB
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    event.listen(engine, "connect", enable_foreign_keys)

    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False)()
    seed_default_user(session)
    yield session
    session.close()


@pytest.fixture
def client(db_session):
    # Point the app's get_db dependency at the test database
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()
