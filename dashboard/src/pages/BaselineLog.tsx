import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

const API = "/api";

interface FormData {
  date: string;
  totalTransactions: string;
  totalRevenue: string;
  avgUnitsPerCustomer: string;
  isKioskActive: boolean;
  notes: string;
}

interface BaselineEntry {
  date: string;
  totalTransactions: number;
  totalRevenue: number;
  avgUnitsPerCustomer: number;
  isKioskActive: boolean;
  notes?: string;
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export default function BaselineLog() {
  const [form, setForm] = useState<FormData>({
    date: today,
    totalTransactions: "",
    totalRevenue: "",
    avgUnitsPerCustomer: "",
    isKioskActive: false,
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [recentEntries, setRecentEntries] = useState<BaselineEntry[]>([]);

  // Fetch recent entries on mount
  useEffect(() => {
    apiFetch(`${API}/baseline`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const entries = Array.isArray(data) ? data : [];
        setRecentEntries(entries.slice(-5).reverse());
      })
      .catch(() => {});
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const computedBasket =
    form.totalRevenue && form.totalTransactions
      ? (parseInt(form.totalRevenue) / parseInt(form.totalTransactions)).toFixed(0)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const res = await apiFetch(`${API}/baseline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          totalTransactions: parseInt(form.totalTransactions),
          totalRevenue: parseInt(form.totalRevenue),
          avgUnitsPerCustomer: parseFloat(form.avgUnitsPerCustomer),
          isKioskActive: form.isKioskActive,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error saving entry");
      }

      setStatus("success");
      setMessage(`Entry saved for ${form.date}`);
      setForm((prev) => ({
        ...prev,
        date: today,
        totalTransactions: "",
        totalRevenue: "",
        avgUnitsPerCustomer: "",
        notes: "",
      }));
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message ?? "Failed to save. Check backend.");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch { return dateStr; }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Daily Showroom Sales Ledger</h1>
        <p className="page-subtitle">
          Phase 0 pre-pilot benchmarks &bull; Record daily floor figures for attribution comparison
        </p>
      </div>

      {/* Asymmetric Hero Metric + Supporting Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 16,
        marginBottom: 28,
      }}>
        {/* Hero Metric — Benchmark Target */}
        <div style={{
          background: "var(--atelier-surface)",
          border: "1px solid var(--atelier-hairline)",
          borderRadius: "var(--radius-md)",
          padding: "28px 32px",
          borderLeft: "3px solid var(--atelier-text-title)",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Pilot Benchmark Target
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--atelier-text-title)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
            14 Consecutive Days
          </div>
          <div style={{ fontSize: 13, color: "var(--atelier-text-body)", lineHeight: 1.5 }}>
            Collect at least 14 days of pre-kiosk baseline sales data for a statistically reliable before/after comparison.
          </div>
        </div>

        {/* Stacked Supporting Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            background: "var(--atelier-surface)",
            border: "1px solid var(--atelier-hairline)",
            borderRadius: "var(--radius-md)",
            padding: "18px 22px",
            flex: 1,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              Success Threshold
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--atelier-sage)", fontWeight: 500 }}>
              +15% Basket Lift
            </div>
          </div>
          <div style={{
            background: "var(--atelier-surface)",
            border: "1px solid var(--atelier-hairline)",
            borderRadius: "var(--radius-md)",
            padding: "18px 22px",
            flex: 1,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              Logging Mode
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--atelier-brass-light)", fontWeight: 500 }}>
              {form.isKioskActive ? "Kiosk Pilot Active" : "Pre-Pilot Baseline"}
            </div>
          </div>
        </div>
      </div>

      {status === "success" && (
        <div className="alert alert-success mb-lg">✓ {message}</div>
      )}
      {status === "error" && (
        <div className="alert alert-error mb-lg">✗ {message}</div>
      )}

      {/* Main Ledger Form */}
      <div style={{
        background: "var(--atelier-surface)",
        border: "1px solid var(--atelier-hairline)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}>
        {/* Form Header with accent rule */}
        <div style={{
          borderBottom: "1px solid var(--atelier-hairline)",
          padding: "22px 32px",
          display: "flex",
          alignItems: "baseline",
          gap: 14,
        }}>
          <div style={{ width: 3, height: 20, background: "var(--atelier-text-title)", borderRadius: 1, flexShrink: 0, alignSelf: "center" }} />
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--atelier-text-title)", fontWeight: 500, marginBottom: 2 }}>
              Record Daily Store Figures
            </h3>
            <p style={{ fontSize: 13, color: "var(--atelier-text-muted)" }}>
              Enter the gross sales totals for the day to calibrate before/after pilot analytics.
            </p>
          </div>
        </div>

        <form id="baseline-form" onSubmit={handleSubmit}>
          <div style={{ padding: "24px 32px" }}>
            {/* Step 01 — Date & Transactions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="baseline-date" style={{ color: "var(--atelier-text-title)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--atelier-text-muted)", letterSpacing: "0.06em" }}>01</span>
                  Ledger Date
                </label>
                <input
                  id="baseline-date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  style={{ background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="baseline-transactions" style={{ color: "var(--atelier-text-title)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--atelier-text-muted)", letterSpacing: "0.06em" }}>02</span>
                  Customer Transactions
                </label>
                <input
                  id="baseline-transactions"
                  name="totalTransactions"
                  type="number"
                  min="1"
                  placeholder="e.g. 24"
                  value={form.totalTransactions}
                  onChange={handleChange}
                  required
                  style={{ background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="baseline-revenue" style={{ color: "var(--atelier-text-title)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--atelier-text-muted)", letterSpacing: "0.06em" }}>03</span>
                  Gross Revenue (₹ INR)
                </label>
                <input
                  id="baseline-revenue"
                  name="totalRevenue"
                  type="number"
                  min="1"
                  placeholder="e.g. 64000"
                  value={form.totalRevenue}
                  onChange={handleChange}
                  required
                  style={{ background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="baseline-units" style={{ color: "var(--atelier-text-title)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--atelier-text-muted)", letterSpacing: "0.06em" }}>04</span>
                  Avg Units Per Shopper
                </label>
                <input
                  id="baseline-units"
                  name="avgUnitsPerCustomer"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 1.6"
                  value={form.avgUnitsPerCustomer}
                  onChange={handleChange}
                  required
                  style={{ background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}
                />
              </div>
            </div>

            {computedBasket && (
              <div style={{
                marginBottom: 24,
                padding: "14px 20px",
                background: "var(--atelier-surface-sub)",
                border: "1px solid var(--atelier-hairline)",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                gap: 16,
                alignItems: "center",
              }}>
                <span style={{ color: "var(--atelier-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
                  Calculated Basket Value:
                </span>
                <strong style={{ color: "var(--atelier-text-title)", fontSize: 20, fontFamily: "var(--font-serif)" }}>
                  ₹{parseInt(computedBasket).toLocaleString("en-IN")}
                </strong>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label htmlFor="baseline-notes" style={{ color: "var(--atelier-text-title)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--atelier-text-muted)", letterSpacing: "0.06em" }}>05</span>
                Showroom Context & Notes (Optional)
              </label>
              <textarea
                id="baseline-notes"
                name="notes"
                rows={2}
                placeholder="e.g. Festive promotion launch; higher footfall; or rainy evening, slower floor traffic"
                value={form.notes}
                onChange={handleChange}
                style={{ background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}
              />
            </div>

            {/* Kiosk Status Checkbox */}
            <div style={{
              padding: "16px 20px",
              background: "var(--atelier-surface-sub)",
              border: "1px solid var(--atelier-hairline)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}>
              <input
                id="baseline-kiosk-active"
                type="checkbox"
                name="isKioskActive"
                checked={form.isKioskActive}
                onChange={handleChange}
                style={{ width: 18, height: 18, accentColor: "var(--atelier-text-title)" }}
              />
              <div>
                <label htmlFor="baseline-kiosk-active" style={{ fontSize: 14, fontWeight: 600, color: "var(--atelier-text-title)", cursor: "pointer" }}>
                  Kiosk was actively used by customers on this day
                </label>
                <div style={{ fontSize: 12, color: "var(--atelier-text-muted)" }}>
                  Leave unchecked for pre-pilot baseline days; check once the in-store kiosk is live.
                </div>
              </div>
            </div>
          </div>

          {/* Checkout-style Full-Width Action Bar */}
          <div style={{
            borderTop: "1px solid var(--atelier-hairline)",
            padding: "18px 32px",
            background: "var(--atelier-surface-sub)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 12, color: "var(--atelier-text-muted)" }}>
              {computedBasket
                ? <>Basket: <strong style={{ color: "var(--atelier-text-title)" }}>₹{parseInt(computedBasket).toLocaleString("en-IN")}</strong> &bull; {form.isKioskActive ? "Kiosk Day" : "Baseline Day"}</>
                : "Fill in the fields above to record today's figures"
              }
            </div>
            <button
              id="baseline-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={status === "saving"}
              style={{ minHeight: 44, padding: "0 32px", fontSize: 13.5 }}
            >
              {status === "saving" ? "Recording…" : "Record Entry →"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Entries Timeline */}
      {recentEntries.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
            Recent Ledger Entries
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {recentEntries.map((entry, i) => (
              <div
                key={entry.date + i}
                style={{
                  flex: "0 0 180px",
                  background: "var(--atelier-surface)",
                  border: "1px solid var(--atelier-hairline)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px 18px",
                  borderLeft: entry.isKioskActive ? "3px solid var(--atelier-sage)" : "3px solid var(--atelier-hairline-pop)",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--atelier-text-muted)", marginBottom: 6 }}>
                  {formatDate(entry.date)}
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--atelier-text-title)", fontWeight: 500 }}>
                  ₹{entry.totalRevenue.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: 11, color: "var(--atelier-text-muted)", marginTop: 4 }}>
                  {entry.totalTransactions} txns &bull; {entry.avgUnitsPerCustomer} units/cust
                </div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: entry.isKioskActive ? "var(--atelier-sage)" : "var(--atelier-text-muted)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {entry.isKioskActive ? "Kiosk Active" : "Baseline"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
