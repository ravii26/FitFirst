// Welcome / Attract Screen — Editorial Atelier Entrance

export default function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen" id="screen-welcome">
      {/* Eyebrow */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--brass)",
          marginBottom: 28,
        }}
      >
        In-Store Styling &middot; FitFirst
      </div>

      {/* Headline */}
      <h1 className="h1" style={{ marginBottom: 20, maxWidth: 840 }}>
        Curated for your <span className="highlight">fit & silhouette.</span>
      </h1>

      <p className="subtitle" style={{ marginBottom: 44, fontSize: 18 }}>
        Answer a few questions. See what's actually on our floor today, chosen for your tone, size, and cut.
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

      <p style={{ marginTop: 24, fontSize: 13, color: "var(--stone-dim)", letterSpacing: "0.02em" }}>
        60-second consultation &bull; on-device, nothing uploaded
      </p>

      {/* Footer info */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--stone-dim)",
          display: "flex",
          gap: 28,
          letterSpacing: "0.04em",
          alignItems: "center",
        }}
      >
        <span>No photos stored, ever</span>
        <span>Live inventory sync</span>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--brass-bright)", textDecoration: "none", fontWeight: 600 }}
        >
          &rarr; Staff Dashboard
        </a>
      </div>
    </div>
  );
}
