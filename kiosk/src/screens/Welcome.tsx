// Welcome / Attract Loop Screen
// This is what customers see when no one is using the kiosk.

export default function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen" id="screen-welcome" style={{ position: "relative", overflow: "hidden" }}>
      {/* Ambient orbs */}
      <div className="welcome-orb orb-1" />
      <div className="welcome-orb orb-2" />

      {/* Logo */}
      <div className="logo-mark" style={{ marginBottom: 40 }}>
        <div className="logo-badge" style={{ width: 56, height: 56, fontSize: 28, borderRadius: 12 }}>F</div>
        <span className="logo-name" style={{ fontSize: 26 }}>FitFirst</span>
      </div>

      {/* Headline */}
      <h1 className="h1" style={{ marginBottom: 20 }}>
        Dressed for <span className="highlight">you.</span>
        <br />
        From our shelves.
      </h1>

      <p className="subtitle" style={{ marginBottom: 48 }}>
        Tell us your size and style — we'll show you exactly what we have in stock that suits <em>you</em>.
      </p>

      {/* CTA */}
      <button
        id="welcome-start-btn"
        className="btn-kiosk btn-primary"
        onClick={onStart}
        style={{ fontSize: 20, padding: "0 60px", minHeight: 68 }}
      >
        Find My Style →
      </button>

      <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
        Takes about 60 seconds · No account needed
      </p>

      {/* Footer watermark */}
      <div style={{
        position: "absolute",
        bottom: 24,
        fontSize: 11,
        color: "var(--text-muted)",
        display: "flex",
        gap: 24,
        letterSpacing: "0.05em",
        alignItems: "center",
      }}>
        <span>🔒 No photos stored</span>
        <span>✓ Powered by FitFirst</span>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent)", textDecoration: "none", opacity: 0.8 }}
        >
          📊 Staff Dashboard ↗
        </a>
      </div>
    </div>
  );
}
