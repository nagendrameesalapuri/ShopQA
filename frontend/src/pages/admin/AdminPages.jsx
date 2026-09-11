import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { productImageUrl } from "../../utils/productImage";

// ── Shared Admin Sidebar ──────────────────────────────────────────────────────
function AdminSidebar({ active }) {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">⚙️ Admin Panel</div>
      <nav className="sidebar-nav">
        <Link
          to="/admin"
          className={`sidebar-link ${active === "dashboard" ? "active" : ""}`}
        >
          📊 Dashboard
        </Link>
        <Link
          to="/admin/products"
          className={`sidebar-link ${active === "products" ? "active" : ""}`}
        >
          📦 Products
        </Link>
        <Link
          to="/admin/orders"
          className={`sidebar-link ${active === "orders" ? "active" : ""}`}
        >
          🛍 Orders
        </Link>
        <Link
          to="/admin/users"
          className={`sidebar-link ${active === "users" ? "active" : ""}`}
        >
          👥 Users
        </Link>
        <Link
          to="/admin/coupons"
          className={`sidebar-link ${active === "coupons" ? "active" : ""}`}
        >
          🎟 Coupons
        </Link>
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #334155",
            margin: "12px 0",
          }}
        />
        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noreferrer"
          className="sidebar-link"
        >
          📚 API Docs
        </a>
        <Link to="/" className="sidebar-link">
          🛒 Storefront
        </Link>
      </nav>
    </aside>
  );
}

// ═══════════════════ ADMIN PRODUCTS ════════════════════
export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
    brand: "",
    description: "",
    isFeatured: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Bulk import (Excel → dynamic table)
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const bulkFileInputRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await api.get("/products", {
      params: { limit: 50, search },
    });
    setProducts(data.products);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);
  useEffect(() => {
    api
      .get("/products/categories")
      .then(({ data }) => setCategories(data.categories));
  }, []);

  const openModal = (product = null) => {
    setEditProduct(product);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setForm(
      product
        ? {
            name: product.name,
            price: product.price,
            stock: product.stock,
            categoryId: product.category_id || "",
            brand: product.brand || "",
            description: product.description || "",
            isFeatured: product.is_featured,
          }
        : {
            name: "",
            price: "",
            stock: "",
            categoryId: "",
            brand: "",
            description: "",
            isFeatured: false,
          },
    );
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditProduct(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.price || form.price <= 0) errs.price = "Valid price required";
    if (form.stock === "" || form.stock < 0)
      errs.stock = "Stock cannot be negative";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("categoryId", form.categoryId);
      formData.append("brand", form.brand);
      formData.append("description", form.description);
      formData.append("isFeatured", form.isFeatured);
      selectedFiles.forEach((file) => formData.append("images", file));
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, formData, config);
        toast.success("Product updated");
      } else {
        await api.post("/products", formData, config);
        toast.success("Product created");
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    await api.delete(`/products/${id}`);
    toast.success("Product deactivated");
    fetchProducts();
  };

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    setSelectedFiles(imageFiles);
    setPreviewUrls(imageFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // ── Popup window & new-tab helpers ──
  const openQuickViewPopup = (product) => {
    const url = `${window.location.origin}/products/${product.slug || product.id}`;
    window.open(
      url,
      "productQuickView",
      "width=480,height=640,menubar=no,toolbar=no,location=no,status=no",
    );
  };

  const openInNewTab = (product) => {
    const url = `${window.location.origin}/products/${product.slug || product.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ── CSV export (file download + content validation) ──
  const handleExportCsv = async () => {
    try {
      const res = await api.get("/products/export/csv", {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Products exported to CSV");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  // ── Bulk import: read Excel/CSV → dynamic table ──
  const normalizeKey = (k) => String(k || "").trim().toLowerCase();

  const handleBulkFileSelect = (file) => {
    if (!file) return;
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const rows = json.map((raw) => {
          const entry = {};
          Object.keys(raw).forEach((k) => {
            entry[normalizeKey(k)] = raw[k];
          });
          return {
            name: entry.name || "",
            price: entry.price || "",
            stock: entry.stock || "",
            brand: entry.brand || "",
            category: entry.category || "",
            description: entry.description || "",
          };
        });
        setBulkRows(rows);
      } catch (err) {
        toast.error("Could not read file — is it a valid Excel/CSV?");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateBulkRow = (idx, field, value) => {
    setBulkRows((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  };

  const removeBulkRow = (idx) => {
    setBulkRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const isBulkRowValid = (row) =>
    row.name.trim() && Number(row.price) > 0 && Number(row.stock) >= 0;

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setBulkRows([]);
    setBulkFileName("");
  };

  const handleBulkImport = async () => {
    const validRows = bulkRows.filter(isBulkRowValid);
    if (!validRows.length) {
      toast.error("No valid rows to import");
      return;
    }
    setBulkImporting(true);
    try {
      const payload = validRows.map((r) => {
        const cat = categories.find(
          (c) => c.name.toLowerCase() === r.category.toLowerCase(),
        );
        return {
          name: r.name,
          price: r.price,
          stock: r.stock,
          brand: r.brand,
          description: r.description,
          categoryId: cat ? cat.id : null,
        };
      });
      const { data } = await api.post("/products/bulk-import", {
        products: payload,
      });
      toast.success(
        `Imported ${data.created.length} product(s)${data.errors.length ? `, ${data.errors.length} skipped` : ""}`,
      );
      closeBulkModal();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Bulk import failed");
    } finally {
      setBulkImporting(false);
    }
  };

  const downloadBulkTemplate = () => {
    const csv =
      "name,price,stock,brand,category,description\nSample Product,999,50,BrandCo,Electronics,A sample product row\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-import-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar active="products" />
      <main className="admin-page" data-testid="admin-products-page">
        <div className="admin-page-header">
          <h1 className="admin-title">Products</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={handleExportCsv}
              data-testid="btn-export-products"
            >
              ⬇️ Export CSV
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setBulkModalOpen(true)}
              data-testid="btn-bulk-import"
            >
              📊 Bulk Import (Excel)
            </button>
            <button
              className="btn btn-accent"
              onClick={() => openModal()}
              data-testid="btn-add-product"
            >
              + Add Product
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            className="form-input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="admin-product-search"
            style={{ maxWidth: 320 }}
          />
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table" data-testid="admin-products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} data-testid="admin-product-row">
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <img
                            src={productImageUrl(p.thumbnail, p, 80)}
                            alt={p.name}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = productImageUrl(null, p, 80);
                            }}
                          />
                          <div>
                            <p
                              style={{ fontWeight: 700, fontSize: "0.875rem" }}
                              data-testid="admin-product-name"
                            >
                              {p.name}
                            </p>
                            <p className="text-xs text-muted">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td
                        className="text-sm text-muted"
                        data-testid="admin-product-category"
                      >
                        {p.category_name}
                      </td>
                      <td
                        style={{ fontWeight: 700 }}
                        data-testid="admin-product-price"
                      >
                        ₹{Number(p.price).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span
                          className={
                            p.stock === 0
                              ? "badge badge-danger"
                              : p.stock <= 5
                                ? "badge badge-warning"
                                : "badge badge-success"
                          }
                          data-testid="admin-product-stock"
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td
                        className="text-sm"
                        data-testid="admin-product-rating"
                      >
                        ⭐ {Number(p.avg_rating || 0).toFixed(1)}
                      </td>
                      <td>
                        <span
                          className={`badge ${p.is_active ? "badge-success" : "badge-danger"}`}
                          data-testid="admin-product-status"
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openModal(p)}
                            data-testid="btn-edit-product"
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openQuickViewPopup(p)}
                            data-testid="btn-quick-view-popup"
                            title="Open in popup window"
                          >
                            🪟 Quick View
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openInNewTab(p)}
                            data-testid="btn-open-new-tab"
                            title="Open in new tab"
                          >
                            🔗 View Product
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(p.id, p.name)}
                            data-testid="btn-delete-product"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        {modalOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
            data-testid="product-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-modal-title"
          >
            <div className="modal" style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <h3 id="product-form-modal-title">{editProduct ? "Edit Product" : "Add New Product"}</h3>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={closeModal}
                  data-testid="close-product-modal"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {/* Image Upload / Drag & Drop */}
                <div
                  className={`droppable ${dragOver ? "drag-over" : ""} ${previewUrls.length ? "has-file" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    marginBottom: 20,
                    cursor: "pointer",
                    minHeight: 100,
                  }}
                  data-testid="image-dropzone"
                  role="button"
                  aria-label="Upload product images"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                    data-testid="image-file-input"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  {previewUrls.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        justifyContent: "center",
                        padding: 8,
                      }}
                    >
                      {previewUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="preview"
                          style={{
                            width: 72,
                            height: 72,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "2px solid var(--border)",
                          }}
                        />
                      ))}
                      <p
                        style={{
                          width: "100%",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          textAlign: "center",
                          marginTop: 6,
                        }}
                      >
                        ✅ {selectedFiles.length} image(s) selected — click to
                        change
                      </p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: "1.5rem", marginBottom: 6 }}>📸</p>
                      <p style={{ fontWeight: 600 }}>Drag & drop images here</p>
                      <p className="text-sm text-muted">
                        or click to browse (PNG, JPG up to 5MB)
                      </p>
                    </>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Product Name *</label>
                    <input
                      className={`form-input ${formErrors.name ? "error" : ""}`}
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. iPhone 15 Pro"
                      data-testid="product-name-input"
                    />
                    {formErrors.name && (
                      <p
                        className="form-error"
                        data-testid="product-name-error"
                      >
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      className={`form-input ${formErrors.price ? "error" : ""}`}
                      type="number"
                      value={form.price}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="999"
                      data-testid="product-price-input"
                    />
                    {formErrors.price && (
                      <p
                        className="form-error"
                        data-testid="product-price-error"
                      >
                        {formErrors.price}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input
                      className={`form-input ${formErrors.stock ? "error" : ""}`}
                      type="number"
                      value={form.stock}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, stock: e.target.value }))
                      }
                      placeholder="100"
                      data-testid="product-stock-input"
                    />
                    {formErrors.stock && (
                      <p className="form-error">{formErrors.stock}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, categoryId: e.target.value }))
                      }
                      data-testid="product-category-select"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      className="form-input"
                      value={form.brand}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, brand: e.target.value }))
                      }
                      placeholder="Apple, Samsung…"
                      data-testid="product-brand-input"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Product description…"
                      data-testid="product-desc-input"
                      style={{ resize: "vertical" }}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            isFeatured: e.target.checked,
                          }))
                        }
                        data-testid="product-featured-checkbox"
                      />
                      <span className="form-label" style={{ margin: 0 }}>
                        Featured Product
                      </span>
                    </label>
                  </div>
                </div>

                {editProduct?.slug && (
                  <div style={{ marginTop: 20 }}>
                    <label className="form-label">🖼 Live Storefront Preview</label>
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        src={`${window.location.origin}/products/${editProduct.slug}`}
                        title="Live product preview"
                        data-testid="product-preview-iframe"
                        style={{ width: "100%", height: 280, border: "none" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={closeModal}
                  data-testid="btn-cancel-product"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleSave}
                  disabled={saving}
                  data-testid="btn-save-product"
                >
                  {saving ? (
                    <>
                      <span className="spinner spinner-sm" /> Saving…
                    </>
                  ) : editProduct ? (
                    "Update Product"
                  ) : (
                    "Create Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal: Excel/CSV read → dynamic table */}
        {bulkModalOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && closeBulkModal()}
            data-testid="bulk-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-import-modal-title"
          >
            <div className="modal" style={{ maxWidth: 820 }}>
              <div className="modal-header">
                <h3 id="bulk-import-modal-title">Bulk Import Products (Excel/CSV)</h3>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={closeBulkModal}
                  data-testid="close-bulk-import-modal"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div
                  className={`droppable ${bulkRows.length ? "has-file" : ""}`}
                  onClick={() => bulkFileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleBulkFileSelect(e.dataTransfer.files?.[0]);
                  }}
                  style={{ marginBottom: 16, cursor: "pointer" }}
                  data-testid="bulk-import-dropzone"
                  role="button"
                  aria-label="Upload Excel or CSV file"
                >
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: "none" }}
                    data-testid="bulk-import-file-input"
                    onChange={(e) => handleBulkFileSelect(e.target.files?.[0])}
                  />
                  <p style={{ fontSize: "1.5rem", marginBottom: 6 }}>📊</p>
                  {bulkFileName ? (
                    <p style={{ fontWeight: 600 }}>
                      ✅ {bulkFileName} — {bulkRows.length} row(s) parsed
                    </p>
                  ) : (
                    <>
                      <p style={{ fontWeight: 600 }}>
                        Drag & drop an Excel/CSV file here
                      </p>
                      <p className="text-sm text-muted">
                        or click to browse (.xlsx, .xls, .csv)
                      </p>
                    </>
                  )}
                </div>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={downloadBulkTemplate}
                  data-testid="btn-download-template"
                  style={{ marginBottom: 16 }}
                >
                  ⬇️ Download Sample Template
                </button>

                {bulkRows.length > 0 && (
                  <div className="table-wrapper" style={{ maxHeight: 340, overflowY: "auto" }}>
                    <table className="table" data-testid="bulk-import-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Brand</th>
                          <th>Category</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, idx) => (
                          <tr
                            key={idx}
                            data-testid="bulk-import-row"
                            style={
                              !isBulkRowValid(row)
                                ? { background: "var(--danger-light, #fee2e2)" }
                                : undefined
                            }
                          >
                            <td>
                              <input
                                className="form-input"
                                value={row.name}
                                onChange={(e) => updateBulkRow(idx, "name", e.target.value)}
                                data-testid={`bulk-row-name-${idx}`}
                              />
                            </td>
                            <td>
                              <input
                                className="form-input"
                                type="number"
                                value={row.price}
                                onChange={(e) => updateBulkRow(idx, "price", e.target.value)}
                                data-testid={`bulk-row-price-${idx}`}
                                style={{ width: 90 }}
                              />
                            </td>
                            <td>
                              <input
                                className="form-input"
                                type="number"
                                value={row.stock}
                                onChange={(e) => updateBulkRow(idx, "stock", e.target.value)}
                                data-testid={`bulk-row-stock-${idx}`}
                                style={{ width: 80 }}
                              />
                            </td>
                            <td>
                              <input
                                className="form-input"
                                value={row.brand}
                                onChange={(e) => updateBulkRow(idx, "brand", e.target.value)}
                                data-testid={`bulk-row-brand-${idx}`}
                              />
                            </td>
                            <td>
                              <input
                                className="form-input"
                                value={row.category}
                                onChange={(e) => updateBulkRow(idx, "category", e.target.value)}
                                data-testid={`bulk-row-category-${idx}`}
                              />
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => removeBulkRow(idx)}
                                data-testid={`bulk-row-remove-${idx}`}
                                aria-label="Remove row"
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={closeBulkModal}
                  data-testid="btn-cancel-bulk-import"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleBulkImport}
                  disabled={bulkImporting || !bulkRows.length}
                  data-testid="btn-submit-bulk-import"
                >
                  {bulkImporting ? (
                    <>
                      <span className="spinner spinner-sm" /> Importing…
                    </>
                  ) : (
                    `Import ${bulkRows.filter(isBulkRowValid).length} Product(s)`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <AdminStyles />
    </div>
  );
}

// ═══════════════════ ADMIN ORDERS ════════════════════
export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await api.get("/orders/admin/all", {
      params: { search, status: statusFilter, limit: 50 },
    });
    setOrders(data.orders);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.put(`/orders/admin/${selectedOrder.id}/status`, {
        status: newStatus,
      });
      toast.success(`Order status updated to ${newStatus}`);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setUpdating(false);
    }
  };

  const STATUS_OPTS = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
    "returned",
  ];
  const STATUS_MAP = {
    pending: "badge-warning",
    confirmed: "badge-info",
    processing: "badge-info",
    shipped: "badge-info",
    delivered: "badge-success",
    cancelled: "badge-danger",
    refunded: "badge-neutral",
    returned: "badge-neutral",
    return_requested: "badge-warning",
  };

  return (
    <div className="admin-layout">
      <AdminSidebar active="orders" />
      <main className="admin-page" data-testid="admin-orders-page">
        <div className="admin-page-header">
          <h1 className="admin-title">Orders</h1>
          <span className="text-muted text-sm">{orders.length} orders</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <input
            className="form-input"
            placeholder="Search order # or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="admin-order-search"
            style={{ maxWidth: 260 }}
          />
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="admin-order-status-filter"
            style={{ width: "auto" }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table" data-testid="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} data-testid="admin-order-row">
                      <td>
                        <span
                          style={{ fontWeight: 700, fontFamily: "monospace" }}
                          data-testid="admin-order-number"
                        >
                          {o.order_number}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            {o.first_name} {o.last_name}
                          </p>
                          <p className="text-xs text-muted">{o.email}</p>
                        </div>
                      </td>
                      <td className="text-sm text-muted">{o.item_count}</td>
                      <td style={{ fontWeight: 700 }}>
                        ₹{Number(o.total).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span
                          className={`badge ${STATUS_MAP[o.status] || "badge-neutral"}`}
                          data-testid="admin-order-status"
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${o.payment_status === "paid" ? "badge-success" : "badge-danger"}`}
                          data-testid="admin-payment-status"
                        >
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="text-sm text-muted">
                        {new Date(o.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedOrder(o);
                            setNewStatus(o.status);
                          }}
                          data-testid="btn-update-order-status"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {selectedOrder && (
          <div
            className="modal-overlay"
            onClick={(e) =>
              e.target === e.currentTarget && setSelectedOrder(null)
            }
            data-testid="update-status-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-status-modal-title"
          >
            <div className="modal" style={{ maxWidth: 440 }}>
              <div className="modal-header">
                <h3 id="update-status-modal-title">Update Order Status</h3>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                  Order: <strong>{selectedOrder.order_number}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <select
                    className="form-input"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    data-testid="new-status-select"
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  data-testid="btn-confirm-status-update"
                >
                  {updating ? (
                    <span className="spinner spinner-sm" />
                  ) : (
                    "Update Status"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <AdminStyles />
    </div>
  );
}

// ═══════════════════ ADMIN USERS ════════════════════
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/users", {
      params: { search, limit: 50 },
    });
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const updateUserStatus = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}`, { status });
      toast.success(`User ${status}`);
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar active="users" />
      <main className="admin-page" data-testid="admin-users-page">
        <div className="admin-page-header">
          <h1 className="admin-title">Users</h1>
          <span className="text-muted text-sm">{users.length} users</span>
        </div>
        <input
          className="form-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="admin-user-search"
          style={{ maxWidth: 320, marginBottom: 20 }}
        />
        {loading ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table" data-testid="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} data-testid="admin-user-row">
                      <td>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                            {u.first_name} {u.last_name}
                          </p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${u.role === "admin" ? "badge-info" : "badge-neutral"}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${u.status === "active" ? "badge-success" : u.status === "locked" ? "badge-warning" : "badge-danger"}`}
                          data-testid="admin-user-status"
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="text-sm text-muted">
                        {new Date(u.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="text-sm text-muted">
                        {u.last_login
                          ? new Date(u.last_login).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          {u.status === "active" ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => updateUserStatus(u.id, "banned")}
                              data-testid="btn-ban-user"
                            >
                              Ban
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => updateUserStatus(u.id, "active")}
                              data-testid="btn-unban-user"
                            >
                              Unban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <AdminStyles />
    </div>
  );
}

// ═══════════════════ ADMIN COUPONS ════════════════════
export function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    usageLimit: "",
    minOrderAmt: "",
    maxDiscount: "",
    expiresAt: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = () => {
    setLoading(true);
    api
      .get("/admin/coupons")
      .then(({ data }) => setCoupons(data.coupons))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async () => {
    if (!form.code || !form.value) {
      toast.error("Code and value are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/coupons", form);
      toast.success("Coupon created!");
      setModalOpen(false);
      setForm({
        code: "",
        type: "percentage",
        value: "",
        usageLimit: "",
        minOrderAmt: "",
        maxDiscount: "",
        expiresAt: "",
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (id, isActive) => {
    await api.put(`/admin/coupons/${id}`, { isActive: !isActive });
    fetchCoupons();
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete coupon?")) return;
    await api.delete(`/admin/coupons/${id}`);
    toast.success("Coupon deleted");
    fetchCoupons();
  };

  return (
    <div className="admin-layout">
      <AdminSidebar active="coupons" />
      <main className="admin-page" data-testid="admin-coupons-page">
        <div className="admin-page-header">
          <h1 className="admin-title">Coupons</h1>
          <button
            className="btn btn-accent"
            onClick={() => setModalOpen(true)}
            data-testid="btn-create-coupon"
          >
            + Create Coupon
          </button>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table" data-testid="admin-coupons-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Used</th>
                    <th>Limit</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} data-testid="admin-coupon-row">
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            background: "var(--bg-muted)",
                            padding: "2px 8px",
                            borderRadius: 4,
                          }}
                          data-testid="coupon-code-cell"
                        >
                          {c.code}
                        </span>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ fontSize: "0.8rem", marginLeft: 4 }}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(c.code);
                              toast.success(`Copied "${c.code}"`, { toastId: "copy-coupon" });
                            } catch {
                              toast.error("Could not copy to clipboard");
                            }
                          }}
                          data-testid="copy-coupon-code-btn"
                          aria-label={`Copy coupon code ${c.code}`}
                          title="Copy coupon code"
                        >
                          📋
                        </button>
                      </td>
                      <td className="text-sm">{c.type}</td>
                      <td style={{ fontWeight: 700 }}>
                        {c.type === "percentage"
                          ? `${c.value}%`
                          : `₹${c.value}`}
                      </td>
                      <td className="text-sm text-muted">{c.usage_count}</td>
                      <td className="text-sm text-muted">
                        {c.usage_limit || "∞"}
                      </td>
                      <td className="text-sm text-muted">
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${c.is_active ? "badge-success" : "badge-danger"}`}
                          data-testid="coupon-status"
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => toggleCoupon(c.id, c.is_active)}
                            data-testid="btn-toggle-coupon"
                          >
                            {c.is_active ? "Disable" : "Enable"}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteCoupon(c.id)}
                            data-testid="btn-delete-coupon"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Coupon Modal */}
        {modalOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
            data-testid="create-coupon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-coupon-modal-title"
          >
            <div className="modal">
              <div className="modal-header">
                <h3 id="create-coupon-modal-title">Create Coupon</h3>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Coupon Code *</label>
                    <input
                      className="form-input"
                      value={form.code}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="SUMMER25"
                      data-testid="coupon-code"
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-input"
                      value={form.type}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, type: e.target.value }))
                      }
                      data-testid="coupon-type"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Value *</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.value}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, value: e.target.value }))
                      }
                      placeholder={form.type === "percentage" ? "10" : "500"}
                      data-testid="coupon-value"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Usage Limit</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.usageLimit}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, usageLimit: e.target.value }))
                      }
                      placeholder="100"
                      data-testid="coupon-limit"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Order (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.minOrderAmt}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, minOrderAmt: e.target.value }))
                      }
                      placeholder="0"
                      data-testid="coupon-min-order"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Discount (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.maxDiscount}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, maxDiscount: e.target.value }))
                      }
                      placeholder="Optional"
                      data-testid="coupon-max-discount"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, expiresAt: e.target.value }))
                      }
                      data-testid="coupon-expiry"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleSave}
                  disabled={saving}
                  data-testid="btn-save-coupon"
                >
                  {saving ? (
                    <span className="spinner spinner-sm" />
                  ) : (
                    "Create Coupon"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <AdminStyles />
    </div>
  );
}

function AdminStyles() {
  return (
    <style>{`
      .admin-layout { display: flex; min-height: 100vh; }
      .admin-sidebar { width: 220px; background: var(--primary); color: #fff; padding: 24px 0; flex-shrink: 0; }
      .sidebar-logo { font-family: var(--font-display); font-size: 1.1rem; padding: 0 20px 24px; border-bottom: 1px solid #334155; }
      .sidebar-nav { display: flex; flex-direction: column; padding: 16px 0; }
      .sidebar-link { display: flex; align-items: center; gap: 10px; padding: 10px 20px; color: #94a3b8; font-size: 0.875rem; font-weight: 500; transition: all var(--transition); }
      .sidebar-link:hover, .sidebar-link.active { background: #1e293b; color: #fff; }
      .admin-page { flex: 1; padding: 32px; overflow-x: hidden; min-width: 0; }
      .admin-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
      .admin-title { font-size: 1.75rem; font-family: var(--font-display); }
    `}</style>
  );
}

export default AdminProducts;
