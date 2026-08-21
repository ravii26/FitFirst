// Recommendations Screen — Hero Pick + Ranked List

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

const LOADING_STAGES = ["Reading your profile", "Matching store inventory", "Ranking by fit"];

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
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              border: "3px solid var(--line-strong)",
              borderTopColor: "var(--brass)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 24px",
            }}
          />
          <h2 className="h2" style={{ marginBottom: 12 }}>
            {LOADING_STAGES[loadingStage]}&hellip;
          </h2>
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
          <h2 className="h2" style={{ marginBottom: 12 }}>No Exact Matches Right Now</h2>
          <p className="subtitle" style={{ marginBottom: 8 }}>
            We don't currently have items in your size and style in stock — but our stylist can help.
          </p>
          <p style={{ fontSize: 13, color: "var(--stone-dim)", marginBottom: 32, lineHeight: 1.7 }}>
            Try adjusting your size or style preferences, or speak with a store stylist who can show you available options.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-kiosk btn-primary" onClick={onReset}>
              Try Different Preferences
            </button>
            <button className="btn-kiosk btn-ghost" onClick={onDone}>
              Speak with a Stylist &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [topPick, ...rest] = recs;
  const topMatch = Math.round(topPick.score * 100);

  return (
    <div
      className="screen screen-scrollable"
      id="screen-recommendations"
      style={{ paddingTop: 76, paddingBottom: 40, justifyContent: "flex-start", alignItems: "center" }}
    >
      <div className="recs-header">
        <div>
          <div className="recs-eyebrow">Your Matches</div>
          <div className="recs-title">Chosen from today's floor</div>
        </div>
        <div className="recs-count">
          {recs.length} piece{recs.length === 1 ? "" : "s"} &middot; size {session.sizeInput}
        </div>
      </div>

      <div className="recs-grid">
        {/* Hero pick */}
        <div className="hero-card" id="rec-card-1">
          <div className="hero-image">
            <img
              src={imageFor(topPick)}
              alt={topPick.product.name}
              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
            />
            <div className="hero-match-badge">{topMatch}% match</div>
          </div>
          <div className="hero-body">
            <div className="hero-rank">Top pick</div>
            <div className="hero-name">{topPick.product.name}</div>
            {topPick.reasons[0] && <div className="hero-why">{topPick.reasons[0]}</div>}
            <div className="hero-price">&#8377;{topPick.product.price.toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Ranked list */}
        <div className="rec-list">
          {rest.map((rec) => (
            <div className="rec-row" key={rec.product.id} id={`rec-card-${rec.rank}`}>
              <div className="rec-row-n">{String(rec.rank).padStart(2, "0")}</div>
              <img
                className="rec-row-thumb"
                src={imageFor(rec)}
                alt={rec.product.name}
                onError={(e) => { (e.target as HTMLElement).style.visibility = "hidden"; }}
              />
              <div>
                <div className="rec-row-name">{rec.product.name}</div>
                <div className="rec-row-reason">{rec.reasons[0] || `SKU ${rec.product.sku}`}</div>
              </div>
              <div className="rec-row-price">&#8377;{rec.product.price.toLocaleString("en-IN")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ marginTop: 28, textAlign: "center" }}>
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
