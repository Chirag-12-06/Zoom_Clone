import os

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import User

# A ready-made account so reviewers can log in straight away
DEFAULT_USER_NAME = "Chirag Gupta"
DEFAULT_USER_EMAIL = "chirag@example.com"
DEFAULT_USER_PASSWORD = os.getenv("DEMO_PASSWORD", "zoomdemo123")


def seed_default_user(db: Session) -> None:
    """Insert the demo user if it isn't there yet. Safe to run on every startup."""
    exists = db.scalar(select(User).where(User.email == DEFAULT_USER_EMAIL))
    if exists is None:
        db.add(
            User(
                name=DEFAULT_USER_NAME,
                email=DEFAULT_USER_EMAIL,
                password_hash=hash_password(DEFAULT_USER_PASSWORD),
            )
        )
        db.commit()
