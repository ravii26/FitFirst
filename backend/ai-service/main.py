"""
FitFirst AI Inventory Service — FastAPI Server
Exposes /scan endpoint for instant zero-shot visual tagging of garment photos.
"""

import os
import io
from datetime import datetime, timezone
from typing import Literal, Optional
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from prompts import (
    CATEGORY_PROMPTS,
    COLOR_PROMPTS,
    PATTERN_PROMPTS,
    FIT_PROMPTS,
    GENDER_PROMPTS,
)
from classifier import predict_attribute, classify_all_with_ai, model_status

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # matches the Node proxy's multipart limit

app = FastAPI(
    title="FitFirst AI Garment Scanner",
    version="1.0.0",
    description="Vision AI microservice for instant garment attribute tagging",
)

# Enable CORS for Fastify backend and dashboard local development.
# allow_credentials is False because this service is only ever called
# server-to-server (from the Node backend), not directly from a browser;
# combining allow_origins=["*"] with allow_credentials=True is invalid
# per the CORS spec and rejected by browsers anyway.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AttributeResult(BaseModel):
    value: str
    confidence: float
    all_scores: dict[str, float]
    engine: str
    # True when the AI answer was missing or not an allowed value; value is then "".
    needs_review: bool = False

class ScanResponse(BaseModel):
    category: AttributeResult
    colorFamily: AttributeResult
    pattern: AttributeResult
    fitType: AttributeResult
    gender: AttributeResult
    # "ok": the AI tagged this image. "off": no AI key, so the tags are a
    # CLIP/heuristic guess. "failed": the AI call failed and the tags are a guess.
    ai_status: Literal["ok", "off", "failed"]
    ai_error: Optional[str] = None


# Outcome of the most recent /scan, so /health reports what really happened
# rather than what is configured.
_last_scan: dict = {"ai_status": None, "engine": None, "ai_error": None, "at": None}


def _safe_error(err: Exception) -> str:
    """A short error message for staff, with the API key removed if it appears."""
    text = str(err) or err.__class__.__name__
    key = os.getenv("AICREDITS_API_KEY")
    if key:
        text = text.replace(key, "[key]")
    return text[:300]


def _record_scan(ai_status: str, engine: str, ai_error: Optional[str]) -> None:
    _last_scan.update(
        ai_status=ai_status,
        engine=engine,
        ai_error=ai_error,
        at=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/health")
async def health_check():
    status = model_status()
    if not status["ai_enabled"]:
        ai_status = "off"
    else:
        ai_status = _last_scan["ai_status"] or "not_tried"
    return {
        "status": "ok",
        "service": "FitFirst AI Garment Scanner",
        # "off" (no key) | "not_tried" (no scan since start) | "ok" | "failed"
        "ai_status": ai_status,
        "ai_enabled": status["ai_enabled"],
        "ai_provider": status["ai_provider"],
        "tag_model": status["tag_model"],
        # The engine the last scan actually used; before any scan, the one it will try.
        "active_engine": _last_scan["engine"] or status["active_engine"],
        "last_scan_at": _last_scan["at"],
        "last_ai_error": _last_scan["ai_error"],
        "clip_loaded": status["clip_loaded"],
        "load_error": status["load_error"],
    }

@app.post("/scan", response_model=ScanResponse)
async def scan_garment(file: UploadFile = File(...)):
    """
    Accepts a garment image upload (JPEG/PNG/WEBP) and returns AI-predicted enums:
    Category, ColorFamily, Pattern, FitType, and Gender.
    """
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 10MB upload limit.")

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(err)}")

    # Use the AI tagger (via AICredits) when its key is configured
    ai_status = "off"
    ai_error = None
    if os.getenv("AICREDITS_API_KEY"):
        try:
            results = classify_all_with_ai(image)
            _record_scan("ok", results["category"]["engine"], None)
            return ScanResponse(
                category=AttributeResult(**results["category"]),
                colorFamily=AttributeResult(**results["colorFamily"]),
                pattern=AttributeResult(**results["pattern"]),
                fitType=AttributeResult(**results["fitType"]),
                gender=AttributeResult(**results["gender"]),
                ai_status="ok",
            )
        except Exception as err:
            ai_status = "failed"
            ai_error = _safe_error(err)
            print(f"[AI Service] WARNING: AI tagging failed ({ai_error}). Returning CLIP/heuristic guesses.")

    # Fallback to local CLIP / Visual Heuristics
    category = predict_attribute(image, CATEGORY_PROMPTS, "category")
    color_family = predict_attribute(image, COLOR_PROMPTS, "colorFamily")
    pattern = predict_attribute(image, PATTERN_PROMPTS, "pattern")
    fit_type = predict_attribute(image, FIT_PROMPTS, "fitType")
    gender = predict_attribute(image, GENDER_PROMPTS, "gender")

    _record_scan(ai_status, category["engine"], ai_error)
    return ScanResponse(
        category=AttributeResult(**category),
        colorFamily=AttributeResult(**color_family),
        pattern=AttributeResult(**pattern),
        fitType=AttributeResult(**fit_type),
        gender=AttributeResult(**gender),
        ai_status=ai_status,
        ai_error=ai_error,
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
