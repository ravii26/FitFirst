"""
FitFirst AI Inventory Service — Image Classifier Engine
Zero-shot visual garment classifier powered by Hugging Face Transformers / CLIP,
with automatic fallback heuristic analysis for high availability.
"""

import io
import math
import statistics
from typing import cast, Dict, List, Tuple, Any
from PIL import Image
import os
from dotenv import load_dotenv

# Load variables from backend/.env or local .env
load_dotenv("../.env")

# Garment tagging goes through AICredits, an OpenAI-compatible gateway (D-18).
AICREDITS_BASE_URL = "https://api.aicredits.in/v1"

# Tagging model. Set AICREDITS_TAG_MODEL in backend/.env to switch without a
# code change, or swap the uncommented line below. All options are low-cost
# and accept images; check the ID and price on aicredits.in before switching.
DEFAULT_TAG_MODEL = "google/gemini-2.5-flash-lite"
# DEFAULT_TAG_MODEL = "openai/gpt-4o-mini"
# DEFAULT_TAG_MODEL = "openai/gpt-4.1-nano"
# DEFAULT_TAG_MODEL = "google/gemini-2.5-flash"


def get_tag_model() -> str:
    """The tagging model in use: AICREDITS_TAG_MODEL if set, else the default."""
    return os.getenv("AICREDITS_TAG_MODEL") or DEFAULT_TAG_MODEL


# Global model references
_clip_model = None
_clip_processor = None
_model_loaded = False
_load_error = None

def init_clip_model():
    """Attempt to load CLIP model lazily."""
    global _clip_model, _clip_processor, _model_loaded, _load_error
    if _model_loaded or _load_error:
        return
    try:
        from transformers import CLIPProcessor, CLIPModel
        model_name = "openai/clip-vit-base-patch32"
        _clip_processor = CLIPProcessor.from_pretrained(model_name)
        _clip_model = CLIPModel.from_pretrained(model_name)
        _model_loaded = True
        print(f"[AI Service] CLIP model successfully loaded: {model_name}")
    except Exception as e:
        _load_error = str(e)
        print(f"[AI Service] Transformers/CLIP not initialized ({e}). Using intelligent visual heuristic engine.")

def _classify_with_clip(image: Image.Image, prompt_dict: Dict[str, str]) -> Dict[str, float]:
    """Run zero-shot visual classification using Hugging Face CLIP."""
    import torch
    
    if _clip_processor is None or _clip_model is None:
        raise ValueError("CLIP model and processor must be initialized before classification")
        
    keys = list(prompt_dict.keys())
    texts = [prompt_dict[k] for k in keys]
    
    inputs = _clip_processor(text=texts, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = _clip_model(**inputs)
        logits_per_image = outputs.logits_per_image # image-text similarity score
        probs = logits_per_image.softmax(dim=1).squeeze(0).tolist()
        
    return {keys[i]: float(probs[i]) for i in range(len(keys))}

def _make_scores(keys: List[str], winner: str, confidence: float) -> Dict[str, float]:
    """
    Build a score dict where `winner` gets exactly `confidence` and the rest of
    `keys` evenly split the remainder. Ensures the branch that decided the
    winner is the branch whose confidence is actually reported — earlier
    versions of this heuristic set multiple candidate scores per branch (e.g.
    EMBROIDERED=0.86 and FLORAL=0.82 together) but since only the max ever
    wins, the lower one was unreachable dead code. Every branch below now
    picks exactly one winner via a real distinguishing signal instead.
    """
    others = [k for k in keys if k != winner]
    remainder = (1 - confidence) / len(others) if others else 0
    return {k: (confidence if k == winner else remainder) for k in keys}


def _texture_orientation(gray_img: Image.Image) -> float:
    """
    Row-variance vs column-variance of a downsampled grayscale image.
    >1 means brightness varies more row-to-row (horizontal banding, e.g.
    stripes); <1 means it varies more column-to-column (vertical banding).
    Near 1 means texture is roughly equal in both directions (e.g. checks).

    Known limitation: a checkerboard whose period happens to resonate with
    the downsample block size can alias into a false strongly-directional
    reading. Real garment photos essentially never have this exact
    pixel-perfect periodicity (lens blur, fabric weave irregularity, and
    JPEG compression all break it), so this is left as-is rather than
    over-fit to a synthetic worst case.
    """
    size = 48
    # BOX resample area-averages each block instead of point-sampling it, which
    # avoids moire/aliasing artifacts that a checkerboard pattern would otherwise
    # produce under nearest/bicubic resampling (that aliasing was previously
    # making checks misread as a strongly directional stripe signal).
    small = gray_img.resize((size, size), resample=Image.Resampling.BOX)
    g = cast(Tuple[int, ...], small.get_flattened_data())
    row_means = [sum(g[r * size:(r + 1) * size]) / size for r in range(size)]
    col_means = [sum(g[c::size]) / size for c in range(size)]
    row_var = statistics.pvariance(row_means)
    col_var = statistics.pvariance(col_means)
    return row_var / (col_var + 1e-5)


def _hue_spread(img: Image.Image, sample_stride: int) -> int:
    """
    Count of distinct dominant hue bins (out of 12) among sufficiently
    saturated/bright pixels. 0-1 means the garment is effectively
    monochrome (solid fabric, or metallic thread on solid fabric); 2+ means
    multiple distinct colors are present (typical of floral/multicolor prints).
    """
    hsv_data = cast(Tuple[Tuple[int, int, int], ...], img.convert("HSV").get_flattened_data())
    hsv_pixels = hsv_data[::sample_stride]
    bins = [0] * 12
    colored_count = 0
    for h, s, v in hsv_pixels:
        if s > 40 and v > 40:
            bins[int(h / (256 / 12)) % 12] += 1
            colored_count += 1
    if colored_count == 0:
        return 0
    return sum(1 for c in bins if c / colored_count > 0.12)


def _classify_with_heuristics(image: Image.Image, prompt_dict: Dict[str, str], attribute_type: str) -> Dict[str, float]:
    """
    Visual feature extractor fallback (RGB, HSV, saturation, aspect ratio,
    texture variance/orientation, hue spread). Guarantees instant responses
    even when offline or before CLIP weights download — but it is a coarse
    proxy, not real garment recognition, so confidence values below are kept
    conservative except where the signal is genuinely strong (e.g. solid vs
    patterned, or a clearly light/dark/saturated color).

    Known limitation: Category has no reliable heuristic signal to
    distinguish DHOTI, DUPATTA, ACCESSORIES, or SKIRT from their nearest
    neighbors (draped/flat garments of similar aspect ratio and color), so
    those four values are structurally unreachable via this fallback and
    require the real CLIP model to be produced.
    """
    img = image.convert("RGB")
    width, height = img.size
    aspect_ratio = width / max(height, 1)

    pixels = cast(Tuple[Tuple[int, int, int], ...], img.get_flattened_data())
    stride = max(1, len(pixels) // 2000)
    sample_pixels = pixels[::stride]  # sample ~2000 pixels

    r_avg = sum(p[0] for p in sample_pixels) / len(sample_pixels)
    g_avg = sum(p[1] for p in sample_pixels) / len(sample_pixels)
    b_avg = sum(p[2] for p in sample_pixels) / len(sample_pixels)

    # Lightness and Saturation (of the *averaged* color — meaningful for
    # near-uniform fabric, but a genuinely multicolor print averages toward
    # gray regardless of how vivid its individual pixels are, so this alone
    # cannot tell "vivid multicolor" apart from "dull/faded"; see pixel_sat).
    max_c = max(r_avg, g_avg, b_avg)
    min_c = min(r_avg, g_avg, b_avg)
    lum = (max_c + min_c) / 2
    sat = (max_c - min_c) / (max_c + 1e-5)

    # Mean of each sampled pixel's OWN saturation — reflects true colorfulness
    # even when hues vary too much for the averaged color to look saturated.
    pixel_sat = sum(
        (max(p) - min(p)) / (max(p) + 1e-5) for p in sample_pixels
    ) / len(sample_pixels)

    # Texture variance (pattern detection)
    gray = img.convert("L")
    gray_pixels = cast(Tuple[int, ...], gray.get_flattened_data())[::stride]
    mean_g = sum(gray_pixels) / len(gray_pixels)
    variance = sum((p - mean_g) ** 2 for p in gray_pixels) / len(gray_pixels)
    std_dev = math.sqrt(variance)

    keys = list(prompt_dict.keys())

    if attribute_type == "colorFamily":
        if lum > 220 and sat < 0.15:
            return _make_scores(keys, "WHITE", 0.85)
        if lum > 190 and sat < 0.25 and (r_avg > b_avg):
            return _make_scores(keys, "CREAM_IVORY", 0.75)
        if lum > 170 and sat < 0.4:
            return _make_scores(keys, "LIGHT_PASTELS", 0.70)
        if lum < 60:
            return _make_scores(keys, "DARK_NEUTRAL", 0.80)
        if r_avg > g_avg + 30 and r_avg > b_avg + 30:
            return _make_scores(keys, "BRIGHT_WARM", 0.75)
        if (b_avg > r_avg + 20 and g_avg > r_avg + 20) or (r_avg > 100 and b_avg > 100 and g_avg < 80):
            return _make_scores(keys, "JEWEL_TONES", 0.65)
        if b_avg > r_avg + 30:
            return _make_scores(keys, "BRIGHT_COOL", 0.70)
        if r_avg > 120 and g_avg > 90 and b_avg < 80:
            return _make_scores(keys, "WARM_EARTH", 0.65)
        return _make_scores(keys, "MULTICOLOR", 0.55)

    if attribute_type == "pattern":
        hue_spread = _hue_spread(img, stride)
        orientation = _texture_orientation(gray)

        if std_dev < 16:
            return _make_scores(keys, "SOLID", 0.80)

        # Near-monochrome textures (background + one line/thread color) are
        # checked for structured/geometric signatures first — real stripes,
        # checks, and block prints are usually 1-2 dominant hues. Multi-hue
        # textures skip straight to the organic-print branches below, since a
        # busy multicolor pattern is essentially never a literal checkerboard.
        if hue_spread <= 1:
            if orientation > 2.2 or orientation < 0.45:
                return _make_scores(keys, "STRIPES", 0.45)
            if 0.6 <= orientation <= 1.6 and std_dev > 55:
                return _make_scores(keys, "GEOMETRIC", 0.35)
            if 0.6 <= orientation <= 1.6 and std_dev > 30:
                return _make_scores(keys, "CHECKS", 0.45)
            if std_dev > 30:
                # Busy texture but effectively one hue and no clear grid —
                # usually thread-on-fabric embroidery rather than a print.
                return _make_scores(keys, "EMBROIDERED", 0.45)
            return _make_scores(keys, "BLOCK_PRINT", 0.30)

        if hue_spread == 2:
            return _make_scores(keys, "PAISLEY", 0.30)
        if pixel_sat > 0.35:
            return _make_scores(keys, "FLORAL", 0.40)
        if std_dev > 45:
            return _make_scores(keys, "ANIMAL_PRINT", 0.25)
        return _make_scores(keys, "ABSTRACT", 0.25)

    if attribute_type == "category":
        kids_palette = lum > 150 and pixel_sat > 0.45 and _hue_spread(img, stride) >= 2
        festive = std_dev > 35

        if aspect_ratio < 0.5:
            if kids_palette:
                return _make_scores(keys, "KIDS_DRESS", 0.35)
            return _make_scores(keys, "LEHENGA" if festive else "SAREE", 0.40)
        if aspect_ratio < 0.75:
            if kids_palette:
                return _make_scores(keys, "KIDS_KURTA", 0.35)
            return _make_scores(keys, "SALWAR_KAMEEZ" if festive else "KURTA", 0.40)
        if aspect_ratio < 1.0:
            if kids_palette:
                return _make_scores(keys, "KIDS_SHIRT", 0.30)
            return _make_scores(keys, "SHERWANI" if festive else "DRESS", 0.35)
        if aspect_ratio < 1.6:
            if kids_palette:
                return _make_scores(keys, "KIDS_TROUSERS", 0.30)
            return _make_scores(keys, "JACKET" if festive else "SHIRT", 0.40)
        # Very wide, laid-flat garment shot
        return _make_scores(keys, "JEANS" if lum < 90 else "TROUSERS", 0.35)

    if attribute_type == "fitType":
        festive = sat > 0.45

        if aspect_ratio < 0.45:
            return _make_scores(keys, "WRAPAROUND", 0.40)
        if aspect_ratio < 0.65:
            return _make_scores(keys, "FLARED_ANARKALI" if std_dev > 30 else "A_LINE", 0.40)
        if aspect_ratio < 0.85:
            return _make_scores(keys, "STRAIGHT_CUT" if festive else "REGULAR", 0.40)
        if aspect_ratio < 1.1:
            return _make_scores(keys, "RELAXED_LOOSE", 0.35)
        if aspect_ratio < 1.4:
            return _make_scores(keys, "SLIM" if lum < 100 else "REGULAR", 0.40)
        return _make_scores(keys, "TAILORED_STRUCTURED", 0.45)

    if attribute_type == "gender":
        if lum > 150 and pixel_sat > 0.45 and _hue_spread(img, stride) >= 2:
            return _make_scores(keys, "KIDS", 0.40)
        if aspect_ratio < 0.65:
            return _make_scores(keys, "WOMEN", 0.75)
        if aspect_ratio > 1.1:
            return _make_scores(keys, "MEN", 0.70)
        return _make_scores(keys, "UNISEX", 0.55)

    # Unknown attribute_type — uniform distribution rather than a fabricated winner.
    return {k: 1 / len(keys) for k in keys}

def predict_attribute(image: Image.Image, prompt_dict: Dict[str, str], attribute_type: str) -> Dict[str, Any]:
    """
    Predict single attribute (category, color, pattern, fit, or gender).
    Returns dict with top prediction, confidence, and all candidate scores.
    """
    init_clip_model()

    engine = "heuristic"
    if _model_loaded and _clip_model is not None:
        try:
            scores = _classify_with_clip(image, prompt_dict)
            engine = "clip"
        except Exception as e:
            print(f"Fallback to heuristic classifier for {attribute_type}: {e}")
            scores = _classify_with_heuristics(image, prompt_dict, attribute_type)
    else:
        scores = _classify_with_heuristics(image, prompt_dict, attribute_type)

    best_enum = max(scores, key=lambda k: scores[k])
    confidence = round(scores[best_enum], 4)

    return {
        "value": best_enum,
        "confidence": confidence,
        "all_scores": scores,
        "engine": engine,
    }


def _parse_json_reply(text: str) -> Dict[str, Any]:
    """Parse the model's JSON reply, tolerating a ```json code fence around it."""
    import json

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else ""
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)


def classify_all_with_ai(image: Image.Image) -> Dict[str, Dict[str, Any]]:
    """
    Perform single-shot multi-attribute visual classification through AICredits.
    Returns structured results for category, colorFamily, pattern, fitType, and gender.
    Uses exactly one model (get_tag_model()); a failure raises instead of
    quietly trying other models.
    """
    from openai import OpenAI
    import base64
    import json
    from prompts import (
        CATEGORY_PROMPTS,
        COLOR_PROMPTS,
        PATTERN_PROMPTS,
        FIT_PROMPTS,
        GENDER_PROMPTS,
    )

    api_key = os.getenv("AICREDITS_API_KEY")
    if not api_key:
        raise ValueError("AICREDITS_API_KEY environment variable is not set")

    model_name = get_tag_model()
    client = OpenAI(api_key=api_key, base_url=AICREDITS_BASE_URL, timeout=30.0, max_retries=1)

    prompt = f"""
You are an expert AI garment cataloger for a high-end apparel atelier.
Analyze the provided garment photo and classify the following 5 attributes.

You MUST choose EXACTLY ONE enum value from each allowed list:

1. CATEGORY: {list(CATEGORY_PROMPTS.keys())}
Descriptions:
{json.dumps(CATEGORY_PROMPTS, indent=2)}

2. COLOR_FAMILY: {list(COLOR_PROMPTS.keys())}
Descriptions:
{json.dumps(COLOR_PROMPTS, indent=2)}

3. PATTERN: {list(PATTERN_PROMPTS.keys())}
Descriptions:
{json.dumps(PATTERN_PROMPTS, indent=2)}

4. FIT_TYPE: {list(FIT_PROMPTS.keys())}
Descriptions:
{json.dumps(FIT_PROMPTS, indent=2)}

5. GENDER: {list(GENDER_PROMPTS.keys())}
Descriptions:
{json.dumps(GENDER_PROMPTS, indent=2)}

Return a valid JSON object with the following schema:
{{
  "category": {{"value": "<CATEGORY_ENUM>", "confidence": 0.95}},
  "colorFamily": {{"value": "<COLOR_FAMILY_ENUM>", "confidence": 0.95}},
  "pattern": {{"value": "<PATTERN_ENUM>", "confidence": 0.95}},
  "fitType": {{"value": "<FIT_TYPE_ENUM>", "confidence": 0.95}},
  "gender": {{"value": "<GENDER_ENUM>", "confidence": 0.95}}
}}
"""

    buf = io.BytesIO()
    image.save(buf, format="PNG")
    data_url = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    try:
        response = client.chat.completions.create(
            model=model_name,
            temperature=0.1,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url}},
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        )
    except Exception as e:
        raise RuntimeError(f"AICredits call failed for model {model_name}: {e}") from e

    text = response.choices[0].message.content if response.choices else None
    if not text:
        raise RuntimeError(f"AICredits returned an empty reply for model {model_name}")
    try:
        raw = _parse_json_reply(text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"AICredits reply from model {model_name} was not valid JSON: {e}") from e

    # Report the model the gateway says actually answered, not just the one requested.
    engine = f"aicredits ({response.model or model_name})"

    def format_res(key, prompt_map):
        item = raw.get(key, {})
        val = item.get("value", "")
        conf = float(item.get("confidence", 0.95))
        if val not in prompt_map:
            val = list(prompt_map.keys())[0]
        scores = _make_scores(list(prompt_map.keys()), val, conf)
        return {
            "value": val,
            "confidence": round(conf, 4),
            "all_scores": scores,
            "engine": engine,
        }

    return {
        "category": format_res("category", CATEGORY_PROMPTS),
        "colorFamily": format_res("colorFamily", COLOR_PROMPTS),
        "pattern": format_res("pattern", PATTERN_PROMPTS),
        "fitType": format_res("fitType", FIT_PROMPTS),
        "gender": format_res("gender", GENDER_PROMPTS),
    }


def model_status() -> Dict[str, Any]:
    """Report whether the AICredits key is configured, which model tags, and CLIP state."""
    init_clip_model()
    ai_key_present = bool(os.getenv("AICREDITS_API_KEY"))
    return {
        "ai_enabled": ai_key_present,
        "ai_provider": "aicredits",
        "tag_model": get_tag_model(),
        "clip_loaded": _model_loaded,
        "load_error": _load_error,
        "active_engine": "aicredits" if ai_key_present else ("clip" if _model_loaded else "heuristic"),
    }

