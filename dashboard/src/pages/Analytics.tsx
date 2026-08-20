import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
);

const API = "/api";

interface Summary {
  sessions: { total: number; withPurchase: number };
  conversions: {
    totalPurchases: number;
    recommendedPurchases: number;
    recommendedPurchaseRate: number;
    totalRevenue: number;
    recommendedRevenue: number;
  };
  basketValue: {
    kioskPeriod: number;
    baseline: number;
    liftPct: number | null;
  };
  baseline: { avgUnitsPerCustomer: number; daysLogged: number };
  recommendations: { total: number };
  killThreshold: {
    minBasketValueLiftPct: number;
    minRecommendedPurchaseRate: number;
    minUsageRatePct: number;
    pilotWeeks: number;
  } | null;
  pilotVerdict: "PASSING" | "FAILING" | "INSUFFICIENT_DATA" | null;
}

interface ChartEntry {
  date: string;
  avgBasketValue: number;
  totalRevenue: number;
  totalTransactions: number;
  isKioskActive: boolean;
}

function fmtINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function fmtPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([
          fetch(`${API}/analytics/summary`).then((r) => r.json()),
          fetch(`${API}/analytics/baseline-chart`).then((r) => r.json()),
        ]);
        setSummary(s);
        setChartData(c);
      } catch (e) {
        setError("Could not load analytics. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!summary) return null;

  const { sessions, conversions, basketValue, killThreshold, pilotVerdict } = summary;

  // Pilot Verdict UI
  const verdictConfig = {
    PASSING: { cls: "passing", icon: "✅", title: "Pilot is PASSING", desc: `Basket value lift and conversion rate are both above kill-threshold targets.` },
    FAILING: { cls: "failing", icon: "❌", title: "Pilot is FAILING", desc: `One or more metrics are below kill-threshold. Review honestly before proceeding to Phase 2.` },
    INSUFFICIENT_DATA: { cls: "insufficient", icon: "⏳", title: "Collecting Data", desc: `Need at least 20 sessions to evaluate against the kill threshold.` },
  };
  const verdict = pilotVerdict ? verdictConfig[pilotVerdict] : null;

  // Chart config
  const chartLabels = chartData.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });

  const basketChart = {
    labels: chartLabels,
    datasets: [
      {
        label: "Avg Basket Value (₹)",
        data: chartData.map((d) => d.avgBasketValue),
        backgroundColor: chartData.map((d) =>
          d.isKioskActive ? "rgba(245,158,11,0.7)" : "rgba(148,163,184,0.3)"
        ),
        borderColor: chartData.map((d) =>
          d.isKioskActive ? "#f59e0b" : "#475569"
        ),
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  const revenueChart = {
    labels: chartLabels,
    datasets: [
      {
        label: "Daily Revenue (₹)",
        data: chartData.map((d) => d.totalRevenue),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: "index" as const, intersect: false } },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 11 } } },
      y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 11 } } },
    },
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Pilot Analytics</h1>
        <p className="page-subtitle">Phase 0 + Phase 1 comparison · {sessions.total} kiosk sessions recorded</p>
      </div>

      {/* Pilot Verdict */}
      {verdict && (
        <div className={`verdict-card ${verdict.cls}`} id="pilot-verdict-card">
          <div className="verdict-icon">{verdict.icon}</div>
          <div className="verdict-text">
            <h2>{verdict.title}</h2>
            <p>{verdict.desc}</p>
            {killThreshold && (
              <p style={{ marginTop: 8, fontSize: 12 }}>
                Targets: &nbsp;
                <strong>{killThreshold.minBasketValueLiftPct}%</strong> basket lift ·&nbsp;
                <strong>{(killThreshold.minRecommendedPurchaseRate * 100).toFixed(0)}%</strong> conversion ·&nbsp;
                <strong>{(killThreshold.minUsageRatePct * 100).toFixed(0)}%</strong> usage rate
              </p>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card" id="stat-sessions">
          <div className="stat-label">Kiosk Sessions</div>
          <div className="stat-value">{sessions.total}</div>
          <div className="stat-sub">Total customers who used the kiosk</div>
        </div>
        <div className="stat-card" id="stat-conversions">
          <div className="stat-label">Recommended Purchases</div>
          <div className="stat-value accent">{conversions.recommendedPurchases}</div>
          <div className="stat-sub">
            {(conversions.recommendedPurchaseRate * 100).toFixed(1)}% of sessions led to a recommended purchase
          </div>
          {killThreshold && (
            <div className={`stat-lift ${conversions.recommendedPurchaseRate >= killThreshold.minRecommendedPurchaseRate ? "up" : "down"}`}>
              Target: {(killThreshold.minRecommendedPurchaseRate * 100).toFixed(0)}%
            </div>
          )}
        </div>
        <div className="stat-card" id="stat-basket-kiosk">
          <div className="stat-label">Avg Basket (Kiosk Period)</div>
          <div className="stat-value">{fmtINR(basketValue.kioskPeriod)}</div>
          {basketValue.liftPct !== null && (
            <div className={`stat-lift ${basketValue.liftPct >= 0 ? "up" : "down"}`}>
              {fmtPct(basketValue.liftPct)} vs. baseline
            </div>
          )}
          {killThreshold && (
            <div className={`stat-lift ${(basketValue.liftPct ?? 0) >= killThreshold.minBasketValueLiftPct ? "up" : "down"}`}>
              Target: +{killThreshold.minBasketValueLiftPct}%
            </div>
          )}
        </div>
        <div className="stat-card" id="stat-basket-baseline">
          <div className="stat-label">Avg Basket (Baseline)</div>
          <div className="stat-value">{basketValue.baseline > 0 ? fmtINR(basketValue.baseline) : "—"}</div>
          <div className="stat-sub">{summary.baseline.daysLogged} pre-kiosk days logged</div>
        </div>
        <div className="stat-card" id="stat-revenue">
          <div className="stat-label">Total Recommended Revenue</div>
          <div className="stat-value success">{fmtINR(conversions.recommendedRevenue)}</div>
          <div className="stat-sub">Revenue from kiosk-recommended items</div>
        </div>
        <div className="stat-card" id="stat-total-recs">
          <div className="stat-label">Recommendations Made</div>
          <div className="stat-value">{summary.recommendations.total}</div>
          <div className="stat-sub">Total product recommendations served</div>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card" id="chart-basket">
            <div className="card-title">Avg Basket Value by Day</div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#f59e0b", borderRadius: 2, marginRight: 4 }}></span>Kiosk active &nbsp;
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#475569", borderRadius: 2, marginRight: 4 }}></span>Baseline
            </p>
            <div style={{ height: 200 }}>
              <Bar data={basketChart} options={chartOptions} />
            </div>
          </div>
          <div className="chart-card" id="chart-revenue">
            <div className="card-title">Daily Revenue Trend</div>
            <div style={{ height: 220 }}>
              <Line data={revenueChart} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {chartData.length === 0 && (
        <div className="card mb-xl">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No chart data yet</h3>
            <p>Log baseline sales data in the <strong>Baseline Log</strong> tab to see before/after charts here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
