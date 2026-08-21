import React, { useEffect, useState } from "react";

const API = "/api";

const CATEGORIES = [
  "KURTA","SAREE","SALWAR_KAMEEZ","LEHENGA","SHERWANI","DHOTI","DUPATTA",
  "SHIRT","TROUSERS","JEANS","DRESS","SKIRT","JACKET",
  "KIDS_KURTA","KIDS_SHIRT","KIDS_TROUSERS","KIDS_DRESS","ACCESSORIES",
];

const COLOR_FAMILIES = ["RED", "BLUE", "GREEN", "YELLOW", "PINK", "PURPLE", "BLACK", "WHITE", "GOLD", "SILVER", "BEIGE", "MAROON", "TEAL", "NAVY", "CORAL"];
const FIT_TYPES = ["REGULAR", "SLIM", "TAILORED", "RELAXED", "LOOSE", "OVERSIZED"];
const PATTERNS = ["SOLID", "PRINTED", "STRIPED", "CHECKS", "EMBROIDERED", "FLORAL", "PAISLEY", "BLOCK_PRINT"];

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

  // Add Product modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    category: "KURTA",
    gender: "WOMEN",
    colorFamily: "RED",
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
      const res = await fetch(`${API}/products?${params}`);
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
    await fetch(`${API}/products/${id}/stock`, {
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
    await fetch(`${API}/products/${id}`, { method: "DELETE" });
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

      const res = await fetch(`${API}/upload`, {
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
      await fetch(`${API}/products/${photoProduct.id}/image`, {
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
      const res = await fetch(`${API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          stockQty: Number(newProduct.stockQty),
          sizeRange: sizes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create product");
      }

      setShowAddModal(false);
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
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Inventory & Garment Media</h1>
          <p className="page-subtitle">
            {filtered.length} products &bull; Upload product photos, manage stock levels, and add new floor SKUs
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Add New SKU
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card mb-xl">
        <form id="inventory-search-form" onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: "1 1 200px" }}>
            <label htmlFor="inv-search">Search Inventory</label>
            <input
              id="inv-search"
              type="text"
              placeholder="Name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: "0 1 150px" }}>
            <label htmlFor="inv-gender">Gender / Dept</label>
            <select id="inv-gender" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
              <option value="">All</option>
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
              <option value="KIDS">Kids</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: "0 1 200px" }}>
            <label htmlFor="inv-category">Category</label>
            <select id="inv-category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <button id="inv-search-btn" type="submit" className="btn btn-secondary">Filter</button>
        </form>
      </div>

      {/* Slow-moving stock alert */}
      {slowStockCount > 0 && (
        <div className="alert alert-info mb-xl" style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.3)", color: "var(--accent-light)", marginBottom: 20 }}>
          Notice: {slowStockCount} products have been in stock over 60 days — aging tiebreak boost automatically applies in kiosk recommendations.
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
                  <td style={{ fontSize: 12 }}>{p.colorFamily.replace(/_/g, " ")}</td>
                  <td style={{ fontSize: 12 }}>{p.fitType.replace(/_/g, " ")}</td>
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
              <div style={{ fontSize: 36, marginBottom: 12 }}>Box</div>
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
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
              New garments immediately enter the scoring pool for kiosk recommendations.
            </p>

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
                    {COLOR_FAMILIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fit Type</label>
                  <select
                    value={newProduct.fitType}
                    onChange={(e) => setNewProduct({ ...newProduct, fitType: e.target.value })}
                  >
                    {FIT_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pattern / Work</label>
                  <select
                    value={newProduct.pattern}
                    onChange={(e) => setNewProduct({ ...newProduct, pattern: e.target.value })}
                  >
                    {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
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
