from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the tables on Base.metadata)
from app.database import Base, SessionLocal, engine
from app.routers import users
from app.seed import seed_default_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once on startup: create any missing tables, then make sure the default user exists
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_default_user(db)
    yield


app = FastAPI(title="Zoom Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
