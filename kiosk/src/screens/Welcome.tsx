// Welcome / Attract Screen — Luxury Atelier Entrance

export default function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen" id="screen-welcome" style={{ position: "relative", overflow: "hidden" }}>
      {/* Brand Badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 16px",
        borderRadius: 100,
        background: "rgba(212, 175, 55, 0.1)",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--gold-warm)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 32,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold-primary)" }} />
        Personal In-Store Recommendation Engine
      </div>

      {/* Logo Mark */}
      <div className="logo-mark" style={{ marginBottom: 28 }}>
        <div className="logo-badge" style={{ width: 60, height: 60, fontSize: 30, borderRadius: 14 }}>F</div>
        <div>
          <div className="logo-name" style={{ fontSize: 32, fontFamily: "var(--font-serif)" }}>FitFirst</div>
          <div className="logo-subtag">ATELIER COLLECTION</div>
        </div>
      </div>

      {/* Headline */}
      <h1 className="h1" style={{ marginBottom: 20, maxWidth: 840 }}>
        Curated for your <span className="highlight">fit & silhouette.</span>
      </h1>

      <p className="subtitle" style={{ marginBottom: 48, fontSize: 18 }}>
        Scan your preferences to discover garments from our live showroom floor precisely matched to your tone, size, and cut.
      </p>

      {/* CTA Button */}
      <button
        id="welcome-start-btn"
        className="btn-kiosk btn-primary"
        onClick={onStart}
        style={{ fontSize: 18, padding: "0 64px", minHeight: 64 }}
      >
        Discover My Collection &rarr;
      </button>

      <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
        60-Second Consultation &bull; On-Device Privacy Guaranteed &bull; Live In-Stock
      </p>

      {/* Footer info */}
      <div style={{
        position: "absolute",
        bottom: 28,
        fontSize: 11,
        color: "var(--text-muted)",
        display: "flex",
        gap: 32,
        letterSpacing: "0.06em",
        alignItems: "center",
      }}>
        <span>🔒 Zero Photo Storage</span>
        <span>✓ Store Inventory Sync</span>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--gold-warm)", textDecoration: "none", opacity: 0.9, fontWeight: 600 }}
        >
          &rarr; Staff Dashboard
        </a>
      </div>
    </div>
  );
}
