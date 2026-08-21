import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const API = "/api";

const CATEGORIES = [
  "KURTA","SAREE","SALWAR_KAMEEZ","LEHENGA","SHERWANI","DHOTI","DUPATTA",
  "SHIRT","TROUSERS","JEANS","DRESS","SKIRT","JACKET",
  "KIDS_KURTA","KIDS_SHIRT","KIDS_TROUSERS","KIDS_DRESS","ACCESSORIES",
];

// ── Enum values must exactly match schema.prisma ──────────────────────────────
const COLOR_FAMILIES = [
  "WHITE", "CREAM_IVORY", "LIGHT_PASTELS", "WARM_EARTH",
  "BRIGHT_WARM", "BRIGHT_COOL", "DARK_NEUTRAL", "JEWEL_TONES", "MULTICOLOR",
];
const COLOR_FAMILY_LABELS: Record<string, string> = {
  WHITE:          "White",
  CREAM_IVORY:    "Cream / Ivory",
  LIGHT_PASTELS:  "Light Pastels (Pink, Mint, Lavender)",
  WARM_EARTH:     "Warm Earth (Beige, Camel, Rust)",
  BRIGHT_WARM:    "Bright Warm (Red, Orange, Gold, Yellow)",
  BRIGHT_COOL:    "Bright Cool (Royal Blue, Purple, Magenta)",
  DARK_NEUTRAL:   "Dark Neutral (Navy, Charcoal, Black)",
  JEWEL_TONES:    "Jewel Tones (Teal, Maroon, Burgundy, Mustard)",
  MULTICOLOR:     "Multicolor / Mixed",
};

const FIT_TYPES = [
  "SLIM", "REGULAR", "RELAXED_LOOSE", "FLARED_ANARKALI",
  "STRAIGHT_CUT", "A_LINE", "WRAPAROUND", "TAILORED_STRUCTURED",
];
const FIT_TYPE_LABELS: Record<string, string> = {
  SLIM:                "Slim Fit",
  REGULAR:             "Regular Fit",
  RELAXED_LOOSE:       "Relaxed / Loose",
  FLARED_ANARKALI:     "Flared / Anarkali",
  STRAIGHT_CUT:        "Straight Cut",
  A_LINE:              "A-Line",
  WRAPAROUND:          "Wraparound",
  TAILORED_STRUCTURED: "Tailored / Structured",
};

const PATTERNS = [
  "SOLID", "STRIPES", "CHECKS", "FLORAL", "GEOMETRIC",
  "PAISLEY", "EMBROIDERED", "BLOCK_PRINT", "ABSTRACT", "ANIMAL_PRINT",
];
const PATTERN_LABELS: Record<string, string> = {
  SOLID:        "Solid",
  STRIPES:      "Stripes",
  CHECKS:       "Checks / Plaid",
  FLORAL:       "Floral Print",
  GEOMETRIC:    "Geometric",
  PAISLEY:      "Paisley",
  EMBROIDERED:  "Embroidered / Zari",
  BLOCK_PRINT:  "Hand Block Print",
  ABSTRACT:     "Abstract",
  ANIMAL_PRINT: "Animal Print",
};

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const categoryLabel = (c: string) =>
  c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const genderBadge: Record<string, string> = {
  MEN: "badge-blue", WOMEN: "badge-amber", KIDS: "badge-green", UNISEX: "badge-gray",
};

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  gender: string;
  colorFamily: string;
  pattern: string;
  fitType: string;
  price: number;
  stockQty: number;
  daysInStock: number;
  imageUrl?: string;
  isActive: boolean;
  aiTagged?: boolean;
  aiEngine?: string | null;
  aiConfidence?: Record<string, number> | null;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Photo modal state
  const [photoProduct, setPhotoProduct] = useState<Product | null>(null);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Scan state
  const [scanningAI, setScanningAI] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<Record<string, number> | null>(null);
  const [aiEngine, setAiEngine] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  const handleAIScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningAI(true);
    setAiConfidence(null);
    setAiEngine(null);
    setScanMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1. Call AI scanner microservice via backend proxy
      const scanRes = await apiFetch(`${API}/scan-garment`, {
        method: "POST",
        body: formData,
      });

      if (!scanRes.ok) throw new Error("AI scan request failed");
      const scanData = await scanRes.json();

      if (scanData.aiServiceAvailable === false) {
        setScanMsg({
          type: "error",
          text: scanData.error ?? "AI scanner unavailable. Please select attributes manually.",
        });
      } else if (scanData.predictions) {
        const p = scanData.predictions;
        setNewProduct((prev) => ({
          ...prev,
          category: p.category.value,
          gender: p.gender.value,
          colorFamily: p.colorFamily.value,
          fitType: p.fitType.value,
          pattern: p.pattern.value,
        }));

        setAiConfidence({
          category: p.category.confidence,
          gender: p.gender.confidence,
          colorFamily: p.colorFamily.confidence,
          fitType: p.fitType.confidence,
          pattern: p.pattern.confidence,
        });
        setAiEngine(p.category.engine ?? null);

        if (p.category.engine === "heuristic") {
          setScanMsg({
            type: "warning",
            text: "Tagged using the fallback visual heuristic (CLIP model not loaded on the AI service) — please double-check these fields.",
          });
        }
      }

      // 2. Upload image to server for live display
      const uploadRes = await apiFetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        setNewProduct((prev) => ({ ...prev, imageUrl: uploadData.url }));
      }
    } catch (err) {
      setScanMsg({ type: "error", text: "AI scan failed. Please select attributes manually." });
    } finally {
      setScanningAI(false);
    }
  };

  // Add Product modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    category: "KURTA",
    gender: "WOMEN",
    colorFamily: "JEWEL_TONES",
    pattern: "EMBROIDERED",
    fitType: "REGULAR",
    sizeRange: "S, M, L, XL",
    price: 2499,
    stockQty: 10,
    imageUrl: "",
  });

  async function loadProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterGender) params.set("gender", filterGender);
      if (filterCategory) params.set("category", filterCategory);
      if (search) params.set("search", search);
      const res = await apiFetch(`${API}/products?${params}`);
      setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, [filterGender, filterCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const startEditStock = (p: Product) => {
    setEditingStock(p.id);
    setStockValue(p.stockQty);
  };

  const openPhotoModal = (p: Product) => {
    setPhotoProduct(p);
    setPhotoUrlInput(p.imageUrl || "");
  };

  const saveStock = async (id: string) => {
    setSavingStock(true);
    await apiFetch(`${API}/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty: stockValue }),
    });
    setSavingStock(false);
    setEditingStock(null);
    setSuccessId(id);
    setTimeout(() => setSuccessId(null), 2000);
    loadProducts();
  };

  const deactivate = async (id: string) => {
    if (!confirm("Mark this product as inactive? It won't appear in recommendations.")) return;
    await apiFetch(`${API}/products/${id}`, { method: "DELETE" });
    loadProducts();
  };

  // Upload Photo handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoProduct) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("File upload failed");
      const data = await res.json();
      setPhotoUrlInput(data.url);
      setUploadMsg({ type: "success", text: "Photo uploaded successfully!" });
    } catch (err: any) {
      setUploadMsg({ type: "error", text: err.message || "Failed to upload photo" });
    } finally {
      setUploading(false);
    }
  };

  const saveProductPhoto = async () => {
    if (!photoProduct) return;
    try {
      await apiFetch(`${API}/products/${photoProduct.id}/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photoUrlInput }),
      });
      setPhotoProduct(null);
      setPhotoUrlInput("");
      setUploadMsg(null);
      loadProducts();
    } catch (err) {
      alert("Failed to save product image.");
    }
  };

  // Create Product handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sizes = newProduct.sizeRange.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await apiFetch(`${API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          stockQty: Number(newProduct.stockQty),
          sizeRange: sizes,
          aiTagged: aiConfidence !== null,
          aiEngine: aiEngine ?? undefined,
          aiConfidence: aiConfidence ?? undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create product");
      }

      setShowAddModal(false);
      setAiConfidence(null);
      setAiEngine(null);
      setScanMsg(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = products.filter((p) =>
    search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const slowStockCount = products.filter((p) => p.daysInStock > 60 && p.isActive).length;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Showroom Catalog & Garment Inventory</h1>
          <p className="page-subtitle">
            {filtered.length} curated pieces &bull; Live inventory sync &bull; AI vision auto-tagging
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Add Showroom Piece
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="atelier-toolbar" style={{ background: "var(--atelier-surface)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--atelier-hairline)" }}>
        <form id="inventory-search-form" onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <input
              id="inv-search"
              type="text"
              placeholder="Search by piece title, color, or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}
            />
          </div>
          <div style={{ flex: "0 1 160px" }}>
            <select id="inv-gender" value={filterGender} onChange={(e) => setFilterGender(e.target.value)} style={{ background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}>
              <option value="">All Departments</option>
              <option value="MEN">Men's Collection</option>
              <option value="WOMEN">Women's Collection</option>
              <option value="KIDS">Junior Collection</option>
              <option value="UNISEX">Unisex / Universal</option>
            </select>
          </div>
          <div style={{ flex: "0 1 200px" }}>
            <select id="inv-category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ background: "var(--atelier-surface-sub)", borderColor: "var(--atelier-hairline)" }}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <button id="inv-search-btn" type="submit" className="btn btn-secondary btn-sm">Filter</button>
        </form>
      </div>

      {/* Slow-moving stock alert */}
      {slowStockCount > 0 && (
        <div style={{ padding: "12px 18px", borderRadius: "var(--radius-sm)", background: "var(--atelier-brass-ghost)", border: "1px solid var(--atelier-brass-line)", color: "var(--atelier-brass-light)", marginBottom: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
          <span>⏳</span>
          <span><strong>{slowStockCount} pieces</strong> have been in showroom inventory over 60 days. The recommendation engine automatically applies aging priority to surface them to matching shoppers.</span>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table id="inventory-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Photo</th>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Gender</th>
                <th>Color</th>
                <th>Fit</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Days In</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.4 }}>
                  <td>
                    <div
                      onClick={() => openPhotoModal(p)}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: "var(--bg-elevated)",
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title="Click to update photo"
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <CameraIcon />
                      )}
                    </div>
                  </td>
                  <td className="monospace">{p.sku}</td>
                  <td className="primary">{p.name}</td>
                  <td>{categoryLabel(p.category)}</td>
                  <td><span className={`badge ${genderBadge[p.gender] ?? "badge-gray"}`}>{p.gender}</span></td>
                  <td style={{ fontSize: 12 }}>{COLOR_FAMILY_LABELS[p.colorFamily] ?? p.colorFamily.replace(/_/g, " ")}</td>
                  <td style={{ fontSize: 12 }}>{FIT_TYPE_LABELS[p.fitType] ?? p.fitType.replace(/_/g, " ")}</td>
                  <td style={{ fontWeight: 600, color: "var(--accent)" }}>{"₹" + p.price.toLocaleString("en-IN")}</td>
                  <td>
                    {editingStock === p.id ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input
                          type="number"
                          min="0"
                          value={stockValue}
                          onChange={(e) => setStockValue(parseInt(e.target.value))}
                          style={{ width: 60, padding: "4px 8px", fontSize: 13 }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => saveStock(p.id)} disabled={savingStock}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingStock(null)}>Cancel</button>
                      </div>
                    ) : (
                      <span
                        style={{
                          color: p.stockQty === 0 ? "var(--danger)" : p.stockQty <= 3 ? "var(--warning)" : "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        {successId === p.id ? <span style={{ color: "var(--success)" }}>Saved</span> : p.stockQty}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      color: p.daysInStock > 60 ? "var(--warning)" : p.daysInStock > 30 ? "var(--text-primary)" : "var(--text-muted)",
                      fontWeight: p.daysInStock > 60 ? 600 : 400,
                    }}>
                      {p.daysInStock}d
                    </span>
                  </td>
                  <td>
                    {p.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-gray">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {p.isActive && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openPhotoModal(p)}
                        >
                          Photo
                        </button>
                      )}
                      {p.isActive && (
                        <button
                          id={`edit-stock-${p.sku}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => startEditStock(p)}
                        >
                          Stock
                        </button>
                      )}
                      {p.isActive && (
                        <button
                          id={`deactivate-${p.sku}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => deactivate(p.id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: 40, textAlign: "center" }}>
              <h3>No products found</h3>
              <p>Adjust your search filters or click "Add New SKU" above.</p>
            </div>
          )}
        </div>
      )}

      {/* Upload / Update Photo Modal */}
      {photoProduct && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 480, background: "var(--bg-card)", border: "1px solid var(--border-accent)" }}>
            <h3 style={{ fontSize: 18, fontFamily: "var(--font-display)", marginBottom: 8, color: "var(--text-primary)" }}>
              Upload Garment Photo — {photoProduct.name}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
              SKU: <span className="monospace">{photoProduct.sku}</span> &bull; Photos appear live in customer kiosk recommendations.
            </p>

            <div style={{
              width: "100%", height: 180, borderRadius: 12, background: "var(--bg-elevated)",
              border: "1px dashed var(--border)", marginBottom: 20, display: "flex",
              alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative"
            }}>
              {photoUrlInput ? (
                <img src={photoUrlInput} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <CameraIcon />
                  <div style={{ fontSize: 13, marginTop: 8 }}>No photo attached yet</div>
                </div>
              )}
            </div>

            {uploadMsg && (
              <div style={{
                padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 16,
                background: uploadMsg.type === "success" ? "var(--success-dim)" : "var(--danger-dim)",
                color: uploadMsg.type === "success" ? "var(--success)" : "var(--danger)"
              }}>
                {uploadMsg.text}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Option 1: Upload File from Device</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ padding: "8px" }}
              />
              {uploading && <span style={{ fontSize: 12, color: "var(--accent)" }}>Uploading file…</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Option 2: Paste Image Web URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => { setPhotoProduct(null); setUploadMsg(null); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveProductPhoto}>
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 640, background: "var(--bg-card)", border: "1px solid var(--border-accent)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 20, fontFamily: "var(--font-display)", marginBottom: 6, color: "var(--text-primary)" }}>
              Add New SKU to Inventory
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              New garments immediately enter the scoring pool for kiosk recommendations.
            </p>

            {/* AI Vision Scanner Banner */}
            <div style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--brass-dim)",
              border: "1px solid var(--brass-border)",
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <strong style={{ color: "var(--accent-light)", fontSize: 13, display: "block" }}>AI Garment Auto-Tagger</strong>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Upload photo to auto-classify category, color, fit & pattern
                  </span>
                </div>
                <label className="btn btn-primary btn-sm" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                  {scanningAI ? "Scanning AI…" : "Upload & Scan with AI"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAIScanFile}
                    disabled={scanningAI}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {aiConfidence && (
                <div style={{ fontSize: 11, color: "var(--success)", display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--line-strong)" }}>
                  <span>✓ Category ({(aiConfidence.category * 100).toFixed(0)}%)</span>
                  <span>✓ Color ({(aiConfidence.colorFamily * 100).toFixed(0)}%)</span>
                  <span>✓ Pattern ({(aiConfidence.pattern * 100).toFixed(0)}%)</span>
                  <span>✓ Fit ({(aiConfidence.fitType * 100).toFixed(0)}%)</span>
                  <span>✓ Gender ({(aiConfidence.gender * 100).toFixed(0)}%)</span>
                </div>
              )}

              {scanMsg && (
                <div style={{
                  fontSize: 11, marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--line-strong)",
                  color: scanMsg.type === "error" ? "var(--danger)" : scanMsg.type === "warning" ? "var(--accent-light)" : "var(--success)",
                }}>
                  {scanMsg.type === "error" ? "⚠ " : scanMsg.type === "warning" ? "ℹ " : "✓ "}{scanMsg.text}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label>SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. W-KRT-010"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Garment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Silk Anarkali Suit"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department / Gender</label>
                  <select
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
                  >
                    <option value="WOMEN">Women</option>
                    <option value="MEN">Men</option>
                    <option value="KIDS">Kids</option>
                    <option value="UNISEX">Unisex</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color Family</label>
                  <select
                    value={newProduct.colorFamily}
                    onChange={(e) => setNewProduct({ ...newProduct, colorFamily: e.target.value })}
                  >
                    {COLOR_FAMILIES.map((c) => <option key={c} value={c}>{COLOR_FAMILY_LABELS[c] ?? c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fit Type</label>
                  <select
                    value={newProduct.fitType}
                    onChange={(e) => setNewProduct({ ...newProduct, fitType: e.target.value })}
                  >
                    {FIT_TYPES.map((f) => <option key={f} value={f}>{FIT_TYPE_LABELS[f] ?? f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pattern / Work</label>
                  <select
                    value={newProduct.pattern}
                    onChange={(e) => setNewProduct({ ...newProduct, pattern: e.target.value })}
                  >
                    {PATTERNS.map((p) => <option key={p} value={p}>{PATTERN_LABELS[p] ?? p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Available Sizes (comma separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="S, M, L, XL"
                    value={newProduct.sizeRange}
                    onChange={(e) => setNewProduct({ ...newProduct, sizeRange: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Price (INR / {"₹"})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Initial Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProduct.stockQty}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQty: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
