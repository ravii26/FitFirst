// Staff Handoff Screen — Luxury Code Presentation

import { useEffect, useState } from "react";

function shortCode(sessionId: string | null): string {
  if (!sessionId) return "——";
  return sessionId.slice(-6).toUpperCase();
}

export default function StaffHandoff({
  sessionId,
  onReset,
  autoResetSecs,
}: {
  sessionId: string | null;
  onReset: () => void;
  autoResetSecs: number;
}) {
  const [remaining, setRemaining] = useState(autoResetSecs);

  useEffect(() => {
    if (remaining <= 0) { onReset(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onReset]);

  const pct = (remaining / autoResetSecs) * 100;

  return (
    <div className="screen" id="screen-handoff" style={{ position: "relative" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 16px",
          borderRadius: 100,
          background: "var(--success-dim)",
          border: "1px solid rgba(46, 229, 157, 0.3)",
          fontSize: 12,
          color: "var(--success)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          ✓ Session Generated & Logged
        </div>
        <h2 className="h2" style={{ marginBottom: 12 }}>Your Stylist Handoff Code</h2>
        <p className="subtitle">
          Please present this session code to any store floor stylist. They will instantly retrieve your recommendations for fitting.
        </p>
      </div>

      {/* Code Card */}
      <div className="handoff-card" id="handoff-code-card">
        <p style={{ fontSize: 12, color: "var(--gold-warm)", letterSpacing: "0.12em", fontWeight: 700 }}>
          HANDOFF CODE
        </p>
        <div className="handoff-code" id="handoff-code-value">
          {shortCode(sessionId)}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Store Stylists: Enter code in <strong>FitFirst Dashboard &rarr; Sessions</strong>
        </p>
      </div>

      <div style={{ marginTop: 40, display: "flex", gap: 16 }}>
        <button
          id="handoff-reset-btn"
          className="btn-kiosk btn-ghost"
          onClick={onReset}
        >
          Finish & Return to Start
        </button>
      </div>

      <p style={{ marginTop: 28, fontSize: 13, color: "var(--text-muted)" }}>
        Session auto-resets in {remaining}s
      </p>

      {/* Countdown bar */}
      <div className="reset-timer-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.06)" }}>
        <div className="reset-timer-fill" style={{ height: "100%", background: "var(--gold-primary)", width: `${pct}%`, transition: "width 1s linear" }} />
      </div>
    </div>
  );
}
