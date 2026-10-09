from app.main import cors_origins


def test_defaults_to_local_frontend(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert cors_origins() == ["http://localhost:3000"]


def test_reads_comma_separated_list_and_cleans_it(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", " https://zoom-clone.vercel.app/ , http://localhost:3000,")
    assert cors_origins() == ["https://zoom-clone.vercel.app", "http://localhost:3000"]


def test_local_frontend_is_allowed(client):
    response = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_unknown_origin_is_not_allowed(client):
    response = client.get("/api/health", headers={"Origin": "https://evil.example.com"})
    assert "access-control-allow-origin" not in response.headers
