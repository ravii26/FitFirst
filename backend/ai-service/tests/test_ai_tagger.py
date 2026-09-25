import json
import sys
from pathlib import Path
from types import SimpleNamespace

import openai
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import classifier
from classifier import classify_all_with_ai, get_tag_model, model_status


VALID_REPLY = {
    "category": {"value": "SAREE", "confidence": 0.9},
    "colorFamily": {"value": "BRIGHT_WARM", "confidence": 0.8},
    "pattern": {"value": "SOLID", "confidence": 0.7},
    "fitType": {"value": "REGULAR", "confidence": 0.6},
    "gender": {"value": "WOMEN", "confidence": 0.95},
}


class FakeClient:
    """Stands in for openai.OpenAI and records what the tagger sent."""

    calls = []
    reply_text = json.dumps(VALID_REPLY)
    reply_model = None
    error = None

    def __init__(self, **kwargs):
        FakeClient.init_kwargs = kwargs
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        FakeClient.calls.append(kwargs)
        if FakeClient.error:
            raise FakeClient.error
        message = SimpleNamespace(content=FakeClient.reply_text)
        return SimpleNamespace(
            choices=[SimpleNamespace(message=message)],
            model=FakeClient.reply_model or kwargs["model"],
        )


@pytest.fixture
def fake_client(monkeypatch):
    FakeClient.calls = []
    FakeClient.reply_text = json.dumps(VALID_REPLY)
    FakeClient.reply_model = None
    FakeClient.error = None
    monkeypatch.setattr(openai, "OpenAI", FakeClient)
    monkeypatch.setenv("AICREDITS_API_KEY", "test-key")
    monkeypatch.delenv("AICREDITS_TAG_MODEL", raising=False)
    return FakeClient


def image():
    return Image.new("RGB", (32, 32), (200, 40, 40))


def test_default_model_is_used_when_env_unset(fake_client):
    result = classify_all_with_ai(image())
    assert fake_client.calls[0]["model"] == classifier.DEFAULT_TAG_MODEL
    assert result["category"]["engine"] == f"aicredits ({classifier.DEFAULT_TAG_MODEL})"


def test_env_var_overrides_model(fake_client, monkeypatch):
    monkeypatch.setenv("AICREDITS_TAG_MODEL", "openai/gpt-4o-mini")
    assert get_tag_model() == "openai/gpt-4o-mini"
    result = classify_all_with_ai(image())
    assert fake_client.calls[0]["model"] == "openai/gpt-4o-mini"
    assert result["pattern"]["engine"] == "aicredits (openai/gpt-4o-mini)"


def test_calls_aicredits_gateway_with_image(fake_client):
    classify_all_with_ai(image())
    assert fake_client.init_kwargs["base_url"] == "https://api.aicredits.in/v1"
    assert fake_client.init_kwargs["api_key"] == "test-key"
    content = fake_client.calls[0]["messages"][0]["content"]
    assert content[0]["image_url"]["url"].startswith("data:image/png;base64,")


def test_engine_reports_model_the_gateway_actually_used(fake_client):
    fake_client.reply_model = "google/gemini-2.5-flash-lite-001"
    result = classify_all_with_ai(image())
    assert result["gender"]["engine"] == "aicredits (google/gemini-2.5-flash-lite-001)"


def test_reply_wrapped_in_code_fence_is_parsed(fake_client):
    fake_client.reply_text = "```json\n" + json.dumps(VALID_REPLY) + "\n```"
    result = classify_all_with_ai(image())
    assert result["colorFamily"]["value"] == "BRIGHT_WARM"


def test_failure_raises_after_one_model_without_trying_others(fake_client):
    fake_client.error = RuntimeError("model not found")
    with pytest.raises(RuntimeError, match=classifier.DEFAULT_TAG_MODEL):
        classify_all_with_ai(image())
    assert len(fake_client.calls) == 1


def test_missing_key_raises(fake_client, monkeypatch):
    monkeypatch.delenv("AICREDITS_API_KEY")
    with pytest.raises(ValueError, match="AICREDITS_API_KEY"):
        classify_all_with_ai(image())


def test_model_status_reports_provider_and_model(fake_client, monkeypatch):
    monkeypatch.setenv("AICREDITS_TAG_MODEL", "openai/gpt-4.1-nano")
    status = model_status()
    assert status["ai_enabled"] is True
    assert status["ai_provider"] == "aicredits"
    assert status["tag_model"] == "openai/gpt-4.1-nano"
    assert status["active_engine"] == "aicredits"


# --- S05-02: response schema and "needs review" instead of a guessed enum ---

def test_request_sends_enum_schema_by_default(fake_client):
    classify_all_with_ai(image())
    fmt = fake_client.calls[0]["response_format"]
    assert fmt["type"] == "json_schema"
    schema = fmt["json_schema"]["schema"]
    assert set(schema["required"]) == {"category", "colorFamily", "pattern", "fitType", "gender"}
    assert "SAREE" in schema["properties"]["category"]["properties"]["value"]["enum"]


def test_schema_can_be_switched_off(fake_client, monkeypatch):
    monkeypatch.setenv("AICREDITS_JSON_SCHEMA", "0")
    classify_all_with_ai(image())
    assert "response_format" not in fake_client.calls[0]


def test_valid_reply_is_not_flagged(fake_client):
    result = classify_all_with_ai(image())
    for attr in result.values():
        assert attr["needs_review"] is False
    assert result["category"]["value"] == "SAREE"


def test_invalid_value_becomes_empty_and_needs_review(fake_client):
    bad = dict(VALID_REPLY, category={"value": "SPACESUIT", "confidence": 0.99})
    fake_client.reply_text = json.dumps(bad)
    result = classify_all_with_ai(image())
    cat = result["category"]
    assert cat["value"] == ""
    assert cat["needs_review"] is True
    assert cat["confidence"] == 0.0
    assert set(cat["all_scores"].values()) == {0.0}
    # The other attributes are unaffected.
    assert result["gender"] == {**result["gender"], "value": "WOMEN", "needs_review": False}


@pytest.mark.parametrize(
    "item",
    [
        None,                                      # attribute missing
        "SAREE",                                   # not an object
        {"confidence": 0.9},                       # value missing
        {"value": None, "confidence": 0.9},        # value not a string
        {"value": "SAREE"},                        # confidence missing
        {"value": "SAREE", "confidence": "high"},  # confidence not a number
    ],
)
def test_malformed_attribute_needs_review(fake_client, item):
    bad = dict(VALID_REPLY)
    if item is None:
        del bad["category"]
    else:
        bad["category"] = item
    fake_client.reply_text = json.dumps(bad)
    cat = classify_all_with_ai(image())["category"]
    assert cat["value"] == ""
    assert cat["needs_review"] is True


def test_confidence_is_clamped_to_unit_range(fake_client):
    bad = dict(VALID_REPLY, pattern={"value": "SOLID", "confidence": 7})
    fake_client.reply_text = json.dumps(bad)
    pat = classify_all_with_ai(image())["pattern"]
    assert pat["confidence"] == 1.0
    assert pat["needs_review"] is False


def test_reply_that_is_not_an_object_flags_every_attribute(fake_client):
    fake_client.reply_text = json.dumps(["SAREE"])
    result = classify_all_with_ai(image())
    assert all(attr["needs_review"] and attr["value"] == "" for attr in result.values())
