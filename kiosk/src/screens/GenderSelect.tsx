// Gender Selection Screen — first data input step

type Gender = "MEN" | "WOMEN" | "KIDS";

const options: { value: Gender; label: string; icon: string; sub: string }[] = [
  { value: "MEN", label: "Men", icon: "👔", sub: "Kurtas, shirts, trousers & more" },
  { value: "WOMEN", label: "Women", icon: "👗", sub: "Sarees, suits, kurtis & more" },
  { value: "KIDS", label: "Kids", icon: "🧒", sub: "Boys & girls, all ages" },
];

export default function GenderSelect({
  value,
  onSelect,
}: {
  value: "MEN" | "WOMEN" | "KIDS" | null;
  onSelect: (g: "MEN" | "WOMEN" | "KIDS") => void;
}) {
  return (
    <div className="screen" id="screen-gender">
      <h2 className="h2" style={{ marginBottom: 12 }}>Who are we shopping for?</h2>
      <p className="subtitle" style={{ marginBottom: 40 }}>
        This helps us show you the right section of our collection.
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {options.map((o) => (
          <button
            key={o.value}
            id={`gender-${o.value.toLowerCase()}`}
            className={`attr-card ${value === o.value ? "selected" : ""}`}
            style={{ width: 200, minHeight: 180 }}
            onClick={() => onSelect(o.value)}
          >
            <div className="attr-card-icon" style={{ background: "var(--bg-glass)", fontSize: 40 }}>
              {o.icon}
            </div>
            <div className="attr-card-label" style={{ fontSize: 20 }}>{o.label}</div>
            <div className="attr-card-sub">{o.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
