// Style Preferences Screen — Curated Fabric & Silhouette Tagboard

interface PrefOption {
  tag: string;
  label: string;
  category: "GARMENT" | "SURFACE";
}

const MEN_PREFS: PrefOption[] = [
  { tag: "KURTA", label: "Ethnic Kurtas", category: "GARMENT" },
  { tag: "SHIRT", label: "Formal & Casual Shirts", category: "GARMENT" },
  { tag: "TROUSERS", label: "Tailored Trousers", category: "GARMENT" },
  { tag: "JEANS", label: "Denim Jeans", category: "GARMENT" },
  { tag: "SHERWANI", label: "Wedding Sherwanis", category: "GARMENT" },
  { tag: "SOLID", label: "Solid Monochrome", category: "SURFACE" },
  { tag: "CHECKS", label: "Structured Checks", category: "SURFACE" },
  { tag: "EMBROIDERED", label: "Hand Embroidered", category: "SURFACE" },
  { tag: "BLOCK_PRINT", label: "Hand Block Print", category: "SURFACE" },
  { tag: "STRIPES", label: "Classic Stripes", category: "SURFACE" },
];

const WOMEN_PREFS: PrefOption[] = [
  { tag: "SAREE", label: "Designer Sarees", category: "GARMENT" },
  { tag: "SALWAR_KAMEEZ", label: "Salwar Suits", category: "GARMENT" },
  { tag: "KURTA", label: "Contemporary Kurtis", category: "GARMENT" },
  { tag: "LEHENGA", label: "Occasion Lehengas", category: "GARMENT" },
  { tag: "DRESS", label: "Evening Dresses", category: "GARMENT" },
  { tag: "FLORAL", label: "Botanical Florals", category: "SURFACE" },
  { tag: "SOLID", label: "Monochrome Tones", category: "SURFACE" },
  { tag: "EMBROIDERED", label: "Zari & Thread Work", category: "SURFACE" },
  { tag: "BLOCK_PRINT", label: "Hand Block Print", category: "SURFACE" },
  { tag: "PAISLEY", label: "Traditional Paisley", category: "SURFACE" },
];

const KIDS_PREFS: PrefOption[] = [
  { tag: "KIDS_KURTA", label: "Junior Kurtas", category: "GARMENT" },
  { tag: "KIDS_DRESS", label: "Party Frocks", category: "GARMENT" },
  { tag: "KIDS_SHIRT", label: "Smart Shirts", category: "GARMENT" },
  { tag: "FESTIVE", label: "Festive Sets", category: "GARMENT" },
  { tag: "FLORAL", label: "Vibrant Prints", category: "SURFACE" },
  { tag: "CHECKS", label: "Classic Checks", category: "SURFACE" },
  { tag: "BRIGHT_WARM", label: "Celebration Tones", category: "SURFACE" },
  { tag: "CASUAL", label: "Daily Cottons", category: "SURFACE" },
];

function getPrefs(gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX" | null): PrefOption[] {
  if (gender === "WOMEN") return WOMEN_PREFS;
  if (gender === "KIDS") return KIDS_PREFS;
  return MEN_PREFS;
}

export default function StylePreferences({
  gender,
  selected,
  onChange,
  onNext,
}: {
  gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX" | null;
  selected: string[];
  onChange: (tags: string[]) => void;
  onNext: () => void;
}) {
  const prefs = getPrefs(gender);
  const garments = prefs.filter((p) => p.category === "GARMENT");
  const surfaces = prefs.filter((p) => p.category === "SURFACE");

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="screen" id="screen-prefs">
      <div style={{ width: "100%", maxWidth: 1040 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass)", marginBottom: 8 }}>
              Step 03 / 04 &bull; Aesthetic Curation
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--paper)", fontWeight: 400, letterSpacing: "-0.01em" }}>
              Tailor your aesthetic & weave preferences
            </h2>
          </div>
          <div style={{ fontSize: 13, color: "var(--stone-dim)", maxWidth: 280, textAlign: "right" }}>
            Optional &bull; Select any cuts or surface patterns you prefer.
          </div>
        </div>

        {/* Categorized Tagboards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 36 }}>
          {/* Garment Cut Group */}
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Garment Categories
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {garments.map((p) => {
                const isSelected = selected.includes(p.tag);
                return (
                  <button
                    key={p.tag}
                    id={`pref-${p.tag.toLowerCase()}`}
                    onClick={() => toggle(p.tag)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "var(--radius-sm)",
                      background: isSelected ? "var(--brass)" : "var(--ink-2)",
                      color: isSelected ? "var(--ink)" : "var(--paper)",
                      border: isSelected ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Surface & Pattern Group */}
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Pattern & Fabric Embellishment
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {surfaces.map((p) => {
                const isSelected = selected.includes(p.tag);
                return (
                  <button
                    key={p.tag}
                    id={`pref-${p.tag.toLowerCase()}`}
                    onClick={() => toggle(p.tag)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "var(--radius-sm)",
                      background: isSelected ? "var(--brass)" : "var(--ink-2)",
                      color: isSelected ? "var(--ink)" : "var(--paper)",
                      border: isSelected ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: "var(--stone)" }}>
            {selected.length > 0 ? (
              <span><strong style={{ color: "var(--brass-bright)", fontFamily: "var(--font-mono)" }}>{selected.length}</strong> preferences active</span>
            ) : (
              <span style={{ color: "var(--stone-dim)" }}>No filters selected (showing all in-stock styles)</span>
            )}
          </div>

          <button
            id="prefs-next-btn"
            className="btn-kiosk btn-primary"
            onClick={onNext}
            style={{ minHeight: 52, padding: "0 36px", fontSize: 15 }}
          >
            {selected.length > 0 ? "Continue to Tone & Silhouette \u2192" : "Skip & Continue \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
