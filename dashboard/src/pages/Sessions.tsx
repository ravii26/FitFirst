import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "../lib/api";

const API = "/api";

interface RecommendationItem {
  rank: number;
  score: number;
  productId: string;
  product?: { name: string; sku: string; price: number };
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

// Derive the 6-char handoff code the same way StaffHandoff.tsx does
function shortCode(sessionId: string): string {
  return sessionId.slice(-6).toUpperCase();
}

const genderBadge: Record<string, string> = {
  MEN: "badge-blue", WOMEN: "badge-amber", KIDS: "badge-green", UNISEX: "badge-gray",
};

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

  // When product selection changes, auto-fill price from recommendations
  const handleProductChange = (pid: string) => {
    setSelectedProductId(pid);
    const match = session.recommendations.find((r) => r.productId === pid);
    if (match?.product?.price) setAmount(match.product.price.toString());
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%", maxWidth: 480, background: "var(--bg-card)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <h3 style={{ fontSize: 18, fontFamily: "var(--font-display)", marginBottom: 4, color: "var(--text-primary)" }}>
          Log Purchase — #{shortCode(session.id)}
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
          Record which item the customer actually purchased. This updates the pilot analytics.
        </p>

        {success ? (
          <div className="alert alert-success">✓ Purchase logged successfully!</div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label htmlFor="purchase-product">Item Purchased</label>
              {session.recommendations.length > 0 ? (
                <select
                  id="purchase-product"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  {session.recommendations.map((r) => (
                    <option key={r.productId} value={r.productId}>
                      #{r.rank} — {r.product?.name ?? r.productId.slice(0, 12) + "…"} {r.product?.sku ? `(${r.product.sku})` : ""}
                    </option>
                  ))}
                  <option value="__other__">Other item (not from recommendations)</option>
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

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label htmlFor="purchase-amount">Sale Amount (₹)</label>
              <input
                id="purchase-amount"
                type="number"
                min="1"
                required
                placeholder="e.g. 2499"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                {saving ? "Saving…" : "Log Purchase"}
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [logTarget, setLogTarget] = useState<Session | null>(null);

  const loadSessions = () => {
    setLoading(true);
    apiFetch(`${API}/sessions`)
      .then((r) => r.json())
      .then((data) => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadSessions(); }, []);

  // Filter by search — matches handoff code (last 6 chars) or partial session ID
  const filtered = sessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.trim().toUpperCase();
    return shortCode(s.id).includes(q) || s.id.toUpperCase().includes(q);
  });

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Session Log</h1>
        <p className="page-subtitle">
          {sessions.length} kiosk sessions · Find a session by the 6-char handoff code to log purchases
        </p>
      </div>

      {/* ── Search by Handoff Code ── */}
      <div className="card mb-xl" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="session-code-search" style={{ marginBottom: 6 }}>
              Find Session by Handoff Code
            </label>
            <input
              id="session-code-search"
              type="text"
              placeholder="Enter 6-char code (e.g. AB12CD) or partial session ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              style={{ fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.06em" }}
            />
          </div>
          {search && (
            <button
              className="btn btn-secondary"
              style={{ marginBottom: 0 }}
              onClick={() => setSearch("")}
            >
              Clear
            </button>
          )}
        </div>
        {search && filtered.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--danger)", marginTop: 10 }}>
            No session found for code "{search}". Check the code on the kiosk handoff screen.
          </p>
        )}
        {search && filtered.length > 0 && (
          <p style={{ fontSize: 12, color: "var(--success)", marginTop: 10 }}>
            ✓ {filtered.length} session{filtered.length > 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🧍</div>
            <h3>No sessions yet</h3>
            <p>Sessions will appear here once customers use the kiosk.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table id="sessions-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Time</th>
                <th>Gender</th>
                <th>Size</th>
                <th>Skin Tone</th>
                <th>Body Shape</th>
                <th>Preferences</th>
                <th>Recs</th>
                <th>Purchased</th>
                <th>Revenue</th>
                <th>Outcome</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const totalRevenue = s.purchaseEvents.reduce((sum, e) => sum + e.amount, 0);
                const recPurchases = s.purchaseEvents.filter((e) => e.wasRecommended);
                const hasPurchase = s.purchaseEvents.length > 0;
                const hasRecPurchase = recPurchases.length > 0;

                return (
                  <React.Fragment key={s.id}>
                    <tr
                      id={`session-${s.id}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    >
                      {/* Handoff Code — what staff actually use */}
                      <td>
                        <span
                          className="monospace"
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--accent)",
                            letterSpacing: "0.08em",
                            background: "var(--accent-dim)",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {shortCode(s.id)}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {format(new Date(s.createdAt), "dd MMM, HH:mm")}
                      </td>
                      <td><span className={`badge ${genderBadge[s.gender] ?? "badge-gray"}`}>{s.gender}</span></td>
                      <td>{s.sizeInput}</td>
                      <td style={{ fontSize: 12 }}>{s.skinToneBucket.replace(/_/g, " ")}</td>
                      <td style={{ fontSize: 12 }}>{s.bodyShapeBucket.replace(/_/g, " ")}</td>
                      <td style={{ fontSize: 11 }}>
                        {s.preferenceTags.length > 0
                          ? s.preferenceTags.slice(0, 2).join(", ") + (s.preferenceTags.length > 2 ? ` +${s.preferenceTags.length - 2}` : "")
                          : <span className="text-muted">—</span>
                        }
                      </td>
                      <td>{s.recommendations.length}</td>
                      <td>{s.purchaseEvents.length}</td>
                      <td>{totalRevenue > 0 ? `₹${totalRevenue.toLocaleString("en-IN")}` : <span className="text-muted">—</span>}</td>
                      <td>
                        {hasRecPurchase ? (
                          <span className="badge badge-green">✓ Rec'd</span>
                        ) : hasPurchase ? (
                          <span className="badge badge-blue">Purchased</span>
                        ) : (
                          <span className="badge badge-gray">No sale</span>
                        )}
                      </td>
                      {/* Log Purchase button — stops row click propagation */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`log-purchase-${s.id}`}
                          className="btn btn-primary btn-sm"
                          onClick={() => setLogTarget(s)}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          + Log Sale
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expanded === s.id && (
                      <tr id={`session-expanded-${s.id}`} style={{ background: "rgba(255,255,255,0.02)" }}>
                        <td colSpan={12} style={{ padding: "16px 24px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>
                            Recommendations shown ({s.recommendations.length} items) · Session {shortCode(s.id)}
                          </div>
                          {s.recommendations.length > 0 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                              {s.recommendations.map((r) => {
                                const wasBought = s.purchaseEvents.some((e) => e.productId === r.productId);
                                return (
                                  <div
                                    key={r.productId}
                                    style={{
                                      padding: "10px 14px",
                                      background: wasBought ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
                                      borderRadius: 8,
                                      border: wasBought ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)",
                                    }}
                                  >
                                    <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>
                                      RANK #{r.rank} · {(r.score * 100).toFixed(0)}% match
                                      {wasBought && <span style={{ color: "var(--success)", marginLeft: 8 }}>✓ Purchased</span>}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: "#fff" }}>
                                      {r.product?.name ?? "Unknown Product"}
                                    </div>
                                    {r.product?.sku && (
                                      <div className="monospace" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                        SKU: {r.product.sku}
                                      </div>
                                    )}
                                    {r.product?.price && (
                                      <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4, fontWeight: 600 }}>
                                        ₹{r.product.price.toLocaleString("en-IN")}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No recommendations recorded for this session.</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
          Click any row to see recommendations · Use "+ Log Sale" to record a purchase
        </p>
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
