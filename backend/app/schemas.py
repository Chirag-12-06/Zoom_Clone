import os
from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    computed_field,
    field_validator,
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def as_utc(value: datetime) -> datetime:
    # The DB returns naive datetimes that are UTC; tag them so JSON gets a "Z" suffix
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


UTCDatetime = Annotated[datetime, AfterValidator(as_utc)]
NonBlankStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class UserOut(BaseModel):
    # from_attributes lets Pydantic read fields straight off a SQLAlchemy object
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str


class SignupRequest(BaseModel):
    name: Annotated[NonBlankStr, Field(max_length=100)]
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut


class MeetingCreate(BaseModel):
    """Body for scheduling a meeting."""

    title: Annotated[NonBlankStr, Field(max_length=200)]
    description: Annotated[str | None, Field(max_length=2000)] = None
    # AwareDatetime rejects times without an offset, e.g. "2026-10-09T15:30:00+05:30" is required
    start_time: AwareDatetime
    duration_minutes: Annotated[int, Field(ge=1, le=24 * 60)]

    @field_validator("start_time")
    @classmethod
    def start_in_future(cls, value: datetime) -> datetime:
        if value <= datetime.now(timezone.utc):
            raise ValueError("start_time must be in the future")
        return value


class MeetingOut(BaseModel):
    """Full meeting details, only ever returned to the host."""

    model_config = ConfigDict(from_attributes=True)

    code: str
    passcode: str
    type: Literal["instant", "scheduled"]
    title: str
    description: str | None
    scheduled_start: UTCDatetime | None
    duration_minutes: int | None
    started_at: UTCDatetime | None
    ended_at: UTCDatetime | None
    created_at: UTCDatetime

    @computed_field
    @property
    def invite_link(self) -> str:
        return f"{FRONTEND_URL}/j/{self.code}?pwd={self.passcode}"


class RecentMeetingOut(MeetingOut):
    participant_count: int = 0


class MeetingPublic(BaseModel):
    """What anyone with the meeting ID may see: no passcode."""

    code: str
    title: str
    host_name: str
    has_ended: bool


class JoinRequest(BaseModel):
    passcode: NonBlankStr
    display_name: Annotated[NonBlankStr, Field(max_length=50)]


class JoinMessage(JoinRequest):
    """First message a client sends on the meeting WebSocket."""

    type: Literal["join"]
    # Login token, if the person is logged in. Browsers can't add headers to a WebSocket
    # connection, so it travels in this first message. Guests send none.
    token: str | None = None
    audio: bool = True
    video: bool = True
