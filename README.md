# Zoom Clone

A Zoom-style video meetings web app: dashboard, instant/scheduled meetings, join by ID or invite link, and a meeting room with a live participant roster.

## Stack

| Part | Tech |
| --- | --- |
| `frontend/` | Next.js (App Router), TypeScript, Tailwind CSS |
| `backend/` | FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite |

## Running locally

### Backend (http://localhost:8000)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
fastapi dev app/main.py
```

API docs: http://localhost:8000/docs

Run tests: `pytest`

### Frontend (http://localhost:3000)

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```
