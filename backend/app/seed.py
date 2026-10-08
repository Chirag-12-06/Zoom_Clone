from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User

# There is no auth: this one user is always "logged in"
DEFAULT_USER_NAME = "Chirag Gupta"
DEFAULT_USER_EMAIL = "chirag@example.com"


def seed_default_user(db: Session) -> None:
    """Insert the default user if it isn't there yet. Safe to run on every startup."""
    exists = db.scalar(select(User).where(User.email == DEFAULT_USER_EMAIL))
    if exists is None:
        db.add(User(name=DEFAULT_USER_NAME, email=DEFAULT_USER_EMAIL))
        db.commit()
