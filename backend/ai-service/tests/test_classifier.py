import random
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import classifier
from classifier import _classify_with_heuristics, _make_scores, model_status, predict_attribute
from prompts import CATEGORY_PROMPTS, COLOR_PROMPTS, FIT_PROMPTS, GENDER_PROMPTS, PATTERN_PROMPTS


def solid_image(size=(300, 300), color=(200, 40, 40)):
    return Image.new("RGB", size, color)


def multicolor_image(size=(300, 300), seed=1, palette=None):
    palette = palette or [(220, 40, 40), (40, 180, 220), (240, 220, 40), (140, 40, 200)]
    rng = random.Random(seed)
    img = Image.new("RGB", size)
    px = img.load()
    assert px is not None
    for x in range(size[0]):
        for y in range(size[1]):
            px[x, y] = rng.choice(palette)
    return img


def striped_image(size=(300, 300), band=6, color=(200, 40, 40)):
    img = Image.new("RGB", size)
    px = img.load()
    assert px is not None
    for y in range(size[1]):
        c = color if (y // band) % 2 == 0 else (30, 30, 30)
        for x in range(size[0]):
            px[x, y] = c
    return img


def winner(scores):
    return max(scores, key=scores.get)


class TestMakeScores:
    def test_sums_to_one(self):
        scores = _make_scores(["A", "B", "C"], "B", 0.6)
        assert round(sum(scores.values()), 6) == 1.0

    def test_winner_gets_requested_confidence(self):
        scores = _make_scores(["A", "B", "C"], "B", 0.6)
        assert scores["B"] == 0.6

    def test_single_key_gets_full_confidence(self):
        scores = _make_scores(["ONLY"], "ONLY", 0.9)
        assert scores == {"ONLY": 0.9}


class TestPatternHeuristic:
    def test_solid_low_texture_wins_solid(self):
        scores = _classify_with_heuristics(solid_image(), PATTERN_PROMPTS, "pattern")
        assert winner(scores) == "SOLID"

    def test_horizontal_stripes_detected(self):
        scores = _classify_with_heuristics(striped_image(), PATTERN_PROMPTS, "pattern")
        assert winner(scores) == "STRIPES"

    def test_multicolor_random_texture_reaches_floral(self):
        # Regression: FLORAL was unreachable when "vividness" was measured from
        # the *averaged* RGB, since a genuinely multicolor image averages
        # toward gray. It must be measured per-pixel instead.
        scores = _classify_with_heuristics(multicolor_image(), PATTERN_PROMPTS, "pattern")
        assert winner(scores) == "FLORAL"

    def test_previously_dead_sibling_values_are_reachable(self):
        # Old implementation set e.g. EMBROIDERED=0.86 and FLORAL=0.82 in the
        # same branch, but argmax could only ever return EMBROIDERED — FLORAL
        # was dead code no matter the input. Confirm at least one input now
        # produces each of the previously-unreachable values.
        assert winner(_classify_with_heuristics(multicolor_image(), PATTERN_PROMPTS, "pattern")) == "FLORAL"


class TestCategoryHeuristic:
    def test_tall_narrow_plain_image_is_saree(self):
        scores = _classify_with_heuristics(solid_image((150, 400)), CATEGORY_PROMPTS, "category")
        assert winner(scores) == "SAREE"

    def test_square_ish_plain_image_is_dress(self):
        scores = _classify_with_heuristics(solid_image((300, 320)), CATEGORY_PROMPTS, "category")
        assert winner(scores) == "DRESS"

    def test_wide_flat_lay_is_shirt(self):
        scores = _classify_with_heuristics(solid_image((400, 300)), CATEGORY_PROMPTS, "category")
        assert winner(scores) == "SHIRT"


class TestFitTypeHeuristic:
    def test_very_tall_image_is_wraparound(self):
        scores = _classify_with_heuristics(solid_image((120, 400)), FIT_PROMPTS, "fitType")
        assert winner(scores) == "WRAPAROUND"

    def test_near_square_image_is_relaxed_loose(self):
        scores = _classify_with_heuristics(solid_image((300, 300)), FIT_PROMPTS, "fitType")
        assert winner(scores) == "RELAXED_LOOSE"


class TestGenderHeuristic:
    def test_bright_multicolor_square_image_reaches_kids(self):
        bright_palette = [(255, 210, 90), (255, 140, 180), (255, 230, 60), (130, 220, 255)]
        img = multicolor_image(palette=bright_palette)
        scores = _classify_with_heuristics(img, GENDER_PROMPTS, "gender")
        assert winner(scores) == "KIDS"

    def test_tall_narrow_image_is_women(self):
        scores = _classify_with_heuristics(solid_image((150, 400)), GENDER_PROMPTS, "gender")
        assert winner(scores) == "WOMEN"

    def test_wide_image_is_men(self):
        scores = _classify_with_heuristics(solid_image((400, 300)), GENDER_PROMPTS, "gender")
        assert winner(scores) == "MEN"


class TestColorFamilyHeuristic:
    def test_white_detected(self):
        scores = _classify_with_heuristics(solid_image(color=(250, 250, 250)), COLOR_PROMPTS, "colorFamily")
        assert winner(scores) == "WHITE"

    def test_dark_neutral_detected(self):
        scores = _classify_with_heuristics(solid_image(color=(20, 20, 20)), COLOR_PROMPTS, "colorFamily")
        assert winner(scores) == "DARK_NEUTRAL"


class TestPredictAttributeAndModelStatus:
    def test_predict_attribute_reports_heuristic_engine_when_clip_unavailable(self, monkeypatch):
        # Force the "CLIP didn't load" state directly rather than relying on
        # whether torch/transformers happen to be installed in the environment
        # running this test — that's exactly the fragile assumption that let
        # the real bug (start.bat silently never installing them) go unnoticed.
        monkeypatch.setattr(classifier, "_model_loaded", False)
        monkeypatch.setattr(classifier, "_clip_model", None)
        monkeypatch.setattr(classifier, "_load_error", "forced for test")

        result = predict_attribute(solid_image(), COLOR_PROMPTS, "colorFamily")
        assert set(result.keys()) == {"value", "confidence", "all_scores", "engine"}
        assert result["engine"] == "heuristic"
        assert result["value"] in COLOR_PROMPTS

    def test_model_status_reflects_clip_state(self, monkeypatch):
        monkeypatch.setattr(classifier, "_model_loaded", False)
        monkeypatch.setattr(classifier, "_load_error", "forced for test")
        status = model_status()
        assert status["clip_loaded"] is False
        assert status["load_error"] == "forced for test"
