import { useState, useEffect, useCallback } from "react";
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
  gender: "MEN" | "WOMEN" | "KIDS" | "UNISEX" | null;
  sizeInput: string;
  preferenceTags: string[];
  skinToneBucket: "FAIR" | "WHEATISH" | "MEDIUM" | "DEEP" | null;
  bodyShapeBucket: "RECTANGLE" | "TRIANGLE" | "INVERTED_T" | "HOURGLASS" | null;
  sessionId: string | null;
}

const EMPTY_SESSION: KioskSession = {
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
  const [session, setSession] = useState<KioskSession>(EMPTY_SESSION);
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
    setSession(EMPTY_SESSION);
    setHistory([]);
  }, []);

  const updateSession = (updates: Partial<KioskSession>) => {
    setSession((prev) => ({ ...prev, ...updates }));
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
          <div style={{ width: 80 }} />
        </header>
      )}

      {/* Screens */}
      {screen === "WELCOME" && <Welcome onStart={() => go("PRIVACY")} />}
      {screen === "PRIVACY" && (
        <PrivacyNotice
          onContinue={() => go("GENDER")}
          onCameraScan={() => go("CAMERA")}
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
          onSelect={(s) => { updateSession({ sizeInput: s }); go("PREFS"); }}
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
          initialGender={session.gender}
          onDetected={(skin, body, gender) => {
            updateSession({ skinToneBucket: skin, bodyShapeBucket: body, gender });
            go("RECOMMENDATIONS");
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
        />
      )}
      {screen === "HANDOFF" && (
        <StaffHandoff
          sessionId={session.sessionId}
          onReset={reset}
          autoResetSecs={HANDOFF_AUTO_RESET_SECS}
        />
      )}

      {/* Back button */}
      {showBack && (
        <button id="kiosk-back-btn" className="back-btn" onClick={back}>
          ← Back
        </button>
      )}
    </>
  );
}
