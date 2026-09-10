/// <reference types="vite/client" />
import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Analytics from "./pages/Analytics";
import BaselineLog from "./pages/BaselineLog";
import Inventory from "./pages/Inventory";
import Sessions from "./pages/Sessions";

import { apiFetch } from "./lib/api";

// ── Minimal Architectural Icons ─────────────────────────────────────────────

const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconBox = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const IconChart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconClipboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ── Theme Hook ──────────────────────────────────────────────────────────────

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("fitfirst-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fitfirst-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return [theme, toggle];
}

// ── Login Screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || busy) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError("");
    if (newPin.length === 4) {
      setBusy(true);
      try {
        await apiFetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: newPin }) });
        onLogin();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to sign in");
        setPin("");
      } finally { setBusy(false); }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "0" && e.key <= "9") {
      handleDigit(e.key);
    } else if (e.key === "Backspace") {
      handleDelete();
    }
  };

  return (
    <div
      className="atelier-auth-viewport"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      autoFocus
      style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        minHeight: "100vh",
        background: "var(--atelier-bg)",
        outline: "none",
      }}
    >
      {/* Left Brand Panel */}
      <div
        style={{
          borderRight: "1px solid var(--atelier-hairline)",
          padding: "64px 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, var(--atelier-bg) 0%, var(--atelier-surface) 100%)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: "var(--atelier-brass)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--atelier-bg)",
              }}
            >
              F
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--atelier-text-title)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                FitFirst
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--atelier-brass-light)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Showroom Operations Console
              </div>
            </div>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(34px, 3.5vw, 48px)",
              lineHeight: 1.1,
              fontWeight: 400,
              color: "var(--atelier-text-title)",
              marginBottom: 20,
              maxWidth: 480,
            }}
          >
            In-store clienteling, fitting attribution &amp; floor inventory.
          </h1>
          <p style={{ fontSize: 15, color: "var(--atelier-text-body)", lineHeight: 1.6, maxWidth: 440 }}>
            Dedicated staff portal for store stylists, inventory managers, and retail pilot directors.
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--atelier-hairline)", paddingTop: 20, display: "flex", justifyContent: "space-between", fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--atelier-text-muted)" }}>
          <span>Ahmedabad Flagship Showroom</span>
          <span>Pilot Phase 1 Active</span>
        </div>
      </div>

      {/* Right Terminal Keypad Panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--atelier-brass-light)", marginBottom: 8 }}>
            Stylist Security Gate
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--atelier-text-title)", fontWeight: 400, marginBottom: 8 }}>
            Enter Console Passcode
          </h2>
          <p style={{ fontSize: 13, color: "var(--atelier-text-muted)", marginBottom: 32 }}>
            Tap or type your 4-digit stylist access code
          </p>

          {/* 4 Discrete Hairline Digit Cells */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 32 }}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: 52,
                    height: 60,
                    borderRadius: "var(--radius-sm)",
                    background: isFilled ? "var(--atelier-surface-sub)" : "transparent",
                    border: error
                      ? "1px solid var(--atelier-terracotta)"
                      : isFilled
                      ? "1px solid var(--atelier-brass-light)"
                      : "1px solid var(--atelier-hairline)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isFilled && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: error ? "var(--atelier-terracotta)" : "var(--atelier-brass-light)",
                        boxShadow: error ? "none" : "0 0 10px rgba(200, 155, 83, 0.4)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 10-Digit Touch Dial */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                style={{
                  height: 56,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--atelier-surface)",
                  border: "1px solid var(--atelier-hairline)",
                  color: "var(--atelier-text-title)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 18,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                }}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin("")}
              style={{
                height: 56,
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                border: "1px solid transparent",
                color: "var(--atelier-text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Clear
            </button>
            <button
              key="0"
              type="button"
              onClick={() => handleDigit("0")}
              style={{
                height: 56,
                borderRadius: "var(--radius-sm)",
                background: "var(--atelier-surface)",
                border: "1px solid var(--atelier-hairline)",
                color: "var(--atelier-text-title)",
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                height: 56,
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                border: "1px solid transparent",
                color: "var(--atelier-text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ⌫
            </button>
          </div>

          <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--atelier-text-muted)" }}>
            {busy ? "Signing in…" : "Use the passcode provided by your store manager."}
            {error && <p role="alert" style={{ marginTop: 12, color: "var(--atelier-terracotta)" }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Atelier App ────────────────────────────────────────────────────────

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const [checking, setChecking] = useState(true);
  const [lockError, setLockError] = useState("");
  useEffect(() => {
    apiFetch("/api/auth/session").then(() => setAuthenticated(true)).catch(() => setAuthenticated(false)).finally(() => setChecking(false));
    const expired = () => setAuthenticated(false);
    window.addEventListener("fitfirst:unauthorized", expired);
    return () => window.removeEventListener("fitfirst:unauthorized", expired);
  }, []);
  const lock = async () => {
    try { await apiFetch("/api/auth/logout", { method: "POST" }); setAuthenticated(false); setLockError(""); }
    catch { setLockError("Could not lock the dashboard. Please retry."); }
  };
  if (checking) return <div className="loading-center">Checking staff session…</div>;

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  const navItems = [
    { to: "/sessions", label: "Sessions", icon: <IconUsers /> },
    { to: "/inventory", label: "Inventory", icon: <IconBox /> },
    { to: "/analytics", label: "Analytics", icon: <IconChart /> },
    { to: "/baseline", label: "Baseline Log", icon: <IconClipboard /> },
  ];

  return (
    <div className="atelier-shell">
      {/* Editorial Masthead */}
      <header className="atelier-masthead">
        <div className="masthead-brand">
          <div className="brand-monogram">F</div>
          <div>
            <div className="brand-title">
              FitFirst <span className="brand-subtitle">&middot; Showroom Console</span>
            </div>
          </div>
        </div>

        {/* Central View Tabs */}
        <nav className="masthead-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) => `masthead-tab ${isActive ? "active" : ""}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Operational Actions */}
        <div className="masthead-actions">
          <button
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? <IconMoon /> : <IconSun />}
          </button>
          <a
            id="launch-kiosk-btn"
            href="http://localhost:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Launch Kiosk ↗
          </a>
          <button
            id="logout-btn"
            className="btn btn-secondary btn-sm"
            onClick={lock}
          >
            Lock
          </button>
        </div>
      </header>

      {lockError && <p role="alert" className="alert alert-error">{lockError}</p>}
      {/* Main Viewport */}
      <main className="atelier-viewport">
        <Routes>
          <Route path="/" element={<Navigate to="/sessions" replace />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/baseline" element={<BaselineLog />} />
          <Route path="*" element={<Navigate to="/sessions" replace />} />
        </Routes>
      </main>
    </div>
  );
}

