// Welcome / Attract Screen — Bespoke Showroom Entrance

export default function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen" id="screen-welcome" style={{ padding: "48px 64px", justifyContent: "space-between" }}>
      {/* Top Brand Bar */}
      <div style={{ width: "100%", maxWidth: 1080, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            background: "var(--brass)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-serif)",
            fontSize: 20,
            fontWeight: 600,
            color: "var(--ink)",
          }}>
            F
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--paper)", fontWeight: 500, letterSpacing: "-0.01em" }}>
              FitFirst
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brass)" }}>
              Showroom Styling Engine
            </div>
          </div>
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Live Floor Sync &bull; Ahmedabad Showroom
        </div>
      </div>

      {/* Main Editorial Body */}
      <div style={{
        width: "100%",
        maxWidth: 1080,
        display: "grid",
        gridTemplateColumns: "1.2fr 0.9fr",
        gap: 64,
        alignItems: "center",
        margin: "auto 0",
      }}>
        {/* Left Column: Editorial Statement */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brass)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>
            Personal In-Store Recommendation
          </div>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(38px, 4.5vw, 62px)",
            lineHeight: 1.05,
            fontWeight: 400,
            color: "var(--paper)",
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}>
            Discover what fits your <span style={{ fontStyle: "italic", color: "var(--brass-bright)" }}>complexion, size & cut.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--stone)", lineHeight: 1.6, maxWidth: 520 }}>
            Answer three quick questions to immediately filter pieces currently in stock on our showroom floor, calibrated to your natural undertone and silhouette.
          </p>
        </div>

        {/* Right Column: Start Action Box */}
        <div style={{
          background: "var(--ink-2)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--paper)", fontWeight: 500, marginBottom: 6 }}>
              60-Second Style Match
            </div>
            <div style={{ fontSize: 13, color: "var(--stone-dim)", lineHeight: 1.5 }}>
              On-device privacy guarantee &bull; Zero photo storage &bull; Real in-stock inventory
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--stone)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brass)", width: 18 }}>01</span>
              <span>Select Department & Tailored Size</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--stone)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brass)", width: 18 }}>02</span>
              <span>Define Complexion Tone & Silhouette Cut</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--stone)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brass)", width: 18 }}>03</span>
              <span>Review Curated Showroom Pieces & Stylist Code</span>
            </div>
          </div>

          <button
            id="welcome-start-btn"
            className="btn-kiosk btn-primary"
            onClick={onStart}
            style={{ width: "100%", fontSize: 17, minHeight: 58 }}
          >
            Begin Consultation &rarr;
          </button>
        </div>
      </div>

      {/* Bottom Subtle Masthead Links */}
      <div style={{
        width: "100%",
        maxWidth: 1080,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        color: "var(--stone-dim)",
        borderTop: "1px solid var(--line)",
        paddingTop: 16,
      }}>
        <span>Compliant with India DPDP Act &bull; 100% Local On-Device Analysis</span>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--brass-bright)", textDecoration: "none", fontWeight: 600 }}
        >
          Staff Dashboard &rarr;
        </a>
      </div>
    </div>
  );
}
