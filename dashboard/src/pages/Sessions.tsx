import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "../lib/api";

const API = "/api";
const ITEMS_PER_PAGE = 10;
const DISMISSED_KEY = "fitfirst-dismissed-sessions";

interface RecommendationItem {
  rank: number;
  score: number;
  productId: string;
  product?: { name: string; sku: string; price: number; category?: string };
}

interface Session {
  id: string;
  skinToneBucket: string;
  bodyShapeBucket: string;
  gender: string;
  sizeInput: string;
  preferenceTags: string[];
  createdAt: string;
  recommendations: RecommendationItem[];
  purchaseEvents: { wasRecommended: boolean; amount: number; productId?: string }[];
}

function shortCode(sessionId: string): string {
  return sessionId.slice(-6).toUpperCase();
}

function formatTone(tone: string): string {
  const map: Record<string, string> = {
    FAIR: "Fair / Porcelain",
    WHEATISH: "Wheatish / Golden",
    MEDIUM: "Medium / Olive",
    DEEP: "Deep / Ebony",
  };
  return map[tone] || tone.replace(/_/g, " ");
}

function formatShape(shape: string): string {
  const map: Record<string, string> = {
    RECTANGLE: "Athletic & Straight",
    TRIANGLE: "Pear / A-Line",
    INVERTED_T: "Broad Shoulder",
    HOURGLASS: "Curvy & Defined",
  };
  return map[shape] || shape.replace(/_/g, " ");
}

function formatGender(gender?: string): string {
  if (!gender) return "All Collections";
  const map: Record<string, string> = {
    MEN: "Men's Collection",
    WOMEN: "Women's Collection",
    KIDS: "Junior Collection",
    UNISEX: "Unisex / Universal",
  };
  return map[gender] || gender;
}

function formatSessionDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return format(d, "dd MMM yyyy") + " · " + format(d, "HH:mm");
  } catch {
    return dateStr;
  }
}

// ── Dismissed Sessions Helpers ───────────────────────────────────────────────

function getDismissedSessions(): Record<string, { reason: string; at: string }> {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "{}");
  } catch {
    return {};
  }
}

function dismissSession(sessionId: string, reason: string) {
  const map = getDismissedSessions();
  map[sessionId] = { reason, at: new Date().toISOString() };
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}

function undismissSession(sessionId: string) {
  const map = getDismissedSessions();
  delete map[sessionId];
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}

// ── Log Purchase Modal ───────────────────────────────────────────────────────

function LogPurchaseModal({
  session,
  onClose,
  onSaved,
}: {
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState(
    session.recommendations[0]?.productId ?? ""
  );
  const [amount, setAmount] = useState(
    session.recommendations[0]?.product?.price?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !amount) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`${API}/purchase-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          productId: selectedProductId,
          wasRecommended: session.recommendations.some((r) => r.productId === selectedProductId),
          amount: parseInt(amount),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to log purchase");
      }
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProductChange = (pid: string) => {
    setSelectedProductId(pid);
    const match = session.recommendations.find((r) => r.productId === pid);
    if (match?.product?.price) setAmount(match.product.price.toString());
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,9,8,0.82)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%", maxWidth: 480, background: "var(--atelier-surface)",
          border: "1px solid var(--atelier-brass-line)",
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-brass)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Attribution Register
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--atelier-text-muted)" }}>
            #{shortCode(session.id)}
          </span>
        </div>
        <h3 style={{ fontSize: 20, fontFamily: "var(--font-serif)", marginBottom: 6, color: "var(--atelier-text-title)" }}>
          Log Customer Purchase
        </h3>
        <p style={{ fontSize: 13, color: "var(--atelier-text-muted)", marginBottom: 24 }}>
          Record the exact piece the customer selected to attribute sales to this styling session.
        </p>

        {success ? (
          <div className="alert alert-success" style={{ background: "var(--atelier-sage-ghost)", color: "var(--atelier-sage)", border: "1px solid var(--atelier-sage)" }}>
            ✓ Sale logged successfully to pilot register!
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label htmlFor="purchase-product" style={{ color: "var(--atelier-text-title)", fontSize: 12 }}>
                Selected Garment
              </label>
              {session.recommendations.length > 0 ? (
                <select
                  id="purchase-product"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  style={{ background: "var(--atelier-surface-sub)", color: "var(--atelier-text-title)", border: "1px solid var(--atelier-hairline)" }}
                >
                  {session.recommendations.map((r) => (
                    <option key={r.productId} value={r.productId}>
                      Pick #{r.rank} &mdash; {r.product?.name ?? r.productId.slice(0, 12) + "…"} {r.product?.sku ? `(${r.product.sku})` : ""}
                    </option>
                  ))}
                  <option value="__other__">Other In-Store Item (Unlisted)</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Product ID"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                />
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label htmlFor="purchase-amount" style={{ color: "var(--atelier-text-title)", fontSize: 12 }}>
                Transaction Amount (₹ INR)
              </label>
              <input
                id="purchase-amount"
                type="number"
                min="1"
                required
                placeholder="e.g. 2499"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ background: "var(--atelier-surface-sub)", color: "var(--atelier-text-title)", border: "1px solid var(--atelier-hairline)", fontFamily: "var(--font-mono)", fontSize: 16 }}
              />
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                id="log-purchase-submit"
                type="submit"
                className="btn btn-primary"
                disabled={saving || !selectedProductId || !amount}
              >
                {saving ? "Recording…" : "Complete Attribution"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Dismiss Session Modal ────────────────────────────────────────────────────

function DismissModal({
  session,
  onClose,
  onDismissed,
}: {
  session: Session;
  onClose: () => void;
  onDismissed: () => void;
}) {
  const [reason, setReason] = useState("LEFT_WITHOUT_PURCHASE");

  const reasons: { value: string; label: string; desc: string }[] = [
    { value: "LEFT_WITHOUT_PURCHASE", label: "Customer left without purchasing", desc: "Browsed but didn't find a match or wasn't ready to buy" },
    { value: "JUST_BROWSING", label: "Just browsing / window shopping", desc: "Exploring the store without intent to buy today" },
    { value: "PRICE_OBJECTION", label: "Price was too high", desc: "Liked items but couldn't justify the price point" },
    { value: "SIZE_NOT_AVAILABLE", label: "Desired size not in stock", desc: "Would have purchased but their size was unavailable" },
    { value: "WILL_RETURN", label: "Said they'll return later", desc: "Expressed interest and plans to come back" },
    { value: "OTHER", label: "Other reason", desc: "No specific reason captured" },
  ];

  const handleDismiss = () => {
    dismissSession(session.id, reason);
    onDismissed();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,9,8,0.82)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%", maxWidth: 480, background: "var(--atelier-surface)",
          border: "1px solid var(--atelier-brass-line)",
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-terracotta)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            No Purchase
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--atelier-text-muted)" }}>
            #{shortCode(session.id)}
          </span>
        </div>
        <h3 style={{ fontSize: 20, fontFamily: "var(--font-serif)", marginBottom: 6, color: "var(--atelier-text-title)" }}>
          Mark as No Purchase
        </h3>
        <p style={{ fontSize: 13, color: "var(--atelier-text-muted)", marginBottom: 20 }}>
          Record why this customer didn't purchase so the pilot can track conversion barriers.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {reasons.map((r) => (
            <label
              key={r.value}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 16px",
                background: reason === r.value ? "var(--atelier-surface-sub)" : "transparent",
                border: reason === r.value ? "1px solid var(--atelier-hairline-pop)" : "1px solid var(--atelier-hairline)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            >
              <input
                type="radio"
                name="dismiss-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                style={{ marginTop: 2, accentColor: "var(--atelier-text-title)" }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--atelier-text-title)" }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--atelier-text-muted)", marginTop: 2 }}>{r.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDismiss}
            style={{ background: "var(--atelier-terracotta)", borderColor: "var(--atelier-terracotta)" }}
          >
            Mark No Purchase
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Sessions Page ───────────────────────────────────────────────────────

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "PURCHASED" | "PENDING" | "DISMISSED">("ALL");
  const [logTarget, setLogTarget] = useState<Session | null>(null);
  const [dismissTarget, setDismissTarget] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dismissedMap, setDismissedMap] = useState<Record<string, { reason: string; at: string }>>(getDismissedSessions());
  
  // Expandable session cards state (Set of session IDs)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const loadSessions = () => {
    setLoading(true);
    apiFetch(`${API}/sessions`)
      .then((r) => r.json())
      .then((data) => {
        const loadedSessions = Array.isArray(data) ? data : [];
        setSessions(loadedSessions);
        // Default first session expanded for immediate visual preview
        if (loadedSessions.length > 0) {
          setExpandedIds(new Set([loadedSessions[0].id]));
        }
        setLoading(false);
      })
      .catch(() => {
        setSessions([]);
        setLoading(false);
      });
  };

  useEffect(() => { loadSessions(); }, []);

  const refreshDismissed = () => setDismissedMap(getDismissedSessions());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(safeSessions.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const purchasedCount = safeSessions.filter((s) => (s.purchaseEvents || []).length > 0).length;
  const dismissedCount = safeSessions.filter((s) => dismissedMap[s.id] && (s.purchaseEvents || []).length === 0).length;
  const pendingCount = safeSessions.length - purchasedCount - dismissedCount;

  const getSessionOutcome = (s: Session): "purchased" | "dismissed" | "pending" => {
    if ((s.purchaseEvents || []).length > 0) return "purchased";
    if (dismissedMap[s.id]) return "dismissed";
    return "pending";
  };

  // Filter pipeline
  const filtered = safeSessions.filter((s) => {
    const outcome = getSessionOutcome(s);
    if (filterMode === "PURCHASED" && outcome !== "purchased") return false;
    if (filterMode === "PENDING" && outcome !== "pending") return false;
    if (filterMode === "DISMISSED" && outcome !== "dismissed") return false;

    // Search query filter
    if (!search.trim()) return true;
    const q = search.trim().toUpperCase();
    return shortCode(s.id).includes(q) || s.id.toUpperCase().includes(q);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSessions = filtered.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterMode]);

  const dismissReasonLabels: Record<string, string> = {
    LEFT_WITHOUT_PURCHASE: "Left without purchase",
    JUST_BROWSING: "Just browsing",
    PRICE_OBJECTION: "Price objection",
    SIZE_NOT_AVAILABLE: "Size unavailable",
    WILL_RETURN: "Will return later",
    OTHER: "No purchase",
  };

  const allExpanded = paginatedSessions.length > 0 && paginatedSessions.every((s) => expandedIds.has(s.id));

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>;

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Editorial Header */}
      <div className="page-header">
        <h1 className="page-title">Stylist Client Dossiers</h1>
        <p className="page-subtitle">
          {safeSessions.length} recorded consultations &middot; Look up 6-character handoff code from kiosk tablet
        </p>
      </div>

      {/* ── Atelier Filter & Lookup Toolbar ── */}
      <div className="atelier-toolbar">
        <div className="atelier-search-wrap">
          <svg className="atelier-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="session-code-search"
            className="atelier-search-input"
            type="text"
            placeholder="Search by 6-char Handoff Code (e.g. AB12CD)…"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="filter-chip-group">
            <button
              className={`filter-chip ${filterMode === "ALL" ? "active" : ""}`}
              onClick={() => setFilterMode("ALL")}
            >
              All ({safeSessions.length})
            </button>
            <button
              className={`filter-chip ${filterMode === "PURCHASED" ? "active" : ""}`}
              onClick={() => setFilterMode("PURCHASED")}
            >
              Purchased ({purchasedCount})
            </button>
            <button
              className={`filter-chip ${filterMode === "PENDING" ? "active" : ""}`}
              onClick={() => setFilterMode("PENDING")}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`filter-chip ${filterMode === "DISMISSED" ? "active" : ""}`}
              onClick={() => setFilterMode("DISMISSED")}
            >
              No Purchase ({dismissedCount})
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={allExpanded ? collapseAll : expandAll}
            style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
            title={allExpanded ? "Collapse all session cards" : "Expand all session cards"}
          >
            <span>{allExpanded ? "Collapse All ↑" : "Expand All ↓"}</span>
          </button>
        </div>
      </div>

      {/* ── Dossier List ── */}
      {safeSessions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "64px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--atelier-text-title)", marginBottom: 6 }}>
            No Consultations Recorded Yet
          </h3>
          <p style={{ color: "var(--atelier-text-muted)", fontSize: 13, maxWidth: 400, margin: "0 auto" }}>
            When a shopper interacts with the in-store kiosk tablet, their personal styling dossier will appear here automatically.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ color: "var(--atelier-text-muted)", fontSize: 14 }}>
            No sessions match your search &ldquo;<strong>{search}</strong>&rdquo; or current filter.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => { setSearch(""); setFilterMode("ALL"); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="dossier-list">
            {paginatedSessions.map((s) => {
              const purchaseEvents = s.purchaseEvents || [];
              const totalRevenue = purchaseEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
              const recPurchases = purchaseEvents.filter((e) => e.wasRecommended);
              const hasPurchase = purchaseEvents.length > 0;
              const hasRecPurchase = recPurchases.length > 0;
              const recommendations = s.recommendations || [];
              const outcome = getSessionOutcome(s);
              const dismissInfo = dismissedMap[s.id];
              const isExpanded = expandedIds.has(s.id);

              return (
                <div
                  key={s.id}
                  id={`session-${s.id}`}
                  className={`dossier-card ${outcome === "purchased" ? "has-purchase" : outcome === "dismissed" ? "dismissed" : "pending"}`}
                  style={{
                    paddingBottom: isExpanded ? 22 : 16,
                  }}
                >
                  {/* Dossier Top Bar Header */}
                  <div
                    className="dossier-topbar"
                    style={{
                      marginBottom: isExpanded ? 16 : 0,
                      paddingBottom: isExpanded ? 14 : 0,
                      borderBottom: isExpanded ? "1px solid var(--atelier-hairline)" : "none",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    onClick={() => toggleExpanded(s.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div className="dossier-code-badge">
                        <span style={{ color: "var(--atelier-brass)" }}>#</span>
                        <span>{shortCode(s.id)}</span>
                      </div>
                      <span className="dossier-time">
                        {formatSessionDate(s.createdAt)}
                      </span>

                      {/* Collapsed Summary Chips */}
                      {!isExpanded && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                          <span style={{ fontSize: 12, color: "var(--atelier-text-title)", fontWeight: 500 }}>
                            {formatGender(s.gender)} &middot; Size {s.sizeInput || "Std"}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--atelier-text-muted)", fontFamily: "var(--font-mono)" }}>
                            ({recommendations.length} Recs)
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasRecPurchase ? (
                        <span className="outcome-tag success">
                          ✓ Rec'd Piece Purchased (₹{totalRevenue.toLocaleString("en-IN")})
                        </span>
                      ) : hasPurchase ? (
                        <span className="outcome-tag success">
                          ✓ In-Store Purchase (₹{totalRevenue.toLocaleString("en-IN")})
                        </span>
                      ) : outcome === "dismissed" ? (
                        <span className="outcome-tag" style={{ color: "var(--atelier-terracotta)" }}>
                          ✗ {dismissReasonLabels[dismissInfo?.reason] || "No Purchase"}
                        </span>
                      ) : (
                        <span className="outcome-tag pending">
                          Pending Stylist Review
                        </span>
                      )}

                      {outcome === "pending" && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDismissTarget(s)}
                            style={{ fontSize: 12 }}
                          >
                            No Purchase
                          </button>
                          <button
                            id={`log-purchase-${s.id}`}
                            className="btn btn-primary btn-sm"
                            onClick={() => setLogTarget(s)}
                          >
                            + Log Purchase
                          </button>
                        </>
                      )}

                      {outcome === "purchased" && (
                        <button
                          id={`log-purchase-${s.id}`}
                          className="btn btn-primary btn-sm"
                          onClick={() => setLogTarget(s)}
                        >
                          Update Sale
                        </button>
                      )}

                      {outcome === "dismissed" && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { undismissSession(s.id); refreshDismissed(); }}
                          style={{ fontSize: 12 }}
                        >
                          Undo
                        </button>
                      )}

                      {/* Expand / Collapse Chevron Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpanded(s.id)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          width: 32,
                          height: 32,
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "var(--radius-xs)",
                          fontSize: 12,
                        }}
                        title={isExpanded ? "Collapse Details" : "Expand Details"}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Dossier Details Body */}
                  {isExpanded && (
                    <div className="fade-in">
                      {/* Client Fitting Profile */}
                      <div className="client-profile-grid">
                        <div className="profile-spec-item">
                          <span className="profile-spec-label">Dept:</span>
                          <span>{formatGender(s.gender)}</span>
                        </div>
                        <div className="profile-spec-item">
                          <span className="profile-spec-label">Size:</span>
                          <strong style={{ color: "var(--atelier-brass-light)", fontFamily: "var(--font-mono)" }}>
                            {s.sizeInput || "Standard"}
                          </strong>
                        </div>
                        <div className="profile-spec-item">
                          <span className="profile-spec-label">Tone:</span>
                          <span>{formatTone(s.skinToneBucket)}</span>
                        </div>
                        <div className="profile-spec-item">
                          <span className="profile-spec-label">Silhouette:</span>
                          <span>{formatShape(s.bodyShapeBucket)}</span>
                        </div>
                        {s.preferenceTags.length > 0 && (
                          <div className="profile-spec-item">
                            <span className="profile-spec-label">Aesthetic:</span>
                            <span style={{ color: "var(--atelier-text-body)" }}>
                              {s.preferenceTags.map((t) => t.replace(/_/g, " ")).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Showroom Recommendations Ribbon */}
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                          Curated Floor Pieces ({recommendations.length} items)
                        </div>

                        {recommendations.length > 0 ? (
                          <div className="recs-strip">
                            {recommendations.map((r) => {
                              const wasBought = purchaseEvents.some((e) => e.productId === r.productId);
                              const matchPct = Math.round(r.score * 100);

                              return (
                                <div
                                  key={r.productId}
                                  className={`rec-item-card ${wasBought ? "is-purchased" : ""}`}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className="rec-item-match">
                                      #{r.rank} &middot; {matchPct}%
                                    </span>
                                    {wasBought && (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--atelier-sage)", fontFamily: "var(--font-mono)" }}>
                                        ✓ PURCHASED
                                      </span>
                                    )}
                                  </div>
                                  <div className="rec-item-title">
                                    {r.product?.name ?? "Showroom Piece"}
                                  </div>
                                  {r.product?.sku && (
                                    <div style={{ fontSize: 10.5, color: "var(--atelier-text-muted)", fontFamily: "var(--font-mono)" }}>
                                      SKU: {r.product.sku}
                                    </div>
                                  )}
                                  <div className="rec-item-price">
                                    ₹{(r.product?.price ?? 0).toLocaleString("en-IN")}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "var(--atelier-text-muted)", fontStyle: "italic", padding: "8px 0" }}>
                            No exact matches found on floor for this size/style combination.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Pagination Controls ── */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 24,
              padding: "16px 20px",
              background: "var(--atelier-surface)",
              border: "1px solid var(--atelier-hairline)",
              borderRadius: "var(--radius-sm)",
            }}>
              <div style={{ fontSize: 12, color: "var(--atelier-text-muted)", fontFamily: "var(--font-mono)" }}>
                Showing {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ minWidth: 36, padding: "0 10px" }}
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span style={{ color: "var(--atelier-text-muted)", fontSize: 12, padding: "0 4px" }}>…</span>
                      )}
                      <button
                        className={`btn btn-sm ${p === safeCurrentPage ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setCurrentPage(p)}
                        style={{ minWidth: 36, padding: "0 10px" }}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))
                }

                <button
                  className="btn btn-secondary btn-sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ minWidth: 36, padding: "0 10px" }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Log Purchase Modal */}
      {logTarget && (
        <LogPurchaseModal
          session={logTarget}
          onClose={() => setLogTarget(null)}
          onSaved={() => { setLogTarget(null); loadSessions(); }}
        />
      )}

      {/* Dismiss Session Modal */}
      {dismissTarget && (
        <DismissModal
          session={dismissTarget}
          onClose={() => setDismissTarget(null)}
          onDismissed={() => { refreshDismissed(); }}
        />
      )}
    </div>
  );
}
