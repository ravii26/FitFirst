// Style Preferences Screen — Atelier Aesthetics

const MEN_PREFS = [
  { tag: "KURTA", label: "Ethnic Kurtas" },
  { tag: "SHIRT", label: "Formal & Casual Shirts" },
  { tag: "TROUSERS", label: "Tailored Trousers" },
  { tag: "JEANS", label: "Denim Jeans" },
  { tag: "SHERWANI", label: "Wedding Sherwanis" },
  { tag: "SOLID", label: "Solid Tones" },
  { tag: "CHECKS", label: "Structured Checks" },
  { tag: "EMBROIDERED", label: "Hand Embroidered" },
  { tag: "BLOCK_PRINT", label: "Block Print" },
  { tag: "STRIPES", label: "Classic Stripes" },
];

const WOMEN_PREFS = [
  { tag: "SAREE", label: "Designer Sarees" },
  { tag: "SALWAR_KAMEEZ", label: "Salwar Suits" },
  { tag: "KURTA", label: "Contemporary Kurtis" },
  { tag: "LEHENGA", label: "Bridal Lehengas" },
  { tag: "DRESS", label: "Occasion Dresses" },
  { tag: "FLORAL", label: "Floral Prints" },
  { tag: "SOLID", label: "Monochrome Tones" },
  { tag: "EMBROIDERED", label: "Zari & Thread Work" },
  { tag: "BLOCK_PRINT", label: "Hand Block Print" },
  { tag: "PAISLEY", label: "Traditional Paisley" },
];

const KIDS_PREFS = [
  { tag: "KIDS_KURTA", label: "Junior Kurtas" },
  { tag: "KIDS_DRESS", label: "Party Frocks & Dresses" },
  { tag: "KIDS_SHIRT", label: "Smart Shirts" },
  { tag: "FLORAL", label: "Vibrant Prints" },
  { tag: "CHECKS", label: "Classic Checks" },
  { tag: "BRIGHT_WARM", label: "Bright Celebration Tones" },
  { tag: "FESTIVE", label: "Festive Wear" },
  { tag: "CASUAL", label: "Daily Comfort" },
];

function getPrefs(gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX" | null) {
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

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="screen" id="screen-prefs">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--brass)",
          marginBottom: 16,
        }}
      >
        03 &middot; Aesthetics
      </div>

      <h2 className="h2" style={{ marginBottom: 12 }}>Select Desired Styles & Patterns</h2>
      <p className="subtitle" style={{ marginBottom: 12 }}>
        Tap any preferences that match your occasion or taste. <span style={{ color: "var(--stone-dim)" }}>(Optional)</span>
      </p>

      {selected.length > 0 ? (
        <p style={{ fontSize: 13, color: "var(--brass-bright)", marginBottom: 28, fontWeight: 600 }}>
          {selected.length} preference{selected.length > 1 ? "s" : ""} selected
        </p>
      ) : (
        <div style={{ marginBottom: 28 }} />
      )}

      <div className="tile-grid" style={{ marginBottom: 44 }}>
        {prefs.map((p) => {
          const isSelected = selected.includes(p.tag);
          return (
            <button
              key={p.tag}
              id={`pref-${p.tag.toLowerCase()}`}
              className={`tile ${isSelected ? "selected" : ""}`}
              onClick={() => toggle(p.tag)}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isSelected ? "var(--brass)" : "var(--line-strong)",
                transition: "all 0.2s ease",
              }} />
              {p.label}
            </button>
          );
        })}
      </div>

      <button
        id="prefs-next-btn"
        className="btn-kiosk btn-primary"
        onClick={onNext}
      >
        {selected.length > 0 ? "Continue to Fit Profile &rarr;" : "Skip & Continue &rarr;"}
      </button>
    </div>
  );
}
