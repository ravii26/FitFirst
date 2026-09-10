import { useState, useEffect, useCallback, useRef } from "react";
import Welcome from "./screens/Welcome";
import PrivacyNotice from "./screens/PrivacyNotice";
import GenderSelect from "./screens/GenderSelect";
import SizeEntry from "./screens/SizeEntry";
import StylePreferences from "./screens/StylePreferences";
import AttributeEntry from "./screens/AttributeEntry";
import CameraScan from "./screens/CameraScan";
import Recommendations from "./screens/Recommendations";
import StaffHandoff from "./screens/StaffHandoff";

// ── Flow Definition ───────────────────────────────────────────────────────────

export type Screen =
  | "WELCOME"
  | "PRIVACY"
  | "GENDER"
  | "SIZE"
  | "PREFS"
  | "ATTRIBUTES"
  | "CAMERA"
  | "RECOMMENDATIONS"
  | "HANDOFF";

// Step index for progress bar (WELCOME and HANDOFF are not counted in steps)
const STEP_SCREENS: Screen[] = ["GENDER", "SIZE", "PREFS", "ATTRIBUTES", "RECOMMENDATIONS"];

export interface KioskSession {
  requestKey: string;
  gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX" | null;
  sizeInput: string;
  preferenceTags: string[];
  skinToneBucket: "FAIR" | "WHEATISH" | "MEDIUM" | "DEEP" | null;
  bodyShapeBucket: "RECTANGLE" | "TRIANGLE" | "INVERTED_T" | "HOURGLASS" | null;
  sessionId: string | null;
}

const EMPTY_SESSION: KioskSession = {
  requestKey: "",
  gender: null,
  sizeInput: "",
  preferenceTags: [],
  skinToneBucket: null,
  bodyShapeBucket: null,
  sessionId: null,
};

// Idle timeout — reset to welcome after 90s of inactivity on HANDOFF
const HANDOFF_AUTO_RESET_SECS = 90;

export default function App() {
  const [screen, setScreen] = useState<Screen>("WELCOME");
  const [session, setSession] = useState<KioskSession>(() => ({ ...EMPTY_SESSION, requestKey: crypto.randomUUID() }));
  const [history, setHistory] = useState<Screen[]>([]);

  const go = useCallback((next: Screen) => {
    setHistory((prev) => [...prev, screen]);
    setScreen(next);
  }, [screen]);

  const back = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setScreen(prev);
    }
  }, [history]);

  const reset = useCallback(() => {
    setScreen("WELCOME");
    setSession({ ...EMPTY_SESSION, requestKey: crypto.randomUUID() });
    setHistory([]);
  }, []);

  const updateSession = (updates: Partial<KioskSession>) => {
    setSession((prev) => ({ ...prev, ...updates }));
  };

  const lastActivity = useRef(Date.now());
  const [idleRemaining, setIdleRemaining] = useState<number | null>(null);
  const continueSession = useCallback(() => { lastActivity.current = Date.now(); setIdleRemaining(null); }, []);
  useEffect(() => {
    continueSession();
    if (screen === "WELCOME" || screen === "HANDOFF") return;
    const activity = () => { lastActivity.current = Date.now(); };
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    window.addEventListener("scroll", activity, true);
    const timer = window.setInterval(() => {
      const remaining = Math.ceil((120000 - (Date.now() - lastActivity.current)) / 1000);
      if (remaining <= 0) { reset(); setIdleRemaining(null); }
      else setIdleRemaining(remaining <= 20 ? remaining : null);
    }, 1000);
    return () => { clearInterval(timer); window.removeEventListener("pointerdown", activity); window.removeEventListener("keydown", activity); window.removeEventListener("scroll", activity, true); };
  }, [screen, reset, continueSession]);
  const editPreferences = () => {
    setSession(prev => ({ ...prev, sessionId: null, requestKey: crypto.randomUUID() }));
    setHistory(["WELCOME", "PRIVACY", "GENDER", "SIZE"]);
    setScreen("PREFS");
  };

  // Step progress
  const stepIndex = STEP_SCREENS.indexOf(screen === "CAMERA" ? "ATTRIBUTES" : screen);
  const totalSteps = STEP_SCREENS.length;

  const progressPct =
    screen === "WELCOME" || screen === "PRIVACY" ? 0
    : screen === "HANDOFF" ? 100
    : ((stepIndex + 1) / totalSteps) * 100;

  const showProgress = !["WELCOME", "PRIVACY"].includes(screen);
  const showBack = !["WELCOME", "PRIVACY", "RECOMMENDATIONS", "HANDOFF"].includes(screen);

  return (
    <>
      {/* Progress bar */}
      {showProgress && (
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {/* Header */}
      {!["WELCOME"].includes(screen) && (
        <header className="screen-header">
          <div className="logo-mark">
            <div className="logo-badge">F</div>
            <span className="logo-name">FitFirst</span>
          </div>
          {showProgress && (
            <div className="step-indicator">
              {STEP_SCREENS.map((s, i) => (
                <div
                  key={s}
                  className={`step-dot ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}
                />
              ))}
            </div>
          )}
          <button className="btn-kiosk btn-ghost" onClick={reset} style={{ minHeight: 40, padding: "0 16px", fontSize: 13 }}>Start over</button>
        </header>
      )}

      {/* Screens */}
      {screen === "WELCOME" && <Welcome onStart={() => go("PRIVACY")} />}
      {screen === "PRIVACY" && (
        <PrivacyNotice
          onContinue={() => go("GENDER")}
          onDecline={reset}
        />
      )}
      {screen === "GENDER" && (
        <GenderSelect
          value={session.gender}
          onSelect={(g) => { updateSession({ gender: g }); go("SIZE"); }}
        />
      )}
      {screen === "SIZE" && (
        <SizeEntry
          gender={session.gender}
          value={session.sizeInput}
          onSelect={(s) => updateSession({ sizeInput: s })}
          onNext={() => go("PREFS")}
        />
      )}
      {screen === "PREFS" && (
        <StylePreferences
          gender={session.gender}
          selected={session.preferenceTags}
          onChange={(tags) => updateSession({ preferenceTags: tags })}
          onNext={() => go("ATTRIBUTES")}
        />
      )}
      {screen === "ATTRIBUTES" && (
        <AttributeEntry
          skinTone={session.skinToneBucket}
          bodyShape={session.bodyShapeBucket}
          onDone={(skin, body) => {
            updateSession({ skinToneBucket: skin, bodyShapeBucket: body });
            go("RECOMMENDATIONS");
          }}
          onStartCamera={() => go("CAMERA")}
        />
      )}
      {screen === "CAMERA" && (
        <CameraScan
          onDetected={(skin) => {
            updateSession({ skinToneBucket: skin });
            go("ATTRIBUTES");
          }}
          onCancel={() => go("ATTRIBUTES")}
        />
      )}
      {screen === "RECOMMENDATIONS" && (
        <Recommendations
          session={session}
          onSessionCreated={(id) => updateSession({ sessionId: id })}
          onDone={() => go("HANDOFF")}
          onReset={reset}
          onEdit={editPreferences}
        />
      )}
      {screen === "HANDOFF" && (
        <StaffHandoff
          sessionId={session.sessionId}
          onReset={reset}
          autoResetSecs={HANDOFF_AUTO_RESET_SECS}
        />
      )}

      {idleRemaining !== null && <div role="alertdialog" aria-modal="true" aria-label="Keep shopping?" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.65)", display: "grid", placeItems: "center" }}>
        <div className="privacy-box" style={{ textAlign: "center" }}><h2>Still shopping?</h2><p>Your answers will be cleared in {idleRemaining} seconds.</p><button className="btn-kiosk btn-primary" onClick={continueSession}>Keep shopping</button><button className="btn-kiosk btn-ghost" onClick={reset}>Finish</button></div>
      </div>}
      {/* Back button */}
      {showBack && (
        <button id="kiosk-back-btn" className="back-btn" onClick={back}>
          ← Back
        </button>
      )}
    </>
  );
}
