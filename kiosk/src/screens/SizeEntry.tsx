// Size Entry Screen — large touch tiles with Indian size context

const MEN_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "28", "30", "32", "34", "36", "38", "40", "42", "44"];
const WOMEN_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "24", "26", "28", "30", "32"];
const KIDS_SIZES = ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"];

function getSizes(gender: "MEN" | "WOMEN" | "KIDS" | null) {
  if (gender === "WOMEN") return WOMEN_SIZES;
  if (gender === "KIDS") return KIDS_SIZES;
  return MEN_SIZES;
}

export default function SizeEntry({
  gender,
  value,
  onSelect,
}: {
  gender: "MEN" | "WOMEN" | "KIDS" | null;
  value: string;
  onSelect: (size: string) => void;
}) {
  const sizes = getSizes(gender);

  return (
    <div className="screen" id="screen-size">
      <h2 className="h2" style={{ marginBottom: 12 }}>What's your size?</h2>
      <p className="subtitle" style={{ marginBottom: 36 }}>
        We'll only show items we have <strong>in your size</strong> right now.
      </p>

      <div className="tile-grid" style={{ maxWidth: 800 }}>
        {sizes.map((s) => (
          <button
            key={s}
            id={`size-${s}`}
            className={`tile ${value === s ? "selected" : ""}`}
            style={{ minWidth: 80, fontSize: 18 }}
            onClick={() => onSelect(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
        Not sure? Ask a staff member for your size — they'll help you.
      </p>
    </div>
  );
}
