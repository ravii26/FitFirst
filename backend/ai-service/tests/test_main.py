import io
import sys
from pathlib import Path

import pytest
from PIL import Image
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import main


def make_jpeg_bytes(size=(64, 64), color=(200, 40, 40)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="JPEG")
    return buf.getvalue()


client = TestClient(main.app)


def test_health_reports_clip_status():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "clip_loaded" in body
    assert "load_error" in body
    assert body["ai_provider"] == "aicredits"
    assert "tag_model" in body


def test_scan_rejects_non_image_content_type():
    res = client.post(
        "/scan",
        files={"file": ("notes.txt", b"just some text", "text/plain")},
    )
    assert res.status_code == 400


def test_scan_rejects_bytes_that_are_not_a_real_image():
    # Header claims image/jpeg but the bytes are not decodable image data —
    # the Python service has no magic-byte check of its own (that lives in
    # the Node proxy), so this must be caught by the PIL decode failing.
    res = client.post(
        "/scan",
        files={"file": ("fake.jpg", b"<script>not an image</script>", "image/jpeg")},
    )
    assert res.status_code == 400


def test_scan_accepts_real_image_and_returns_all_attributes(monkeypatch):
    # Never make a real, paid AI call from the test suite.
    monkeypatch.delenv("AICREDITS_API_KEY", raising=False)
    res = client.post(
        "/scan",
        files={"file": ("garment.jpg", make_jpeg_bytes(), "image/jpeg")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["ai_status"] == "off"
    for attr in ("category", "colorFamily", "pattern", "fitType", "gender"):
        assert attr in body
        assert set(body[attr].keys()) == {"value", "confidence", "all_scores", "engine", "needs_review"}
        assert 0.0 <= body[attr]["confidence"] <= 1.0
        assert body[attr]["needs_review"] is False


def test_scan_rejects_oversized_upload(monkeypatch):
    monkeypatch.setattr(main, "MAX_UPLOAD_BYTES", 100)
    res = client.post(
        "/scan",
        files={"file": ("garment.jpg", make_jpeg_bytes(), "image/jpeg")},
    )
    assert res.status_code == 413


# --- S05-03: AI failure is reported, never silent ---

@pytest.fixture
def fresh_status(monkeypatch):
    monkeypatch.setattr(main, "_last_scan", {"ai_status": None, "engine": None, "ai_error": None, "at": None})


def scan():
    return client.post("/scan", files={"file": ("garment.jpg", make_jpeg_bytes(), "image/jpeg")})


def fake_ai_results(engine="aicredits (test-model)"):
    attr = {"value": "", "confidence": 0.0, "all_scores": {}, "engine": engine, "needs_review": True}
    return {k: dict(attr) for k in ("category", "colorFamily", "pattern", "fitType", "gender")}


def test_no_key_reports_ai_off(monkeypatch, fresh_status):
    monkeypatch.delenv("AICREDITS_API_KEY", raising=False)
    body = scan().json()
    assert body["ai_status"] == "off"
    assert body["ai_error"] is None
    health = client.get("/health").json()
    assert health["ai_status"] == "off"
    assert health["active_engine"] in ("clip", "heuristic")


def test_health_before_any_scan_says_not_tried(monkeypatch, fresh_status):
    monkeypatch.setenv("AICREDITS_API_KEY", "test-key")
    health = client.get("/health").json()
    assert health["ai_status"] == "not_tried"
    assert health["last_scan_at"] is None


def test_ai_failure_is_reported_on_scan_and_health(monkeypatch, fresh_status):
    monkeypatch.setenv("AICREDITS_API_KEY", "secret-key-123")

    def boom(image):
        raise RuntimeError("AICredits call failed: 401 bad key secret-key-123")

    monkeypatch.setattr(main, "classify_all_with_ai", boom)
    res = scan()
    assert res.status_code == 200
    body = res.json()
    assert body["ai_status"] == "failed"
    assert "401" in body["ai_error"]
    assert "secret-key-123" not in body["ai_error"]
    # The guessed tags say which engine really produced them.
    assert body["category"]["engine"] in ("clip", "heuristic")

    health = client.get("/health").json()
    assert health["ai_status"] == "failed"
    assert health["active_engine"] in ("clip", "heuristic")
    assert "401" in health["last_ai_error"]
    assert "secret-key-123" not in health["last_ai_error"]
    assert health["last_scan_at"]


def test_ai_success_is_reported_on_scan_and_health(monkeypatch, fresh_status):
    monkeypatch.setenv("AICREDITS_API_KEY", "test-key")
    monkeypatch.setattr(main, "classify_all_with_ai", lambda image: fake_ai_results())
    body = scan().json()
    assert body["ai_status"] == "ok"
    health = client.get("/health").json()
    assert health["ai_status"] == "ok"
    assert health["active_engine"] == "aicredits (test-model)"
    assert health["last_ai_error"] is None
