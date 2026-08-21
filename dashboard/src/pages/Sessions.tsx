import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "../lib/api";

const API = "/api";

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

// ── Main Sessions Page ───────────────────────────────────────────────────────

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "PURCHASED" | "PENDING">("ALL");
  const [logTarget, setLogTarget] = useState<Session | null>(null);

  const loadSessions = () => {
    setLoading(true);
    apiFetch(`${API}/sessions`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setSessions([]);
        setLoading(false);
      });
  };

  useEffect(() => { loadSessions(); }, []);

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const purchasedCount = safeSessions.filter((s) => (s.purchaseEvents || []).length > 0).length;
  const pendingCount = safeSessions.length - purchasedCount;

  // Filter pipeline
  const filtered = safeSessions.filter((s) => {
    const events = s.purchaseEvents || [];
    const hasPurchase = events.length > 0;
    if (filterMode === "PURCHASED" && !hasPurchase) return false;
    if (filterMode === "PENDING" && hasPurchase) return false;

    // Search query filter
    if (!search.trim()) return true;
    const q = search.trim().toUpperCase();
    return shortCode(s.id).includes(q) || s.id.toUpperCase().includes(q);
  });

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>;

  return (
    <div className="fade-in">
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
          <span className="atelier-search-icon">🔍</span>
          <input
            id="session-code-search"
            className="atelier-search-input"
            type="text"
            placeholder="Search by 6-char Handoff Code (e.g. AB12CD)…"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
          />
        </div>

        <div className="filter-chip-group">
          <button
            className={`filter-chip ${filterMode === "ALL" ? "active" : ""}`}
            onClick={() => setFilterMode("ALL")}
          >
            All Sessions ({safeSessions.length})
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
            Pending Action ({pendingCount})
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
        <div className="dossier-list">
          {filtered.map((s) => {
            const purchaseEvents = s.purchaseEvents || [];
            const totalRevenue = purchaseEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
            const recPurchases = purchaseEvents.filter((e) => e.wasRecommended);
            const hasPurchase = purchaseEvents.length > 0;
            const hasRecPurchase = recPurchases.length > 0;
            const recommendations = s.recommendations || [];

            return (
              <div
                key={s.id}
                id={`session-${s.id}`}
                className={`dossier-card ${hasPurchase ? "has-purchase" : "pending"}`}
              >
                {/* Dossier Top Bar */}
                <div className="dossier-topbar">
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div className="dossier-code-badge">
                      <span style={{ color: "var(--atelier-brass)" }}>#</span>
                      <span>{shortCode(s.id)}</span>
                    </div>
                    <span className="dossier-time">
                      {formatSessionDate(s.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {hasRecPurchase ? (
                      <span className="outcome-tag success">
                        ✓ Rec'd Piece Purchased (₹{totalRevenue.toLocaleString("en-IN")})
                      </span>
                    ) : hasPurchase ? (
                      <span className="outcome-tag success">
                        ✓ In-Store Purchase (₹{totalRevenue.toLocaleString("en-IN")})
                      </span>
                    ) : (
                      <span className="outcome-tag pending">
                        Pending Stylist Review
                      </span>
                    )}

                    <button
                      id={`log-purchase-${s.id}`}
                      className="btn btn-primary btn-sm"
                      onClick={() => setLogTarget(s)}
                    >
                      {hasPurchase ? "Update Sale" : "+ Log Purchase"}
                    </button>
                  </div>
                </div>

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
            );
          })}
        </div>
      )}

      {/* Log Purchase Modal */}
      {logTarget && (
        <LogPurchaseModal
          session={logTarget}
          onClose={() => setLogTarget(null)}
          onSaved={() => { setLogTarget(null); loadSessions(); }}
        />
      )}
    </div>
  );
}
