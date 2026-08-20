import React, { useEffect, useState } from "react";
import { format } from "date-fns";

const API = "/api";

interface Session {
  id: string;
  skinToneBucket: string;
  bodyShapeBucket: string;
  gender: string;
  sizeInput: string;
  preferenceTags: string[];
  createdAt: string;
  recommendations: { rank: number; score: number; productId: string }[];
  purchaseEvents: { wasRecommended: boolean; amount: number }[];
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/sessions`)
      .then((r) => r.json())
      .then((data) => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const genderBadge: Record<string, string> = {
    MEN: "badge-blue", WOMEN: "badge-amber", KIDS: "badge-green", UNISEX: "badge-gray",
  };

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Session Log</h1>
        <p className="page-subtitle">
          {sessions.length} kiosk sessions · All customer interactions and outcomes
        </p>
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
                <th>Time</th>
                <th>Session ID</th>
                <th>Gender</th>
                <th>Size</th>
                <th>Skin Tone</th>
                <th>Body Shape</th>
                <th>Preferences</th>
                <th>Recs</th>
                <th>Purchased</th>
                <th>Revenue</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
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
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {format(new Date(s.createdAt), "dd MMM, HH:mm")}
                      </td>
                      <td className="monospace" style={{ fontSize: 11 }}>{s.id.slice(0, 8)}…</td>
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
                    </tr>
                    {expanded === s.id && (
                      <tr id={`session-expanded-${s.id}`} style={{ background: "rgba(255,255,255,0.02)" }}>
                        <td colSpan={11} style={{ padding: "16px 24px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>
                            Session Recommendations & Details ({s.recommendations.length} items recommended)
                          </div>
                          {s.recommendations.length > 0 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                              {s.recommendations.map((r) => (
                                <div
                                  key={r.productId}
                                  style={{
                                    padding: "10px 14px",
                                    background: "rgba(255,255,255,0.04)",
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>
                                    RANK #{r.rank} · SCORE {(r.score * 100).toFixed(0)}%
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: "#fff" }}>
                                    Product ID: <span className="monospace" style={{ fontSize: 11 }}>{r.productId.slice(0, 12)}…</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No recommendations recorded for this session yet.</span>
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

      {sessions.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
          Click any row to expand session details · Showing most recent {sessions.length} sessions
        </p>
      )}
    </div>
  );
}
