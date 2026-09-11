"""
FitFirst AI Inventory Service — FastAPI Server
Exposes /scan endpoint for instant zero-shot visual tagging of garment photos.
"""

import os
import io
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
from classifier import predict_attribute, classify_all_with_gemini, model_status

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

class ScanResponse(BaseModel):
    category: AttributeResult
    colorFamily: AttributeResult
    pattern: AttributeResult
    fitType: AttributeResult
    gender: AttributeResult

@app.get("/health")
async def health_check():
    status = model_status()
    return {
        "status": "ok",
        "service": "FitFirst AI Garment Scanner",
        "gemini_enabled": status["gemini_enabled"],
        "active_engine": status["active_engine"],
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

    # Check if Gemini Vision API key is available
    if os.getenv("GEMINI_API_KEY"):
        try:
            results = classify_all_with_gemini(image)
            return ScanResponse(
                category=AttributeResult(**results["category"]),
                colorFamily=AttributeResult(**results["colorFamily"]),
                pattern=AttributeResult(**results["pattern"]),
                fitType=AttributeResult(**results["fitType"]),
                gender=AttributeResult(**results["gender"]),
            )
        except Exception as err:
            print(f"[AI Service] Gemini multi-attribute scan failed ({err}). Falling back to CLIP/heuristics.")

    # Fallback to local CLIP / Visual Heuristics
    category = predict_attribute(image, CATEGORY_PROMPTS, "category")
    color_family = predict_attribute(image, COLOR_PROMPTS, "colorFamily")
    pattern = predict_attribute(image, PATTERN_PROMPTS, "pattern")
    fit_type = predict_attribute(image, FIT_PROMPTS, "fitType")
    gender = predict_attribute(image, GENDER_PROMPTS, "gender")

    return ScanResponse(
        category=AttributeResult(**category),
        colorFamily=AttributeResult(**color_family),
        pattern=AttributeResult(**pattern),
        fitType=AttributeResult(**fit_type),
        gender=AttributeResult(**gender),
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
