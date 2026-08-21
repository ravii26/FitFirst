// Privacy Notice Screen (DPDP-aligned)

export default function PrivacyNotice({
  onContinue,
  onCameraScan,
  onDecline,
}: {
  onContinue: () => void;
  onCameraScan?: () => void;
  onDecline: () => void;
}) {
  const items = [
    {
      icon: "🔒",
      title: "What we observe",
      text: "The kiosk briefly analyzes skin tone & body silhouette on-device solely to filter flattering in-store garments.",
    },
    {
      icon: "🚫",
      title: "No photos stored",
      text: "No photo, video, or biometric data is ever saved or transmitted. Analysis runs 100% locally and is deleted immediately.",
    },
    {
      icon: "📋",
      title: "What you share",
      text: "Your size & style preferences are used temporarily to show stock recommendations. No identity is collected.",
    },
    {
      icon: "✋",
      title: "Your choice",
      text: "Tap Continue to proceed. You can select attributes manually or use the optional camera scan on the next screen.",
    },
  ];

  return (
    <div className="screen screen-scrollable" id="screen-privacy" style={{ paddingTop: 80, paddingBottom: 60 }}>
      <h2 className="h2" style={{ marginBottom: 8 }}>Privacy & Data Guarantee</h2>
      <p className="subtitle" style={{ marginBottom: 32 }}>
        Transparent, on-device analysis built in accordance with India's DPDP Act.
      </p>

      <div className="privacy-box" style={{ marginBottom: 32 }}>
        {items.map((item) => (
          <div key={item.title} className="privacy-item" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div className="privacy-icon" style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
            <div className="privacy-text" style={{ textAlign: "left" }}>
              <strong style={{ display: "block", color: "var(--text-heading)", fontSize: 15, marginBottom: 2 }}>{item.title}</strong>
              <span style={{ fontSize: 13, color: "var(--text-body)" }}>{item.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {onCameraScan && (
          <button
            id="privacy-camera-btn"
            className="btn-kiosk btn-primary"
            onClick={onCameraScan}
            style={{ background: "linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)" }}
          >
            ⚡ Start Fast Camera Scan &rarr;
          </button>
        )}
        <button
          id="privacy-continue-btn"
          className="btn-kiosk btn-ghost"
          onClick={onContinue}
        >
          Manual Selection &rarr;
        </button>
        <button
          id="privacy-decline-btn"
          className="btn-kiosk btn-ghost"
          onClick={onDecline}
          style={{ opacity: 0.6 }}
        >
          I'd rather not
        </button>
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: "var(--text-muted)", maxWidth: 540, textAlign: "center" }}>
        Built in full compliance with India's Digital Personal Data Protection (DPDP) Act. Zero cloud photo storage.
      </p>
    </div>
  );
}
