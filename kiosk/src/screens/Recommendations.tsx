// Recommendations Screen — Curated Showroom Collection & Lookbook

import { useEffect, useState } from "react";
import type { KioskSession } from "../App";

const API = "/api";

const LOADING_STAGES = [
  "Checking your selected preferences",
  "Filtering showroom floor inventory",
  "Curating tailored lookbook",
];

interface RecommendedProduct {
  rank: number;
  score: number;
  reasons: string[];
  product: {
    id: string;
    sku: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    stockQty: number;
    imageUrl?: string;
    sizeMatched?: string;
  };
}

function imageFor(rec: RecommendedProduct) {
  return rec.product.imageUrl || "";
}

export default function Recommendations({
  session,
  onSessionCreated,
  onDone,
  onReset,
  onEdit,
}: {
  session: KioskSession;
  onSessionCreated: (id: string) => void;
  onDone: () => void;
  onReset: () => void;
  onEdit: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [recs, setRecs] = useState<RecommendedProduct[]>([]);
  const [isSizeRelaxed, setIsSizeRelaxed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStage((s) => (s + 1) % LOADING_STAGES.length);
    }, 750);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let sessionId = session.sessionId;
    let active = true;
    setLoading(true);
    setError(null);

    async function run() {
      try {
        if (!sessionId) {
          const res = await fetch(`${API}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestKey: session.requestKey,
              skinToneBucket: session.skinToneBucket || "WHEATISH",
              bodyShapeBucket: session.bodyShapeBucket || "HOURGLASS",
              gender: session.gender || "WOMEN",
              sizeInput: session.sizeInput || "M",
              preferenceTags: session.preferenceTags,
            }),
          });
          if (!res.ok) throw new Error("Failed to initialize customer session");
          const s = await res.json();
          sessionId = s.id;
          if (!active) return;
          onSessionCreated(s.id);
        }

        const recRes = await fetch(`${API}/sessions/${sessionId}/recommendations`, { headers: { "x-kiosk-key": session.requestKey } });
        if (!recRes.ok) throw new Error("Failed to fetch recommendations");
        const data = await recRes.json();
        if (!active) return;
        setRecs(data.recommendations ?? []);
        setIsSizeRelaxed(data.isSizeRelaxed ?? false);
      } catch (e: any) {
        if (!active) return;
        setError(e.message ?? "Could not load recommendations. Please speak with a store stylist.");
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => { active = false; };
  }, [attempt]);

  if (loading) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "2px solid var(--line)",
              borderTopColor: "var(--brass-bright)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 24px",
            }}
          />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass)", marginBottom: 8 }}>
            Curating Collection
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--paper)", fontWeight: 400, marginBottom: 8 }}>
            {LOADING_STAGES[loadingStage]}&hellip;
          </h2>
          <p style={{ fontSize: 13, color: "var(--stone-dim)" }}>
            Cross-referencing floor inventory in Size {session.sizeInput || "Standard"}
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--paper)", marginBottom: 12 }}>
            Unable to Load Floor Collection
          </h2>
          <p style={{ color: "var(--stone)", marginBottom: 28, fontSize: 14 }}>{error}</p>
          <button className="btn-kiosk btn-primary" onClick={() => setAttempt(n => n + 1)}>Try again</button>
          <button className="btn-kiosk btn-ghost" onClick={onReset}>Start over</button>
        </div>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center", maxWidth: 520 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brass)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Floor Inventory Update
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--paper)", marginBottom: 12 }}>
            No Exact Matches in Size {session.sizeInput}
          </h2>
          <p style={{ fontSize: 14, color: "var(--stone)", marginBottom: 32, lineHeight: 1.6 }}>
            Our current showroom inventory has limited stock for this specific combination. Our floor stylists can check upcoming delivery racks or recommend alternative silhouettes.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-kiosk btn-secondary" onClick={onEdit}>
              Adjust Preferences
            </button>
            <button className="btn-kiosk btn-primary" onClick={onDone}>
              Get Stylist Handoff Code &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeRec = recs.find((r) => r.product.id === selectedRecId) || recs[0];
  const rest = recs.filter((r) => r.product.id !== activeRec.product.id);

  return (
    <div
      className="screen screen-scrollable"
      id="screen-recommendations"
      style={{ padding: "96px 48px 48px", justifyContent: "flex-start", alignItems: "center" }}
    >
      <div style={{ width: "100%", maxWidth: 1040 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: isSizeRelaxed ? "var(--rust)" : "var(--brass)", marginBottom: 4 }}>
              {isSizeRelaxed ? "✨ Nearby Size Matches Offered (Exact size depleted)" : `Curated Lookbook • Size ${session.sizeInput}`}
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--paper)", fontWeight: 400, letterSpacing: "-0.01em" }}>
              In-Stock Showroom Recommendations
            </h2>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--stone-dim)" }}>
            {recs.length} Pieces Available on Floor Today
          </div>
        </div>

        {isSizeRelaxed && (
          <div style={{
            background: "rgba(140, 109, 59, 0.06)",
            border: "1px solid var(--brass-border)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            marginBottom: 24,
            fontSize: 13.5,
            color: "var(--stone)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            lineHeight: 1.5,
            textAlign: "left"
          }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <span>
              We are currently out of exact matches in <strong>Size {session.sizeInput}</strong>. We have surfaced highly compatible fits in adjacent sizes (e.g. matching cuts in one size up or down) available in showroom stock today.
            </span>
          </div>
        )}

        {/* 2-Column Curated Lookbook */}
        <div style={{ display: "grid", gridTemplateColumns: rest.length > 0 ? "1.1fr 1fr" : "1fr", gap: 28, marginBottom: 28 }}>
          {/* Primary Active Pick */}
          <div
            id={`rec-card-${activeRec.rank}`}
            style={{
              background: "var(--ink-2)",
              border: "1px solid var(--brass-bright)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ height: 260, position: "relative", overflow: "hidden", background: "var(--ink-3)" }}>
              {!imageFor(activeRec) && <div style={{ padding: 40, textAlign: "center" }}>Product photo not yet available</div>}
              {imageFor(activeRec) && <img
                src={imageFor(activeRec)}
                alt={activeRec.product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.currentTarget.alt = "Product photo unavailable"; }}
              />}
              <div style={{
                position: "absolute",
                top: 14,
                left: 14,
                background: "rgba(14, 13, 11, 0.85)",
                backdropFilter: "blur(6px)",
                border: "1px solid var(--brass)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brass-bright)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                {activeRec.product.id === recs[0].product.id ? "Primary Showroom Recommendation" : `Selected Fit Match #${activeRec.rank}`}
              </div>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--paper)", fontWeight: 500 }}>
                    {activeRec.product.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--brass-bright)", fontWeight: 600 }}>
                    &#8377;{activeRec.product.price.toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", marginBottom: 14 }}>
                  SKU: {activeRec.product.sku} &bull; Category: {activeRec.product.category.replace(/_/g, " ")} &bull; Matched Size: {activeRec.product.sizeMatched || session.sizeInput}
                </div>

                {activeRec.reasons.length > 0 && (
                  <div style={{
                    background: "rgba(200, 155, 83, 0.08)",
                    borderLeft: "2px solid var(--brass)",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--paper-soft)",
                    lineHeight: 1.5,
                  }}>
                    {activeRec.reasons[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Curated Pieces List */}
          {rest.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Alternative Floor Matches (Click to inspect)
              </div>

              {rest.map((rec) => (
                <div
                  key={rec.product.id}
                  id={`rec-card-${rec.rank}`}
                  className="rec-alt-card"
                  onClick={() => setSelectedRecId(rec.product.id)}
                  style={{
                    background: "var(--ink-2)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                    display: "grid",
                    gridTemplateColumns: "auto 56px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brass)", fontWeight: 600 }}>
                    #{rec.rank}
                  </div>

                  <div style={{ width: 56, height: 56, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--ink-3)" }}>
                    {imageFor(rec) ? <img
                      src={imageFor(rec)}
                      alt={rec.product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.alt = "Photo unavailable"; }}
                    /> : <span style={{ fontSize: 10 }}>No photo</span>}
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--paper)", marginBottom: 2 }}>
                      {rec.product.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--stone-dim)" }}>
                      {rec.reasons[0] || `SKU ${rec.product.sku}`} &bull; Size {rec.product.sizeMatched || session.sizeInput}
                    </div>
                  </div>

                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--paper)" }}>
                    &#8377;{rec.product.price.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ marginBottom: 16, fontSize: 13 }}>These are the items saved for this visit. Staff will confirm current size availability before purchase.</p>
        <button className="btn-kiosk btn-ghost" onClick={onEdit}>Edit preferences</button>
        {/* Footer Action Bar */}
        <div style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 12, color: "var(--stone-dim)" }}>
            {isSizeRelaxed
              ? "Stylist will pull these adjacent sized pieces for fitting."
              : `Show your code to staff to check these pieces for fitting.`}
          </div>

          <button
            id="recs-done-btn"
            className="btn-kiosk btn-primary"
            onClick={onDone}
            style={{ fontSize: 16, padding: "0 40px", minHeight: 52 }}
          >
            Connect with Floor Stylist &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
