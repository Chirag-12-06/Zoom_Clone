"""Password hashing and login tokens."""

import os
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

# Sign tokens with a secret from the environment. The fallback is only for local development:
# anyone who knows it could forge tokens, so production must set JWT_SECRET.
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret-change-me")
JWT_ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(days=7)

# Argon2: a slow, salted hash designed for passwords (what FastAPI's security docs recommend)
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(user_id: int) -> str:
    """A signed JWT saying "this is user <id>", valid for TOKEN_LIFETIME."""
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + TOKEN_LIFETIME}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def user_id_from_token(token: str) -> int | None:
    """The user id inside a valid token; None if it's forged, expired or malformed."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None
