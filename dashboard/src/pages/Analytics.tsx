import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { apiFetch } from "../lib/api";

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

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" />
  </svg>
);
const IconCross = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
  </svg>
);

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([
          apiFetch(`${API}/analytics/summary`).then((r) => r.json()),
          apiFetch(`${API}/analytics/baseline-chart`).then((r) => r.json()),
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
    PASSING: { cls: "passing", icon: <IconCheck />, title: "Pilot is PASSING", desc: `Basket value lift and conversion rate are both above kill-threshold targets.` },
    FAILING: { cls: "failing", icon: <IconCross />, title: "Pilot is FAILING", desc: `One or more metrics are below kill-threshold. Review honestly before proceeding to Phase 2.` },
    INSUFFICIENT_DATA: { cls: "insufficient", icon: <IconClock />, title: "Collecting Data", desc: `Need at least 20 sessions to evaluate against the kill threshold.` },
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
          d.isKioskActive ? "rgba(185, 138, 70, 0.75)" : "rgba(180, 168, 149, 0.2)"
        ),
        borderColor: chartData.map((d) =>
          d.isKioskActive ? "#B98A46" : "#7C7365"
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
        borderColor: "#6B7A54",
        backgroundColor: "rgba(107, 122, 84, 0.18)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#6B7A54",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: "index" as const, intersect: false } },
    scales: {
      x: { grid: { color: "rgba(245, 239, 226, 0.06)" }, ticks: { color: "#7C7365", font: { size: 11, family: "var(--font-mono)" } } },
      y: { grid: { color: "rgba(245, 239, 226, 0.06)" }, ticks: { color: "#7C7365", font: { size: 11, family: "var(--font-mono)" } } },
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

      {/* Executive Performance Ledger */}
      <div style={{
        background: "var(--atelier-surface)",
        border: "1px solid var(--atelier-hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
        marginBottom: 28,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--atelier-hairline)", paddingBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-brass)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Financial & Pilot Performance Matrix
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--atelier-text-title)" }}>
              Baseline Pre-Pilot vs. In-Store Kiosk Attribution
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--atelier-text-muted)" }}>
            {summary.baseline.daysLogged} Baseline Days Logged
          </div>
        </div>

        {/* Ledger Comparative Table */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          <div style={{ borderRight: "1px solid var(--atelier-hairline)", paddingRight: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Kiosk Consultations
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--atelier-text-title)", fontWeight: 500, lineHeight: 1 }}>
              {sessions.total}
            </div>
            <div style={{ fontSize: 12, color: "var(--atelier-text-muted)", marginTop: 6 }}>
              {summary.recommendations.total} floor pieces served
            </div>
          </div>

          <div style={{ borderRight: "1px solid var(--atelier-hairline)", paddingRight: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Attributed Purchases
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--atelier-brass-light)", fontWeight: 500, lineHeight: 1 }}>
              {conversions.recommendedPurchases}
            </div>
            <div style={{ fontSize: 12, color: "var(--atelier-sage)", marginTop: 6, fontWeight: 600 }}>
              {(conversions.recommendedPurchaseRate * 100).toFixed(1)}% Conversion Rate
            </div>
          </div>

          <div style={{ borderRight: "1px solid var(--atelier-hairline)", paddingRight: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Average Basket Value
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--atelier-text-title)", fontWeight: 500, lineHeight: 1 }}>
              {fmtINR(basketValue.kioskPeriod)}
            </div>
            <div style={{ fontSize: 12, color: (basketValue.liftPct ?? 0) >= 0 ? "var(--atelier-sage)" : "var(--atelier-terracotta)", marginTop: 6 }}>
              {basketValue.liftPct !== null ? `${fmtPct(basketValue.liftPct)} vs Baseline` : "Baseline: " + fmtINR(basketValue.baseline)}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Attributed Showroom Sales
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--atelier-sage)", fontWeight: 500, lineHeight: 1 }}>
              {fmtINR(conversions.recommendedRevenue)}
            </div>
            <div style={{ fontSize: 12, color: "var(--atelier-text-muted)", marginTop: 6 }}>
              Direct pilot sales recorded
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card" id="chart-basket" style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-hairline)", borderRadius: "var(--radius-lg)", padding: 24 }}>
            <div className="card-title" style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--atelier-text-title)", marginBottom: 4 }}>
              Average Daily Basket Value
            </div>
            <p style={{ fontSize: 11, color: "var(--atelier-text-muted)", marginBottom: 16 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#C89B53", borderRadius: 2, marginRight: 6 }}></span>Kiosk Pilot Days &nbsp;
              <span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(247, 243, 234, 0.15)", borderRadius: 2, marginRight: 6 }}></span>Baseline Days
            </p>
            <div style={{ height: 210 }}>
              <Bar data={basketChart} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card" id="chart-revenue" style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-hairline)", borderRadius: "var(--radius-lg)", padding: 24 }}>
            <div className="card-title" style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--atelier-text-title)", marginBottom: 4 }}>
              Daily Revenue Attribution
            </div>
            <p style={{ fontSize: 11, color: "var(--atelier-text-muted)", marginBottom: 16 }}>
              Recorded transactions from kiosk styling consultations
            </p>
            <div style={{ height: 210 }}>
              <Line data={revenueChart} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {chartData.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--atelier-text-muted)", fontSize: 14 }}>
            Log baseline days in the Baseline Log tab or record kiosk purchases to visualize trends.
          </p>
        </div>
      )}
    </div>
  );
}
