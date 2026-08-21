/// <reference types="vite/client" />
import { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Analytics from "./pages/Analytics";
import BaselineLog from "./pages/BaselineLog";
import Inventory from "./pages/Inventory";
import Sessions from "./pages/Sessions";

const DASHBOARD_PIN = import.meta.env.VITE_DASHBOARD_PIN ?? "1234";

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

// ── Login Screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === DASHBOARD_PIN) {
      onLogin();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card fade-in">
        <div className="login-logo-mark">F</div>
        <h1 className="login-title">FitFirst Atelier</h1>
        <p className="login-subtitle">In-Store Stylist & Showroom Operations</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <input
              id="pin-input"
              className="pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              autoFocus
              style={{ borderColor: error ? "var(--atelier-terracotta)" : undefined }}
            />
          </div>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "12px", justifyContent: "center" }}>
              Incorrect Access PIN
            </div>
          )}
          <button id="pin-submit-btn" type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Enter Showroom Console
          </button>
        </form>

        <p style={{ marginTop: "16px", fontSize: "11px", color: "var(--atelier-text-muted)", fontFamily: "var(--font-mono)" }}>
          Authorized Stylist Access &bull; PIN: 1234
        </p>
      </div>
    </div>
  );
}

// ── Main Atelier App ────────────────────────────────────────────────────────

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

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
            onClick={() => setAuthenticated(false)}
          >
            Lock
          </button>
        </div>
      </header>

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
