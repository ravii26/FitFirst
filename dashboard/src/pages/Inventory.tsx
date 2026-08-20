import { useEffect, useState } from "react";

const API = "/api";

const CATEGORIES = [
  "KURTA","SAREE","SALWAR_KAMEEZ","LEHENGA","SHERWANI","DHOTI","DUPATTA",
  "SHIRT","TROUSERS","JEANS","DRESS","SKIRT","JACKET",
  "KIDS_KURTA","KIDS_SHIRT","KIDS_TROUSERS","KIDS_DRESS","ACCESSORIES",
];

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

  const filtered = products.filter((p) =>
    search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            {filtered.length} products · Update stock quantities and manage active listings
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-xl">
        <form id="inventory-search-form" onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: "1 1 200px" }}>
            <label htmlFor="inv-search">Search</label>
            <input
              id="inv-search"
              type="text"
              placeholder="Name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: "0 1 150px" }}>
            <label htmlFor="inv-gender">Gender</label>
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

      {/* Slow-moving alert */}
      {products.filter((p) => p.daysInStock > 60 && p.isActive).length > 0 && (
        <div className="alert alert-info mb-xl">
          ⚠️ {products.filter((p) => p.daysInStock > 60 && p.isActive).length} products have been in stock &gt;60 days — they'll receive an aging tiebreak boost in recommendations.
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table id="inventory-table">
            <thead>
              <tr>
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
                  <td className="monospace">{p.sku}</td>
                  <td className="primary">{p.name}</td>
                  <td>{categoryLabel(p.category)}</td>
                  <td><span className={`badge ${genderBadge[p.gender] ?? "badge-gray"}`}>{p.gender}</span></td>
                  <td style={{ fontSize: 12 }}>{p.colorFamily.replace(/_/g, " ")}</td>
                  <td style={{ fontSize: 12 }}>{p.fitType.replace(/_/g, " ")}</td>
                  <td>₹{p.price.toLocaleString("en-IN")}</td>
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
                        <button className="btn btn-primary btn-sm" onClick={() => saveStock(p.id)} disabled={savingStock}>✓</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingStock(null)}>✕</button>
                      </div>
                    ) : (
                      <span
                        style={{
                          color: p.stockQty === 0 ? "var(--danger)" : p.stockQty <= 3 ? "var(--warning)" : "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        {successId === p.id ? <span style={{ color: "var(--success)" }}>✓ Saved</span> : p.stockQty}
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
                    <div style={{ display: "flex", gap: 4 }}>
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
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No products found</h3>
              <p>Adjust your filters or add products via the API.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
