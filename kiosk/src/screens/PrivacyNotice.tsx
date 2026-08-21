// Privacy Notice Screen (DPDP-aligned)

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const IconNoPhoto = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
    <path d="M3 3l18 18" />
  </svg>
);

const IconDocument = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="3" width="12" height="18" rx="1.5" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);

const IconChoice = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.5 2.5L16 9.5" />
  </svg>
);

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
      icon: <IconLock />,
      title: "What we observe",
      text: "The kiosk briefly analyzes skin tone & body silhouette on-device solely to filter flattering in-store garments.",
    },
    {
      icon: <IconNoPhoto />,
      title: "No photos stored",
      text: "No photo, video, or biometric data is ever saved or transmitted. Analysis runs 100% locally and is deleted immediately.",
    },
    {
      icon: <IconDocument />,
      title: "What you share",
      text: "Your size & style preferences are used temporarily to show stock recommendations. No identity is collected.",
    },
    {
      icon: <IconChoice />,
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
            <div
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "var(--radius-md)",
                background: "var(--ink-3)",
                border: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brass)",
              }}
            >
              {item.icon}
            </div>
            <div style={{ textAlign: "left" }}>
              <strong style={{ display: "block", color: "var(--paper)", fontSize: 15, marginBottom: 2 }}>{item.title}</strong>
              <span style={{ fontSize: 13, color: "var(--stone)" }}>{item.text}</span>
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
          >
            Start Fast Camera Scan &rarr;
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
        >
          I'd rather not
        </button>
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: "var(--stone-dim)", maxWidth: 540, textAlign: "center" }}>
        Built in full compliance with India's Digital Personal Data Protection (DPDP) Act. Zero cloud photo storage.
      </p>
    </div>
  );
}
