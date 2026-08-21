// Gender Selection Screen — Luxury Boutique Vector UI

type Gender = "MEN" | "WOMEN" | "KIDS";

const SVGMen = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 4v6m0-6h-6m6 0l-5.5 5.5"/>
    <circle cx="9" cy="15" r="6"/>
  </svg>
);

const SVGWomen = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="9" r="6"/>
    <path d="M12 15v7m-3-3h6"/>
  </svg>
);

const SVGKids = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
  </svg>
);

const options: { value: Gender; label: string; icon: JSX.Element; sub: string }[] = [
  { value: "MEN", label: "Men's Collection", icon: <SVGMen />, sub: "Kurtas, Shirts, Trousers & Ethnic Wear" },
  { value: "WOMEN", label: "Women's Collection", icon: <SVGWomen />, sub: "Sarees, Suits, Lehengas & Kurtis" },
  { value: "KIDS", label: "Junior Collection", icon: <SVGKids />, sub: "Boys & Girls Ethnic & Formal Wear" },
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
      <h2 className="h2" style={{ marginBottom: 12 }}>Select Department</h2>
      <p className="subtitle" style={{ marginBottom: 44 }}>
        We will filter our active in-store catalog to match your exact department.
      </p>

      <div className="card-grid">
        {options.map((o) => (
          <button
            key={o.value}
            id={`gender-${o.value.toLowerCase()}`}
            className={`selection-card ${value === o.value ? "selected" : ""}`}
            onClick={() => onSelect(o.value)}
          >
            <div className="selection-card-icon">
              {o.icon}
            </div>
            <div className="selection-card-title">{o.label}</div>
            <div className="selection-card-sub">{o.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
