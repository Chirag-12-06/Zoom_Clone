import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the tables on Base.metadata)
from app.database import Base, SessionLocal, engine
from app.routers import meetings, users, ws
from app.seed import seed_default_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once on startup: create any missing tables, then make sure the default user exists
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_default_user(db)
    yield


def cors_origins() -> list[str]:
    """Frontend URLs allowed to call the API, from CORS_ORIGINS (comma-separated).

    e.g. CORS_ORIGINS="https://zoom-clone.vercel.app,http://localhost:3000"
    Spaces and trailing slashes are dropped: the browser sends the origin without them.
    """
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


app = FastAPI(title="Zoom Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(meetings.router)
app.include_router(ws.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
