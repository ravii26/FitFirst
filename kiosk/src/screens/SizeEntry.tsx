// Size Entry Screen — Bespoke Tailor Size Selector

const MEN_ALPHA = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const MEN_NUMERIC = ["28", "30", "32", "34", "36", "38", "40", "42", "44"];

const WOMEN_ALPHA = ["XS", "S", "M", "L", "XL", "2XL"];
const WOMEN_NUMERIC = ["24", "26", "28", "30", "32", "34", "36"];

const KIDS_SIZES = ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"];

export default function SizeEntry({
  gender,
  value,
  onSelect,
}: {
  gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX" | null;
  value: string;
  onSelect: (size: string) => void;
}) {
  const isKids = gender === "KIDS";
  const alphaList = gender === "WOMEN" ? WOMEN_ALPHA : MEN_ALPHA;
  const numericList = gender === "WOMEN" ? WOMEN_NUMERIC : MEN_NUMERIC;

  return (
    <div className="screen" id="screen-size">
      <div style={{ width: "100%", maxWidth: 960 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass)", marginBottom: 8 }}>
              Step 02 / 04 &bull; Tailored Measurement
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--paper)", fontWeight: 400, letterSpacing: "-0.01em" }}>
              Select your primary fit size
            </h2>
          </div>
          <div style={{ fontSize: 13, color: "var(--stone-dim)", maxWidth: 280, textAlign: "right" }}>
            Garments out of stock in this size will be hidden automatically.
          </div>
        </div>

        {/* Sizing Matrix */}
        {isKids ? (
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              Age Sizing
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {KIDS_SIZES.map((s) => {
                const isSel = value === s;
                return (
                  <button
                    key={s}
                    id={`size-${s}`}
                    onClick={() => onSelect(s)}
                    style={{
                      minWidth: 90,
                      height: 56,
                      background: isSel ? "var(--brass)" : "var(--ink-2)",
                      color: isSel ? "var(--ink)" : "var(--paper)",
                      border: isSel ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Standard Clothing */}
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Standard Tops & Kurtas
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {alphaList.map((s) => {
                  const isSel = value === s;
                  return (
                    <button
                      key={s}
                      id={`size-${s}`}
                      onClick={() => onSelect(s)}
                      style={{
                        minWidth: 84,
                        height: 54,
                        background: isSel ? "var(--brass)" : "var(--ink-2)",
                        color: isSel ? "var(--ink)" : "var(--paper)",
                        border: isSel ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                        borderRadius: "var(--radius-md)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numeric Waist / Chest */}
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Waist & Tailored Chest (Inches)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {numericList.map((s) => {
                  const isSel = value === s;
                  return (
                    <button
                      key={s}
                      id={`size-${s}`}
                      onClick={() => onSelect(s)}
                      style={{
                        minWidth: 72,
                        height: 50,
                        background: isSel ? "var(--brass)" : "var(--ink-2)",
                        color: isSel ? "var(--ink)" : "var(--paper)",
                        border: isSel ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                        borderRadius: "var(--radius-md)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sub-note */}
        <div style={{
          marginTop: 40,
          borderTop: "1px solid var(--line)",
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "var(--stone-dim)",
        }}>
          <span>Selected Fit: <strong style={{ color: "var(--brass-bright)", fontFamily: "var(--font-mono)", fontSize: 14 }}>{value || "None chosen"}</strong></span>
          <span>Need measurement tape? Ask your floor stylist.</span>
        </div>
      </div>
    </div>
  );
}
