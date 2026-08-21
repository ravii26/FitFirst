// Recommendations Screen — Luxury E-Commerce Presentation

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
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 56, height: 56,
            border: "3px solid var(--border-medium)",
            borderTopColor: "var(--gold-primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 24px",
          }} />
          <h2 className="h2" style={{ marginBottom: 12 }}>Scoring Store Inventory…</h2>
          <p className="subtitle">Matching color tones, fit cuts, and live availability.</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center" }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>Unable to Load Collection</h2>
          <p className="subtitle" style={{ marginBottom: 32 }}>{error}</p>
          <button className="btn-kiosk btn-primary" onClick={onReset}>Try Again</button>
        </div>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🔍</div>
          <h2 className="h2" style={{ marginBottom: 12 }}>No Exact Matches Right Now</h2>
          <p className="subtitle" style={{ marginBottom: 8 }}>
            We don't currently have items in your size and style in stock — but our stylist can help.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.7 }}>
            Try adjusting your size or style preferences, or speak with a store stylist who can show you available options.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-kiosk btn-primary" onClick={onReset}>
              Try Different Preferences
            </button>
            <button className="btn-kiosk btn-ghost" onClick={onDone}>
              Speak with a Stylist →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="screen screen-scrollable"
      id="screen-recommendations"
      style={{ paddingTop: 76, paddingBottom: 40, justifyContent: "flex-start" }}
    >
      <div style={{ textAlign: "center", marginBottom: 24, marginTop: 4 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 14px",
          borderRadius: 100,
          background: "var(--gold-dim)",
          border: "1px solid var(--gold-border)",
          fontSize: 11,
          color: "var(--gold-warm)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}>
          ✨ {recs.length} Precision Matches Found
        </div>
        <h2 className="h2" style={{ marginBottom: 6 }}>Your Curated Showroom Recommendations</h2>
        <p className="subtitle" style={{ fontSize: 15 }}>
          All items are in stock in size <strong>{session.sizeInput}</strong> on our floor today.
        </p>
      </div>

      {/* Product Cards Horizontal Scroll */}
      <div className="products-scroll">
        {recs.map((rec) => {
          const purchased = loggedPurchases.has(rec.product.id);
          const imgSrc = rec.product.imageUrl || CATEGORY_IMAGES[rec.product.category] || CATEGORY_IMAGES.KURTA;
          const matchPercentage = Math.round(rec.score * 100);

          return (
            <div
              key={rec.product.id}
              id={`rec-card-${rec.rank}`}
              className={`product-card ${rec.rank === 1 ? "top-pick" : ""}`}
            >
              <div className="product-image-wrap">
                <img
                  src={imgSrc}
                  alt={rec.product.name}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  background: "rgba(11, 13, 18, 0.85)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--gold-warm)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {matchPercentage}% Match
                </div>
              </div>

              <div className="product-body">
                <div className="product-rank-tag">
                  SELECTION #{rec.rank}
                </div>
                <div className="product-name">{rec.product.name}</div>
                <div className="product-price">
                  ₹{rec.product.price.toLocaleString("en-IN")}
                </div>

                {rec.reasons[0] && (
                  <div className="product-reason-pill">
                    ✓ {rec.reasons[0]}
                  </div>
                )}

                <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="product-sku">SKU: {rec.product.sku}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          id="recs-done-btn"
          className="btn-kiosk btn-primary"
          onClick={onDone}
          style={{ fontSize: 17, padding: "0 48px" }}
        >
          Complete & Get Stylist Handoff Code &rarr;
        </button>
      </div>
    </div>
  );
}
