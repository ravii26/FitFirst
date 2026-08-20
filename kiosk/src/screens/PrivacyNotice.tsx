// Privacy Notice Screen (DPDP-aligned)
// Plain language, transparent, no dark patterns.

export default function PrivacyNotice({
  onContinue,
  onDecline,
}: {
  onContinue: () => void;
  onDecline: () => void;
}) {
  const items = [
    {
      icon: "👁️",
      title: "What we observe",
      text: "The kiosk briefly observes your appearance to estimate your skin tone and body shape category — only for recommendation purposes.",
    },
    {
      icon: "🚫",
      title: "No photos stored",
      text: "No photo, video, or biometric data is ever saved. The analysis runs entirely on this device and is discarded immediately.",
    },
    {
      icon: "📋",
      title: "What you share",
      text: "Your size and style preferences are saved temporarily to show you recommendations. No personal identity is collected.",
    },
    {
      icon: "✋",
      title: "Your choice",
      text: "You can skip the camera scan and enter your preferences manually. Selecting \"Continue\" means you consent to the brief on-device scan.",
    },
  ];

  return (
    <div className="screen screen-scrollable" id="screen-privacy" style={{ paddingTop: 100 }}>
      <h2 className="h2" style={{ marginBottom: 8 }}>Before we start</h2>
      <p className="subtitle" style={{ marginBottom: 32 }}>
        Here's exactly what this kiosk does — and doesn't — do with your information.
      </p>

      <div className="privacy-box" style={{ marginBottom: 36 }}>
        {items.map((item) => (
          <div key={item.title} className="privacy-item">
            <div className="privacy-icon">{item.icon}</div>
            <div className="privacy-text">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <button
          id="privacy-continue-btn"
          className="btn-kiosk btn-primary"
          onClick={onContinue}
        >
          I Understand — Continue
        </button>
        <button
          id="privacy-decline-btn"
          className="btn-kiosk btn-ghost"
          onClick={onDecline}
        >
          No Thanks
        </button>
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: "var(--text-muted)", maxWidth: 540, textAlign: "center" }}>
        Data handling is built in line with India's Digital Personal Data Protection Act (DPDP). For questions, speak with a staff member.
      </p>
    </div>
  );
}
