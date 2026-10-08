from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.seed import DEFAULT_USER_EMAIL


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Stand-in for auth: always returns the seeded default user."""
    return db.scalars(select(User).where(User.email == DEFAULT_USER_EMAIL)).one()
