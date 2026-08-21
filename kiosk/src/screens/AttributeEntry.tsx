// Attribute Entry Screen — Clean Skin Tone Swatches & Body Silhouette Guidance

import { useState } from "react";

type SkinTone = "FAIR" | "WHEATISH" | "MEDIUM" | "DEEP";
type BodyShape = "RECTANGLE" | "TRIANGLE" | "INVERTED_T" | "HOURGLASS";

const SKIN_TONES: { value: SkinTone; label: string; sub: string; color: string }[] = [
  { value: "FAIR", label: "Fair / Warm Porcelain", sub: "Complements Emerald, Royal Blue & Deep Ruby", color: "#F7E6D0" },
  { value: "WHEATISH", label: "Wheatish / Golden Warmth", sub: "Complements Gold, Maroon, Mustard & Teal", color: "#D49C65" },
  { value: "MEDIUM", label: "Medium / Olive Tan", sub: "Complements Champagne, Coral, Beige & Navy", color: "#9E6B43" },
  { value: "DEEP", label: "Deep / Rich Ebony", sub: "Complements Ivory, Bright Gold, Crimson & Fuchsia", color: "#543422" },
];

const BODY_SHAPES: { value: BodyShape; label: string; sub: string; icon: JSX.Element }[] = [
  {
    value: "RECTANGLE",
    label: "Athletic & Straight",
    sub: "Balanced shoulders and hips with subtle waist definition",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="7" y="4" width="10" height="16" rx="2" />
      </svg>
    ),
  },
  {
    value: "TRIANGLE",
    label: "Pear / A-Line",
    sub: "Fuller hips with narrow shoulder balance",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4L4 20H20L12 4Z" />
      </svg>
    ),
  },
  {
    value: "INVERTED_T",
    label: "Broad Shoulder",
    sub: "Wider shoulder line tapering toward waist",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4H20L12 20L4 4Z" />
      </svg>
    ),
  },
  {
    value: "HOURGLASS",
    label: "Curvy & Defined",
    sub: "Proportional shoulders & hips with defined waist",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4H18L13 12L18 20H6L11 12L6 4Z" />
      </svg>
    ),
  },
];

export default function AttributeEntry({
  skinTone: initialSkin,
  bodyShape: initialBody,
  onDone,
  onStartCamera,
}: {
  skinTone: SkinTone | null;
  bodyShape: BodyShape | null;
  onDone: (skin: SkinTone, body: BodyShape) => void;
  onStartCamera?: () => void;
}) {
  const [skin, setSkin] = useState<SkinTone | null>(initialSkin);
  const [body, setBody] = useState<BodyShape | null>(initialBody);

  const handleContinue = () => {
    if (skin && body) onDone(skin, body);
  };

  const canContinue = skin !== null && body !== null;

  return (
    <div className="screen screen-scrollable" id="screen-attributes" style={{ paddingTop: 84, paddingBottom: 80 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--brass)",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        04 &middot; Fit Profile
      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        {onStartCamera && (
          <button
            className="btn-kiosk btn-primary"
            onClick={onStartCamera}
            style={{
              marginBottom: 16,
              fontSize: 14,
              padding: "0 28px",
              minHeight: 44,
            }}
          >
            Use Fast On-Device Camera Scan
          </button>
        )}
        <h2 className="h2" style={{ marginBottom: 6 }}>Personal Tone & Cut Profile</h2>
        <p className="subtitle" style={{ fontSize: 15 }}>
          Select manually below or use instant camera scan above.
        </p>
      </div>

      {/* Skin Tone */}
      <div style={{ width: "100%", maxWidth: 760, marginBottom: 36 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brass)",
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, textAlign: "center"
        }}>
          1. Select Complexion Tone
        </div>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {SKIN_TONES.map((t) => {
            const isSelected = skin === t.value;
            return (
              <button
                key={t.value}
                id={`skin-${t.value.toLowerCase()}`}
                className={`selection-card ${isSelected ? "selected" : ""}`}
                style={{ padding: "20px 14px" }}
                onClick={() => setSkin(t.value)}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: t.color,
                    border: isSelected ? "3px solid var(--brass)" : "2px solid var(--line-strong)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    marginBottom: 12,
                    transition: "all 0.2s ease",
                  }}
                />
                <div className="selection-card-title" style={{ fontSize: 15 }}>{t.label}</div>
                <div className="selection-card-sub" style={{ fontSize: 11 }}>{t.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Shape */}
      <div style={{ width: "100%", maxWidth: 760, marginBottom: 36 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brass)",
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, textAlign: "center"
        }}>
          2. Select Body Silhouette
        </div>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {BODY_SHAPES.map((b) => {
            const isSelected = body === b.value;
            return (
              <button
                key={b.value}
                id={`shape-${b.value.toLowerCase().replace(/_/g, "-")}`}
                className={`selection-card ${isSelected ? "selected" : ""}`}
                style={{ padding: "20px 14px" }}
                onClick={() => setBody(b.value)}
              >
                <div className="selection-card-icon" style={{ width: 48, height: 48, marginBottom: 12 }}>
                  {b.icon}
                </div>
                <div className="selection-card-title" style={{ fontSize: 15 }}>{b.label}</div>
                <div className="selection-card-sub" style={{ fontSize: 11 }}>{b.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button
          id="attributes-continue-btn"
          className="btn-kiosk btn-primary"
          disabled={!canContinue}
          onClick={handleContinue}
          style={{ opacity: canContinue ? 1 : 0.45, fontSize: 17, padding: "0 54px" }}
        >
          {canContinue ? "Generate Recommendations &rarr;" : "Select Tone & Cut to Proceed"}
        </button>
      </div>
    </div>
  );
}
