// Attribute Entry Screen — Phase 1 manual version
// Customer self-selects skin tone and body shape using illustrated reference tiles.
// Phase 2 will replace this with camera-derived estimation (MediaPipe).

import { useState } from "react";

type SkinTone = "FAIR" | "WHEATISH" | "MEDIUM" | "DEEP";
type BodyShape = "RECTANGLE" | "TRIANGLE" | "INVERTED_T" | "HOURGLASS";

const SKIN_TONES: { value: SkinTone; label: string; sub: string; color: string }[] = [
  { value: "FAIR", label: "Fair", sub: "Very light skin", color: "#f5e8d0" },
  { value: "WHEATISH", label: "Wheatish", sub: "Light-golden", color: "#c8975a" },
  { value: "MEDIUM", label: "Medium", sub: "Medium brown", color: "#8b5e3c" },
  { value: "DEEP", label: "Deep", sub: "Deep brown", color: "#4a2c1a" },
];

const BODY_SHAPES: { value: BodyShape; label: string; sub: string; shape: string }[] = [
  {
    value: "RECTANGLE",
    label: "Rectangle",
    sub: "Shoulders ≈ hips, less defined waist",
    shape: "▬",
  },
  {
    value: "TRIANGLE",
    label: "Pear",
    sub: "Hips wider than shoulders",
    shape: "▽",
  },
  {
    value: "INVERTED_T",
    label: "Broad shoulders",
    sub: "Shoulders wider than hips",
    shape: "△",
  },
  {
    value: "HOURGLASS",
    label: "Hourglass",
    sub: "Shoulders ≈ hips, defined waist",
    shape: "⌛",
  },
];

export default function AttributeEntry({
  skinTone: initialSkin,
  bodyShape: initialBody,
  onDone,
}: {
  skinTone: SkinTone | null;
  bodyShape: BodyShape | null;
  onDone: (skin: SkinTone, body: BodyShape) => void;
}) {
  const [skin, setSkin] = useState<SkinTone | null>(initialSkin);
  const [body, setBody] = useState<BodyShape | null>(initialBody);

  const handleContinue = () => {
    if (skin && body) onDone(skin, body);
  };

  const canContinue = skin !== null && body !== null;

  return (
    <div className="screen screen-scrollable" id="screen-attributes" style={{ paddingTop: 100 }}>
      <h2 className="h2" style={{ marginBottom: 8 }}>Just a little more about you</h2>
      <p className="subtitle" style={{ marginBottom: 40 }}>
        This helps us match colours and cuts that suit you best. Pick the option that feels closest.
      </p>

      {/* Skin Tone */}
      <div style={{ width: "100%", maxWidth: 720, marginBottom: 40 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, textAlign: "center"
        }}>
          Skin Tone
        </p>
        <div className="attr-grid">
          {SKIN_TONES.map((t) => (
            <button
              key={t.value}
              id={`skin-${t.value.toLowerCase()}`}
              className={`attr-card ${skin === t.value ? "selected" : ""}`}
              onClick={() => setSkin(t.value)}
            >
              <div
                className="attr-card-icon"
                style={{
                  background: t.color,
                  border: skin === t.value ? "3px solid var(--accent)" : "2px solid rgba(255,255,255,0.1)",
                }}
              />
              <div className="attr-card-label">{t.label}</div>
              <div className="attr-card-sub">{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Body Shape */}
      <div style={{ width: "100%", maxWidth: 720, marginBottom: 40 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, textAlign: "center"
        }}>
          Body Shape
        </p>
        <div className="attr-grid">
          {BODY_SHAPES.map((b) => (
            <button
              key={b.value}
              id={`shape-${b.value.toLowerCase().replace(/_/g, "-")}`}
              className={`attr-card ${body === b.value ? "selected" : ""}`}
              onClick={() => setBody(b.value)}
            >
              <div className="attr-card-icon" style={{ background: "var(--bg-glass)", fontSize: 28 }}>
                {b.shape}
              </div>
              <div className="attr-card-label">{b.label}</div>
              <div className="attr-card-sub">{b.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <p style={{ marginTop: 4, marginBottom: 24, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
        {canContinue
          ? <span style={{ color: "var(--success)" }}>✓ Both selected — tap Continue when ready.</span>
          : `Select ${!skin ? "a skin tone" : ""}${!skin && !body ? " and " : ""}${!body ? "a body shape" : ""} to continue.`}
      </p>

      <button
        id="attributes-continue-btn"
        className="btn-kiosk btn-primary"
        disabled={!canContinue}
        onClick={handleContinue}
        style={{ opacity: canContinue ? 1 : 0.4 }}
      >
        See My Recommendations →
      </button>

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
        Can't decide? Pick the closest match — our recommendations will still be helpful.
      </p>
    </div>
  );
}
