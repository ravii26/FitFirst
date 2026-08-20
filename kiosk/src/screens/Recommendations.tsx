// Recommendations Screen
// Creates session via API, fetches scored recommendations, displays product cards.

import { useEffect, useState } from "react";
import type { KioskSession } from "../App";

const API = "/api";

const CATEGORY_EMOJI: Record<string, string> = {
  KURTA: "🧣", SAREE: "🪭", SALWAR_KAMEEZ: "👘", LEHENGA: "💃",
  SHERWANI: "🎩", DHOTI: "🪔", DUPATTA: "🧶", SHIRT: "👔",
  TROUSERS: "👖", JEANS: "🧷", DRESS: "👗", SKIRT: "🌀",
  JACKET: "🧥", KIDS_KURTA: "🧣", KIDS_SHIRT: "👕",
  KIDS_TROUSERS: "👖", KIDS_DRESS: "👗", ACCESSORIES: "💍",
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
  const [loggedPurchases, setLoggedPurchases] = useState<Set<string>>(new Set());

  useEffect(() => {
    let sessionId = session.sessionId;

    async function run() {
      try {
        // Create session if not already created
        if (!sessionId) {
          const res = await fetch(`${API}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              skinToneBucket: session.skinToneBucket,
              bodyShapeBucket: session.bodyShapeBucket,
              gender: session.gender,
              sizeInput: session.sizeInput,
              preferenceTags: session.preferenceTags,
            }),
          });
          if (!res.ok) throw new Error("Failed to create session");
          const s = await res.json();
          sessionId = s.id;
          onSessionCreated(s.id);
        }

        // Fetch recommendations
        const recRes = await fetch(`${API}/sessions/${sessionId}/recommendations`);
        if (!recRes.ok) throw new Error("Failed to fetch recommendations");
        const data = await recRes.json();
        setRecs(data.recommendations ?? []);
      } catch (e: any) {
        setError(e.message ?? "Could not load recommendations. Please ask staff for help.");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  const logPurchase = async (productId: string, amount: number) => {
    if (!session.sessionId) return;
    await fetch(`${API}/purchase-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.sessionId,
        productId,
        wasRecommended: true,
        amount,
      }),
    });
    setLoggedPurchases((prev) => new Set([...prev, productId]));
  };

  if (loading) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 60, height: 60,
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 24px",
          }} />
          <h2 className="h2" style={{ marginBottom: 12 }}>Finding your matches…</h2>
          <p className="subtitle">Checking our stock for what suits you best.</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 className="h2" style={{ marginBottom: 12 }}>Something went wrong</h2>
          <p className="subtitle" style={{ marginBottom: 32 }}>{error}</p>
          <div style={{ display: "flex", gap: 16 }}>
            <button className="btn-kiosk btn-primary" onClick={onReset}>Start Over</button>
          </div>
        </div>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="screen" id="screen-recommendations">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 className="h2" style={{ marginBottom: 12 }}>No exact matches found</h2>
          <p className="subtitle" style={{ marginBottom: 32 }}>
            We might not have your exact size in stock right now. Please speak with a staff member — they'll check for you.
          </p>
          <button className="btn-kiosk btn-ghost" onClick={onReset}>Start Over</button>
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
      <div style={{ textAlign: "center", marginBottom: 28, marginTop: 8 }}>
        <h2 className="h2" style={{ marginBottom: 8 }}>
          {recs.length} picks matched for you ✨
        </h2>
        <p className="subtitle">
          These are all in your size and available in-store today.
        </p>
      </div>

      {/* Product Scroll */}
      <div className="products-scroll" style={{ width: "100%", padding: "0 40px" }}>
        {recs.map((rec) => {
          const purchased = loggedPurchases.has(rec.product.id);
          return (
            <div
              key={rec.product.id}
              id={`rec-card-${rec.rank}`}
              className={`product-card ${rec.rank === 1 ? "top-pick" : ""}`}
            >
              {/* Product image placeholder */}
              <div className="product-img-placeholder">
                {rec.product.imageUrl ? (
                  <img src={rec.product.imageUrl} alt={rec.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 64 }}>
                    {CATEGORY_EMOJI[rec.product.category] ?? "👕"}
                  </span>
                )}
              </div>

              <div className="product-body">
                {rec.rank === 1 && (
                  <div className="product-rank">⭐ Top Pick</div>
                )}
                {rec.rank > 1 && (
                  <div className="product-rank" style={{ color: "var(--text-muted)" }}>
                    #{rec.rank}
                  </div>
                )}
                <div className="product-name">{rec.product.name}</div>
                <div className="product-price">
                  ₹{rec.product.price.toLocaleString("en-IN")}
                </div>
                {rec.reasons[0] && (
                  <div className="product-reason">{rec.reasons[0]}</div>
                )}
                <div className="product-sku">SKU: {rec.product.sku}</div>

                {!purchased ? (
                  <button
                    className="btn-kiosk btn-ghost"
                    style={{
                      marginTop: 12, width: "100%", padding: "0 12px",
                      minHeight: 40, fontSize: 13, borderRadius: 10,
                    }}
                    onClick={() => logPurchase(rec.product.id, rec.product.price)}
                  >
                    Bought this ✓
                  </button>
                ) : (
                  <div style={{
                    marginTop: 12, textAlign: "center", padding: "8px",
                    background: "var(--success-dim)", borderRadius: 10,
                    fontSize: 13, color: "var(--success)", fontWeight: 600,
                  }}>
                    ✓ Recorded
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
          Ask a staff member to help you find these items on the rack.
        </p>
        <button
          id="recs-done-btn"
          className="btn-kiosk btn-primary"
          onClick={onDone}
        >
          Done — Get Staff Code →
        </button>
      </div>
    </div>
  );
}
