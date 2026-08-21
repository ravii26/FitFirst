// Recommendations Screen — Curated Showroom Collection & Lookbook

import { useEffect, useState } from "react";
import type { KioskSession } from "../App";

const API = "/api";

const CATEGORY_IMAGES: Record<string, string> = {
  KURTA: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
  SAREE: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
  SALWAR_KAMEEZ: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&auto=format&fit=crop&q=80",
  LEHENGA: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
  SHERWANI: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
  SHIRT: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
  TROUSERS: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80",
  JEANS: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
  DRESS: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
  JACKET: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
  KIDS_KURTA: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
  KIDS_DRESS: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&auto=format&fit=crop&q=80",
  KIDS_SHIRT: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
};

const LOADING_STAGES = [
  "Analyzing silhouette & undertone",
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
  };
}

function imageFor(rec: RecommendedProduct) {
  return rec.product.imageUrl || CATEGORY_IMAGES[rec.product.category] || CATEGORY_IMAGES.KURTA;
}

export default function Recommendations({
  session,
  onSessionCreated,
  onDone,
  onReset,
}: {
  session: KioskSession;
  onSessionCreated: (id: string) => void;
  onDone: () => void;
  onReset: () => void;
}) {
  const [recs, setRecs] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStage((s) => (s + 1) % LOADING_STAGES.length);
    }, 750);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let sessionId = session.sessionId;

    async function run() {
      try {
        if (!sessionId) {
          const res = await fetch(`${API}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
          onSessionCreated(s.id);
        }

        const recRes = await fetch(`${API}/sessions/${sessionId}/recommendations`);
        if (!recRes.ok) throw new Error("Failed to fetch recommendations");
        const data = await recRes.json();
        setRecs(data.recommendations ?? []);
      } catch (e: any) {
        setError(e.message ?? "Could not load recommendations. Please speak with a store stylist.");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

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
          <button className="btn-kiosk btn-primary" onClick={onReset}>Restart Consultation</button>
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
            <button className="btn-kiosk btn-secondary" onClick={onReset}>
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

  const [topPick, ...rest] = recs;

  return (
    <div
      className="screen screen-scrollable"
      id="screen-recommendations"
      style={{ padding: "32px 48px", justifyContent: "flex-start", alignItems: "center" }}
    >
      <div style={{ width: "100%", maxWidth: 1040 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass)", marginBottom: 4 }}>
              Curated Lookbook &bull; Size {session.sizeInput}
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--paper)", fontWeight: 400, letterSpacing: "-0.01em" }}>
              In-Stock Showroom Recommendations
            </h2>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--stone-dim)" }}>
            {recs.length} Pieces Available on Floor Today
          </div>
        </div>

        {/* 2-Column Curated Lookbook */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 28, marginBottom: 28 }}>
          {/* Primary Top Pick */}
          <div
            id="rec-card-1"
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
              <img
                src={imageFor(topPick)}
                alt={topPick.product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
              />
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
                Primary Showroom Recommendation
              </div>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--paper)", fontWeight: 500 }}>
                    {topPick.product.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--brass-bright)", fontWeight: 600 }}>
                    &#8377;{topPick.product.price.toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", marginBottom: 14 }}>
                  SKU: {topPick.product.sku} &bull; Category: {topPick.product.category.replace(/_/g, " ")}
                </div>

                {topPick.reasons.length > 0 && (
                  <div style={{
                    background: "rgba(200, 155, 83, 0.08)",
                    borderLeft: "2px solid var(--brass)",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--paper-soft)",
                    lineHeight: 1.5,
                  }}>
                    {topPick.reasons[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Curated Pieces List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Alternative Floor Matches
            </div>

            {rest.map((rec) => (
              <div
                key={rec.product.id}
                id={`rec-card-${rec.rank}`}
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  display: "grid",
                  gridTemplateColumns: "auto 56px 1fr auto",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brass)", fontWeight: 600 }}>
                  #{rec.rank}
                </div>

                <div style={{ width: 56, height: 56, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--ink-3)" }}>
                  <img
                    src={imageFor(rec)}
                    alt={rec.product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLElement).style.visibility = "hidden"; }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--paper)", marginBottom: 2 }}>
                    {rec.product.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--stone-dim)" }}>
                    {rec.reasons[0] || `SKU ${rec.product.sku}`}
                  </div>
                </div>

                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--paper)" }}>
                  &#8377;{rec.product.price.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 12, color: "var(--stone-dim)" }}>
            Stylist will pull these exact pieces in Size {session.sizeInput} for fitting.
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
