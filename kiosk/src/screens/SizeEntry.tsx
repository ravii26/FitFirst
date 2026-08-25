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
  onNext,
}: {
  gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX" | null;
  value: string;
  onSelect: (size: string) => void;
  onNext: () => void;
}) {
  const isKids = gender === "KIDS";
  const alphaList = gender === "WOMEN" ? WOMEN_ALPHA : MEN_ALPHA;
  const numericList = gender === "WOMEN" ? WOMEN_NUMERIC : MEN_NUMERIC;

  const selectedSizes = value ? value.split(";").map((s) => s.trim()).filter(Boolean) : [];

  const handleToggle = (s: string) => {
    let next: string[];
    if (selectedSizes.includes(s)) {
      next = selectedSizes.filter((item) => item !== s);
    } else {
      next = [...selectedSizes, s];
    }
    onSelect(next.join(";"));
  };

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
              Select your fit sizes
            </h2>
          </div>
          <div style={{ fontSize: 13, color: "var(--stone-dim)", maxWidth: 300, textAlign: "right" }}>
            Select one or more sizes that usually fit you. Out-of-stock items will be filtered automatically.
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
                const isSel = selectedSizes.includes(s);
                return (
                  <button
                    key={s}
                    id={`size-${s}`}
                    onClick={() => handleToggle(s)}
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
                  const isSel = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      id={`size-${s}`}
                      onClick={() => handleToggle(s)}
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
                  const isSel = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      id={`size-${s}`}
                      onClick={() => handleToggle(s)}
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

        {/* Sub-note & CTA Action Bar */}
        <div style={{
          marginTop: 40,
          borderTop: "1px solid var(--line)",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: "var(--stone)" }}>
            {selectedSizes.length > 0 ? (
              <span>Selected Fit: <strong style={{ color: "var(--brass-bright)", fontFamily: "var(--font-mono)", fontSize: 14 }}>{selectedSizes.join(", ")}</strong></span>
            ) : (
              <span style={{ color: "var(--stone-dim)" }}>Please select at least one fit size</span>
            )}
          </div>

          <button
            id="size-next-btn"
            className="btn-kiosk btn-primary"
            onClick={onNext}
            disabled={selectedSizes.length === 0}
            style={{
              minHeight: 52,
              padding: "0 36px",
              fontSize: 15,
              opacity: selectedSizes.length === 0 ? 0.4 : 1,
              cursor: selectedSizes.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            Continue to Preferences &arr;
          </button>
        </div>
      </div>
    </div>
  );
}
