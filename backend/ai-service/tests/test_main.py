import io
import sys
from pathlib import Path

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
