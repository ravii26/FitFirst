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
      <div className="page-header">
        <h1 className="page-title">Baseline Sales Log</h1>
        <p className="page-subtitle">
          Phase 0 — log daily sales figures before and during the kiosk pilot to enable fair before/after comparison.
        </p>
      </div>

      {/* Instructions */}
      <div className="card mb-xl" style={{ borderColor: "var(--brass-border)", background: "var(--brass-dim)" }}>
        <div className="flex-center gap-sm" style={{ marginBottom: 8 }}>
          <strong style={{ color: "var(--brass-bright)", fontFamily: "var(--font-mono)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>How to use this log</strong>
        </div>
        <ul style={{ color: "var(--stone)", fontSize: 13, paddingLeft: 20, lineHeight: 2 }}>
          <li>Log <strong>every day</strong> — both pre-kiosk baseline days and kiosk-active days.</li>
          <li>For baseline days (before kiosk launches), leave <em>Kiosk Active</em> unchecked.</li>
          <li>Once the kiosk is live, check <em>Kiosk Active</em> for each day.</li>
          <li>Aim for at least <strong>14 baseline days</strong> before going live for a fair comparison.</li>
          <li>Total Revenue = gross sales in INR for that day (before returns/discounts if easier).</li>
        </ul>
      </div>

      {status === "success" && (
        <div className="alert alert-success mb-lg">✓ {message}</div>
      )}
      {status === "error" && (
        <div className="alert alert-error mb-lg">✗ {message}</div>
      )}

      <div className="card">
        <div className="card-title">Add Daily Entry</div>
        <form id="baseline-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="baseline-date">Date</label>
              <input
                id="baseline-date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="baseline-transactions">Total Transactions (customers)</label>
              <input
                id="baseline-transactions"
                name="totalTransactions"
                type="number"
                min="1"
                placeholder="e.g. 24"
                value={form.totalTransactions}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="baseline-revenue">Total Revenue (₹)</label>
              <input
                id="baseline-revenue"
                name="totalRevenue"
                type="number"
                min="1"
                placeholder="e.g. 64000"
                value={form.totalRevenue}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="baseline-units">Avg Units per Customer</label>
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
              />
            </div>
          </div>

          {computedBasket && (
            <div style={{ margin: "12px 0", padding: "12px 16px", background: "var(--accent-dim)", borderRadius: "var(--radius-md)", display: "inline-flex", gap: 12, alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Computed Avg Basket Value:</span>
              <strong style={{ color: "var(--accent)", fontSize: 18, fontFamily: "var(--font-display)" }}>₹{parseInt(computedBasket).toLocaleString("en-IN")}</strong>
            </div>
          )}

          <div className="form-group" style={{ marginTop: 16 }}>
            <label htmlFor="baseline-notes">Notes (optional)</label>
            <textarea
              id="baseline-notes"
              name="notes"
              rows={2}
              placeholder="e.g. Diwali weekend, higher footfall; or staff shortage, slower day"
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
              <input
                id="baseline-kiosk-active"
                type="checkbox"
                name="isKioskActive"
                checked={form.isKioskActive}
                onChange={handleChange}
                style={{ width: 16, height: 16 }}
              />
              Kiosk was active on this day
            </label>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              (Check this once the kiosk is live — affects before/after comparison)
            </span>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              id="baseline-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>

      {/* Kill Threshold reminder */}
      <div className="card" style={{ marginTop: 24, borderColor: "rgba(196, 130, 60, 0.35)", background: "var(--warning-dim)" }}>
        <div className="flex-center gap-sm" style={{ marginBottom: 8 }}>
          <strong style={{ color: "var(--warning)", fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Kill Threshold — Set Before Pilot Starts</strong>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7 }}>
          The current kill threshold (15% basket lift, 30% conversion rate, 40% usage rate) was pre-seeded.
          Review and confirm it with the store owner <strong>before</strong> the kiosk goes live.
          Once agreed, treat it as immutable — don't adjust it after seeing the pilot data.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
          To update the threshold, use the API: <span className="monospace">POST /api/baseline/kill-threshold</span> (or ask your developer to update the seed).
        </p>
      </div>
    </div>
  );
}
