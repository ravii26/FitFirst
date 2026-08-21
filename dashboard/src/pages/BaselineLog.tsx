import { useState } from "react";
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

const today = new Date().toISOString().split("T")[0];

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

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Daily Showroom Sales Ledger</h1>
        <p className="page-subtitle">
          Phase 0 pre-pilot benchmarks &bull; Record daily floor figures for attribution comparison
        </p>
      </div>

      {/* Pilot Benchmark Status Ribbon */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 28,
      }}>
        <div style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-hairline)", borderRadius: "var(--radius-md)", padding: "16px 20px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Benchmark Target
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--atelier-text-title)", fontWeight: 500 }}>
            14 Consecutive Days
          </div>
          <div style={{ fontSize: 12, color: "var(--atelier-text-muted)", marginTop: 2 }}>
            Pre-kiosk baseline for reliable comparative variance
          </div>
        </div>

        <div style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-hairline)", borderRadius: "var(--radius-md)", padding: "16px 20px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Basket Value Target
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--atelier-sage)", fontWeight: 500 }}>
            +15% Minimum Lift
          </div>
          <div style={{ fontSize: 12, color: "var(--atelier-text-muted)", marginTop: 2 }}>
            Pre-set pilot success threshold
          </div>
        </div>

        <div style={{ background: "var(--atelier-surface)", border: "1px solid var(--atelier-hairline)", borderRadius: "var(--radius-md)", padding: "16px 20px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--atelier-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Logging Mode
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--atelier-brass-light)", fontWeight: 500 }}>
            {form.isKioskActive ? "Kiosk Pilot Active" : "Pre-Pilot Baseline"}
          </div>
          <div style={{ fontSize: 12, color: "var(--atelier-text-muted)", marginTop: 2 }}>
            Selected for today's entry
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
        borderRadius: "var(--radius-lg)",
        padding: "28px 32px",
      }}>
        <div style={{ borderBottom: "1px solid var(--atelier-hairline)", paddingBottom: 16, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--atelier-text-title)", fontWeight: 500, marginBottom: 4 }}>
            Record Daily Store Figures
          </h3>
          <p style={{ fontSize: 13, color: "var(--atelier-text-muted)" }}>
            Enter the gross sales totals for the day to calibrate before/after pilot analytics.
          </p>
        </div>

        <form id="baseline-form" onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="baseline-date" style={{ color: "var(--atelier-text-title)", fontSize: 12 }}>
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
              <label htmlFor="baseline-transactions" style={{ color: "var(--atelier-text-title)", fontSize: 12 }}>
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
              <label htmlFor="baseline-revenue" style={{ color: "var(--atelier-text-title)", fontSize: 12 }}>
                Gross Store Revenue (₹ INR)
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
              <label htmlFor="baseline-units" style={{ color: "var(--atelier-text-title)", fontSize: 12 }}>
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
              margin: "16px 0 24px",
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

          <div className="form-group" style={{ marginTop: 16, marginBottom: 20 }}>
            <label htmlFor="baseline-notes" style={{ color: "var(--atelier-text-title)", fontSize: 12 }}>
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
            marginBottom: 28,
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
              style={{ width: 18, height: 18, accentColor: "var(--atelier-brass)" }}
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

          <div>
            <button
              id="baseline-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={status === "saving"}
              style={{ minHeight: 48, padding: "0 36px", fontSize: 14 }}
            >
              {status === "saving" ? "Recording Entry…" : "Record Ledger Entry →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
