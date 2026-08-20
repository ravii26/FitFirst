// Style Preferences Screen — multi-select tiles
// Customer can skip (tap Next) if they have no particular preference.

const MEN_PREFS = [
  { tag: "KURTA", label: "Kurtas", emoji: "🧣" },
  { tag: "SHIRT", label: "Shirts", emoji: "👔" },
  { tag: "TROUSERS", label: "Trousers", emoji: "👖" },
  { tag: "JEANS", label: "Jeans", emoji: "🧷" },
  { tag: "SHERWANI", label: "Sherwani", emoji: "🎩" },
  { tag: "SOLID", label: "Solid colours", emoji: "🟦" },
  { tag: "CHECKS", label: "Checks", emoji: "🔲" },
  { tag: "EMBROIDERED", label: "Embroidered", emoji: "✨" },
  { tag: "CASUAL", label: "Casual wear", emoji: "😎" },
  { tag: "FORMAL", label: "Formal wear", emoji: "💼" },
];

const WOMEN_PREFS = [
  { tag: "SAREE", label: "Sarees", emoji: "🪭" },
  { tag: "SALWAR_KAMEEZ", label: "Salwar Suits", emoji: "👘" },
  { tag: "KURTA", label: "Kurtis", emoji: "🧣" },
  { tag: "LEHENGA", label: "Lehenga", emoji: "💃" },
  { tag: "DRESS", label: "Dresses", emoji: "👗" },
  { tag: "FLORAL", label: "Floral prints", emoji: "🌸" },
  { tag: "SOLID", label: "Solid colours", emoji: "🟪" },
  { tag: "EMBROIDERED", label: "Embroidered", emoji: "✨" },
  { tag: "BLOCK_PRINT", label: "Block print", emoji: "🎨" },
  { tag: "PAISLEY", label: "Paisley", emoji: "🌀" },
];

const KIDS_PREFS = [
  { tag: "KIDS_KURTA", label: "Kurtas", emoji: "🧣" },
  { tag: "KIDS_DRESS", label: "Frocks & Dresses", emoji: "👗" },
  { tag: "KIDS_SHIRT", label: "Shirts", emoji: "👔" },
  { tag: "FLORAL", label: "Florals", emoji: "🌸" },
  { tag: "CHECKS", label: "Checks", emoji: "🔲" },
  { tag: "BRIGHT_WARM", label: "Bright colours", emoji: "🌈" },
  { tag: "FESTIVE", label: "Festive / party", emoji: "🎉" },
  { tag: "CASUAL", label: "Casual / daily", emoji: "🎒" },
];

function getPrefs(gender: "MEN" | "WOMEN" | "KIDS" | null) {
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
  gender: "MEN" | "WOMEN" | "KIDS" | null;
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
      <h2 className="h2" style={{ marginBottom: 12 }}>What are you looking for today?</h2>
      <p className="subtitle" style={{ marginBottom: 8 }}>
        Select anything that appeals to you. <span style={{ color: "var(--text-muted)" }}>(Optional — you can skip this)</span>
      </p>

      {selected.length > 0 && (
        <p style={{ fontSize: 13, color: "var(--accent)", marginBottom: 24 }}>
          {selected.length} selected
        </p>
      )}
      {selected.length === 0 && <div style={{ marginBottom: 24 }} />}

      <div className="tile-grid" style={{ marginBottom: 40 }}>
        {prefs.map((p) => (
          <button
            key={p.tag}
            id={`pref-${p.tag.toLowerCase()}`}
            className={`tile ${selected.includes(p.tag) ? "selected" : ""}`}
            onClick={() => toggle(p.tag)}
            style={{ gap: 8 }}
          >
            <span style={{ fontSize: 20 }}>{p.emoji}</span>
            {p.label}
          </button>
        ))}
      </div>

      <button
        id="prefs-next-btn"
        className="btn-kiosk btn-primary"
        onClick={onNext}
      >
        {selected.length > 0 ? "Continue →" : "Skip & Continue →"}
      </button>
    </div>
  );
}
