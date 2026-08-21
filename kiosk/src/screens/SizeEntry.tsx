// Size Entry Screen — Refined Atelier Touch Tiles

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
      <h2 className="h2" style={{ marginBottom: 12 }}>What is your tailored size?</h2>
      <p className="subtitle" style={{ marginBottom: 40 }}>
        Only garments currently in stock in your precise size will be displayed.
      </p>

      <div className="tile-grid" style={{ maxWidth: 760 }}>
        {sizes.map((s) => (
          <button
            key={s}
            id={`size-${s}`}
            className={`tile ${value === s ? "selected" : ""}`}
            style={{ minWidth: 84, fontSize: 17, minHeight: 58 }}
            onClick={() => onSelect(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 36,
        padding: "12px 24px",
        borderRadius: 100,
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-subtle)",
        fontSize: 13,
        color: "var(--text-muted)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span>📏 Need fitting help? Ask any store stylist on the floor for instant measurement.</span>
      </div>
    </div>
  );
}
