// Gender Selection Screen — Luxury Department Panels

type Gender = "MEN" | "WOMEN" | "KIDS" | "UNISEX";

const options: { value: Gender; num: string; title: string; categoryLead: string; tags: string[] }[] = [
  {
    value: "MEN",
    num: "I",
    title: "Men's Department",
    categoryLead: "Tailored Kurtas, Bandhgalas, Silk Shirts & Trousers",
    tags: ["Ethnic Kurtas", "Linen Shirts", "Nehru Jackets", "Chinos"],
  },
  {
    value: "WOMEN",
    num: "II",
    title: "Women's Department",
    categoryLead: "Anarkalis, Sarees, Tunics & Occasion Ensembles",
    tags: ["Embroidered Suits", "Silk Sarees", "Kurtis", "Co-ord Sets"],
  },
  {
    value: "KIDS",
    num: "III",
    title: "Junior Department",
    categoryLead: "Boys & Girls Festive Wear, Dhoti Sets & Frocks",
    tags: ["Festive Sets", "Casual Cottons", "Sherwanis", "Party Frocks"],
  },
];

export default function GenderSelect({
  value,
  onSelect,
}: {
  value: Gender | null;
  onSelect: (g: Gender) => void;
}) {
  return (
    <div className="screen" id="screen-gender">
      <div style={{ width: "100%", maxWidth: 1040 }}>
        {/* Header Zone */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass)", marginBottom: 8 }}>
              Step 01 / 04 &bull; Floor Department
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--paper)", fontWeight: 400, letterSpacing: "-0.01em" }}>
              Which department are you shopping today?
            </h2>
          </div>
          <div style={{ fontSize: 13, color: "var(--stone-dim)", maxWidth: 300, textAlign: "right" }}>
            Calibrates size ranges, silhouette models, and color families.
          </div>
        </div>

        {/* 3 Department Architectural Columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {options.map((o) => {
            const isSelected = value === o.value;
            return (
              <button
                key={o.value}
                id={`gender-${o.value.toLowerCase()}`}
                onClick={() => onSelect(o.value)}
                style={{
                  background: isSelected ? "var(--ink-3)" : "var(--ink-2)",
                  border: isSelected ? "1px solid var(--brass-bright)" : "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  padding: "32px 24px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 280,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  boxShadow: isSelected ? "0 8px 32px rgba(200, 155, 83, 0.12)" : "none",
                }}
              >
                {/* Department Roman Numeral */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: isSelected ? "var(--brass-bright)" : "var(--stone-dim)", fontWeight: 600 }}>
                    {o.num}
                  </span>
                  {isSelected && (
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--brass-bright)",
                      boxShadow: "0 0 12px var(--brass-bright)",
                    }} />
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--paper)", fontWeight: 500, marginBottom: 8 }}>
                    {o.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--stone)", lineHeight: 1.5, marginBottom: 20 }}>
                    {o.categoryLead}
                  </div>

                  {/* Sample Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {o.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-sans)",
                          background: isSelected ? "rgba(200, 155, 83, 0.15)" : "var(--ink-3)",
                          color: isSelected ? "var(--brass-bright)" : "var(--stone-dim)",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid " + (isSelected ? "rgba(200, 155, 83, 0.3)" : "var(--line)"),
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
