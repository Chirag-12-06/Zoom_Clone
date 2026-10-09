from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth import user_id_from_token
from app.database import get_db
from app.models import User

# Reads "Authorization: Bearer <token>". auto_error=False so we can answer 401 ourselves.
# (It also adds an "Authorize" button to the /docs page.)
bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """The logged-in user, from the token. 401 if it's missing, invalid or expired."""
    user_id = user_id_from_token(credentials.credentials) if credentials else None
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Not logged in",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
