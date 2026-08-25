// Attribute Entry Screen — Editorial Dual-Matrix Tone & Silhouette

import { useState } from "react";

type SkinTone = "FAIR" | "WHEATISH" | "MEDIUM" | "DEEP";
type BodyShape = "RECTANGLE" | "TRIANGLE" | "INVERTED_T" | "HOURGLASS";

const SKIN_TONES: { value: SkinTone; label: string; sub: string; color: string }[] = [
  { value: "FAIR", label: "Fair / Porcelain", sub: "Pairs with Emerald, Deep Ruby & Cobalt", color: "#F7E6D0" },
  { value: "WHEATISH", label: "Wheatish / Golden", sub: "Pairs with Warm Gold, Mustard, Maroon & Teal", color: "#D49C65" },
  { value: "MEDIUM", label: "Medium / Olive", sub: "Pairs with Champagne, Coral, Beige & Navy", color: "#9E6B43" },
  { value: "DEEP", label: "Deep / Ebony", sub: "Pairs with Ivory, Rich Ochre, Crimson & Fuchsia", color: "#543422" },
];

const BODY_SHAPES: { value: BodyShape; label: string; sub: string; icon: JSX.Element }[] = [
  {
    value: "RECTANGLE",
    label: "Athletic & Straight",
    sub: "Balanced shoulders and hips",
    icon: (
      <svg width="32" height="40" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="4" r="2.2" />
        <path d="M12 6.2v2.3" />
        <path d="M6.5 10 C8.5 10, 9.5 11, 10.5 15 C11 17, 11 18.5, 12 18.5 C13 18.5, 13 17, 13.5 15 C14.5 11, 15.5 10, 17.5 10 C18.5 10, 18.5 14, 18 18 C17.5 23, 17 28, 16 31 H8 C7 28, 6.5 23, 6 18 C5.5 14, 5.5 10, 6.5 10 Z" fill="currentColor" fillOpacity="0.06" />
      </svg>
    ),
  },
  {
    value: "TRIANGLE",
    label: "Pear / A-Line",
    sub: "Fuller hip taper & narrow shoulders",
    icon: (
      <svg width="32" height="40" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="4" r="2.2" />
        <path d="M12 6.2v2.3" />
        <path d="M8 10 C9.5 10, 10.5 13, 11 16.5 C11.5 18, 11.5 18.5, 12 18.5 C12.5 18.5, 12.5 18, 13 16.5 C13.5 13, 14.5 10, 16 10 C17.5 10, 18 14, 19.5 18 C21 22, 21.5 27, 17.5 31 H6.5 C2.5 27, 3 22, 4.5 18 C6 14, 6.5 10, 8 10 Z" fill="currentColor" fillOpacity="0.06" />
      </svg>
    ),
  },
  {
    value: "INVERTED_T",
    label: "Broad Shoulder",
    sub: "Structured upper frame",
    icon: (
      <svg width="32" height="40" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="4" r="2.2" />
        <path d="M12 6.2v2.3" />
        <path d="M5 10 C7.5 10, 9 13, 10.5 16.5 C11 18, 11.5 18.5, 12 18.5 C12.5 18.5, 13 18, 13.5 16.5 C15 13, 16.5 10, 19 10 C20.5 10, 19 14, 17.5 18 C16 22, 15 27, 14.5 31 H9.5 C9 27, 8 22, 6.5 18 C5 14, 3.5 10, 5 10 Z" fill="currentColor" fillOpacity="0.06" />
      </svg>
    ),
  },
  {
    value: "HOURGLASS",
    label: "Curvy & Defined",
    sub: "Proportional frame & waist definition",
    icon: (
      <svg width="32" height="40" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="4" r="2.2" />
        <path d="M12 6.2v2.3" />
        <path d="M6 10 C8 10, 9.5 13, 10.5 16.5 C11 18, 11.5 18.5, 12 18.5 C12.5 18.5, 13 18, 13.5 16.5 C14.5 13, 16 10, 18 10 C19.5 10, 19.5 14, 19.5 18 C19.5 23, 17 28, 15.5 31 H8.5 C7 28, 4.5 23, 4.5 18 C4.5 14, 4.5 10, 6 10 Z" fill="currentColor" fillOpacity="0.06" />
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
    <div className="screen" id="screen-attributes" style={{ padding: "36px 48px" }}>
      <div style={{ width: "100%", maxWidth: 1040 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass)", marginBottom: 8 }}>
              Step 04 / 04 &bull; Tailoring Profile
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--paper)", fontWeight: 400, letterSpacing: "-0.01em" }}>
              Calibrate tone & silhouette cut
            </h2>
          </div>

          {onStartCamera && (
            <button
              className="btn-kiosk btn-secondary"
              onClick={onStartCamera}
              style={{
                fontSize: 13,
                padding: "0 20px",
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>📷</span>
              <span>Fast Camera Scan</span>
            </button>
          )}
        </div>

        {/* Dual Grid: Left Tone, Right Silhouette */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
          {/* Tone Section */}
          <div style={{
            background: "var(--ink-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 20px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brass)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
              1. Complexion Undertone
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {SKIN_TONES.map((t) => {
                const isSelected = skin === t.value;
                return (
                  <button
                    key={t.value}
                    id={`skin-${t.value.toLowerCase()}`}
                    onClick={() => setSkin(t.value)}
                    style={{
                      background: isSelected ? "var(--ink-3)" : "transparent",
                      border: isSelected ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: t.color,
                      border: isSelected ? "2px solid var(--brass-bright)" : "1px solid rgba(255,255,255,0.2)",
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "var(--brass-bright)" : "var(--paper)", marginBottom: 2 }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--stone-dim)", lineHeight: 1.3 }}>
                        {t.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Silhouette Section */}
          <div style={{
            background: "var(--ink-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 20px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brass)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
              2. Silhouette Architecture
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {BODY_SHAPES.map((b) => {
                const isSelected = body === b.value;
                return (
                  <button
                    key={b.value}
                    id={`shape-${b.value.toLowerCase().replace(/_/g, "-")}`}
                    onClick={() => setBody(b.value)}
                    style={{
                      background: isSelected ? "var(--ink-3)" : "transparent",
                      border: isSelected ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ color: isSelected ? "var(--brass-bright)" : "var(--stone-dim)" }}>
                      {b.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "var(--brass-bright)" : "var(--paper)", marginBottom: 2 }}>
                        {b.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--stone-dim)", lineHeight: 1.3 }}>
                        {b.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: "var(--stone-dim)" }}>
            {canContinue ? (
              <span style={{ color: "var(--brass-bright)" }}>&check; Profile calibrated &mdash; ready to match floor inventory</span>
            ) : (
              <span>Select both a complexion tone and silhouette to calculate matches</span>
            )}
          </div>

          <button
            id="attributes-continue-btn"
            className="btn-kiosk btn-primary"
            disabled={!canContinue}
            onClick={handleContinue}
            style={{
              opacity: canContinue ? 1 : 0.4,
              fontSize: 16,
              padding: "0 40px",
              minHeight: 52,
            }}
          >
            Reveal Curated Pieces &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
