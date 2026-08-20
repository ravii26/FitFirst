// Staff Handoff Screen
// Shows the session short-code for staff to look up.
// Auto-resets after a countdown.

import { useEffect, useState } from "react";

function shortCode(sessionId: string | null): string {
  if (!sessionId) return "——";
  // Take last 6 chars of cuid, uppercase — unique enough for a single store
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
      {/* Ambient */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 className="h2" style={{ marginBottom: 12 }}>Your recommendations are ready!</h2>
        <p className="subtitle">
          Show this code to a staff member and they'll help you find these items.
        </p>
      </div>

      {/* Code Card */}
      <div className="handoff-card" id="handoff-code-card">
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
          YOUR SESSION CODE
        </p>
        <div className="handoff-code" id="handoff-code-value">
          {shortCode(sessionId)}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Staff: look up this code in the FitFirst dashboard → Sessions
        </p>
      </div>

      <div style={{ marginTop: 40, display: "flex", gap: 16 }}>
        <button
          id="handoff-reset-btn"
          className="btn-kiosk btn-ghost"
          onClick={onReset}
        >
          Start Over
        </button>
      </div>

      <p style={{ marginTop: 28, fontSize: 13, color: "var(--text-muted)" }}>
        This screen will reset in {remaining}s
      </p>

      {/* Countdown bar */}
      <div className="reset-timer-bar">
        <div className="reset-timer-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
