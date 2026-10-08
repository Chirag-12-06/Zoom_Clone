from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# backend/zoom.db, regardless of which directory the server is started from
DB_PATH = Path(__file__).resolve().parent.parent / "zoom.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False: FastAPI may use a session from a different thread than the one that created it
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    # SQLite ignores foreign keys unless this is turned on for every connection
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: one session per request, always closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
