// ═══════════════════ ORDERS PAGE ════════════════════
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";

const STATUS_BADGE = {
  pending: "badge-warning",
  confirmed: "badge-info",
  processing: "badge-info",
  shipped: "badge-info",
  delivered: "badge-success",
  cancelled: "badge-danger",
  refunded: "badge-neutral",
  return_requested: "badge-warning",
  returned: "badge-neutral",
};

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/orders", { params });
      setOrders(data.orders);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  return (
    <div style={{ padding: "32px 0" }} data-testid="orders-page">
      <div className="container-sm">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>My Orders</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
            My Orders
          </h1>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            data-testid="order-status-filter"
            style={{ width: "auto" }}
          >
            <option value="">All Orders</option>
            {[
              "pending",
              "confirmed",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
              "refunded",
            ].map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 120, borderRadius: 12, marginBottom: 16 }}
              />
            ))
        ) : orders.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 0" }}
            data-testid="no-orders"
          >
            <p style={{ fontSize: "3rem" }}>📦</p>
            <h3>No orders yet</h3>
            <p className="text-muted">
              Start shopping to see your orders here.
            </p>
            <Link
              to="/products"
              className="btn btn-accent"
              style={{ marginTop: 16 }}
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-list" data-testid="orders-list">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="order-card"
                  data-testid="order-card"
                >
                  <div className="order-card-header">
                    <div>
                      <p className="order-number" data-testid="order-number">
                        {order.order_number}
                      </p>
                      <p
                        className="text-muted text-xs"
                        data-testid="order-date"
                      >
                        Placed{" "}
                        {new Date(order.created_at).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </p>
                    </div>
                    <span
                      className={`badge ${STATUS_BADGE[order.status] || "badge-neutral"}`}
                      data-testid="order-status-badge"
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="order-card-footer">
                    <span className="text-sm text-muted">
                      {order.item_count} item
                      {order.item_count !== "1" ? "s" : ""}
                    </span>
                    <span className="order-total" data-testid="order-total">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {total > 10 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <span style={{ padding: "0 16px", fontSize: "0.9rem" }}>
                  Page {page}
                </span>
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={orders.length < 10}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .orders-list { display: flex; flex-direction: column; gap: 12px; }
        .order-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; transition: all var(--transition); }
        .order-card:hover { border-color: var(--accent); box-shadow: var(--shadow); transform: translateY(-1px); }
        .order-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .order-number { font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
        .order-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border); }
        .order-total { font-weight: 700; font-size: 1rem; }
      `}</style>
    </div>
  );
}

// ═══════════════════ ORDER DETAIL ════════════════════
export function OrderDetail() {
  const { id } = require("react-router-dom").useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`, {
        reason: "Customer requested cancellation",
      });
      toast.success("Order cancelled successfully");
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
    } catch (err) {
      toast.error(err.response?.data?.error || "Cannot cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading)
    return (
      <div className="container" style={{ padding: 48 }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
      </div>
    );
  if (!order)
    return (
      <div className="container" style={{ padding: 80, textAlign: "center" }}>
        <h2>Order not found</h2>
      </div>
    );

  const addr = order.shipping_address;
  const canCancel = ["pending", "confirmed", "processing"].includes(
    order.status,
  );

  return (
    <div style={{ padding: "32px 0" }} data-testid="order-detail-page">
      <div className="container-sm">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to="/orders">My Orders</Link>
          <span className="breadcrumb-sep">›</span>
          <span>{order.order_number}</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem" }}
            >
              {order.order_number}
            </h1>
            <p className="text-muted text-sm">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {canCancel && (
              <button
                className="btn btn-outline btn-sm"
                onClick={handleCancel}
                disabled={cancelling}
                data-testid="cancel-order-btn"
              >
                {cancelling ? (
                  <span className="spinner spinner-sm" />
                ) : (
                  "✕ Cancel Order"
                )}
              </button>
            )}
            <button
              className="btn btn-outline btn-sm"
              data-testid="download-invoice-btn"
              onClick={async () => {
                try {
                  const { data } = await api.get(`/orders/${id}/invoice`);
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `invoice-${order.order_number}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  toast.error("Failed to download invoice");
                }
              }}
            >
              📄 Invoice
            </button>
          </div>
        </div>

        <div className="order-detail-grid">
          <div>
            {/* Items */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <h3 style={{ marginBottom: 16 }}>Order Items</h3>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="order-item"
                    data-testid="order-item"
                  >
                    <img
                      src={
                        item.image_url ||
                        `https://picsum.photos/seed/${item.product_id}/60/60`
                      }
                      alt={item.product_name}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{ fontWeight: 700 }}
                        data-testid="order-item-name"
                      >
                        {item.product_name}
                      </p>
                      <p className="text-muted text-sm">
                        Qty: {item.quantity} × ₹
                        {Number(item.unit_price).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <p
                      style={{ fontWeight: 700 }}
                      data-testid="order-item-total"
                    >
                      ₹{Number(item.total_price).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ marginBottom: 20 }}>Order Tracking</h3>
                <div className="timeline" data-testid="order-timeline">
                  {order.history?.map((h, i) => (
                    <div
                      key={i}
                      className="timeline-item"
                      data-testid="timeline-item"
                    >
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <p
                          style={{
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {h.status?.replace(/_/g, " ")}
                        </p>
                        {h.comment && (
                          <p className="text-muted text-sm">{h.comment}</p>
                        )}
                        <p className="text-xs text-muted">
                          {h.time
                            ? new Date(h.time).toLocaleString("en-IN")
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {order.tracking_number && (
                  <p className="text-sm" style={{ marginTop: 12 }}>
                    🚚 Tracking:{" "}
                    <strong data-testid="tracking-number">
                      {order.tracking_number}
                    </strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            {/* Status */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <p
                  className="text-muted text-xs"
                  style={{ textTransform: "uppercase", marginBottom: 8 }}
                >
                  Status
                </p>
                <span
                  className={`badge ${STATUS_BADGE[order.status]}`}
                  style={{ fontSize: "0.9rem", padding: "6px 14px" }}
                  data-testid="order-detail-status"
                >
                  {order.status?.replace(/_/g, " ")}
                </span>
                {order.estimated_delivery && (
                  <p className="text-sm text-muted" style={{ marginTop: 10 }}>
                    Est. delivery:{" "}
                    {new Date(order.estimated_delivery).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "long" },
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <h4 style={{ marginBottom: 12 }}>Shipping Address</h4>
                <p style={{ fontWeight: 700 }} data-testid="shipping-name">
                  {addr?.fullName}
                </p>
                <p className="text-muted text-sm">{addr?.line1}</p>
                {addr?.line2 && (
                  <p className="text-muted text-sm">{addr.line2}</p>
                )}
                <p className="text-muted text-sm">
                  {addr?.city}, {addr?.state} {addr?.postalCode}
                </p>
                <p className="text-muted text-sm">{addr?.phone}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom: 12 }}>Payment Summary</h4>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>Subtotal</span>
                    <span>
                      ₹{Number(order.subtotal).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {parseFloat(order.discount_amt) > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.9rem",
                        color: "var(--success)",
                      }}
                    >
                      <span>Discount</span>
                      <span>
                        -₹{Number(order.discount_amt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>Shipping</span>
                    <span>
                      {parseFloat(order.shipping_cost) === 0
                        ? "FREE"
                        : `₹${Number(order.shipping_cost).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>Tax</span>
                    <span>
                      ₹{Number(order.tax_amt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      paddingTop: 10,
                      borderTop: "2px solid var(--border)",
                    }}
                  >
                    <span>Total</span>
                    <span data-testid="order-grand-total">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      paddingTop: 8,
                    }}
                  >
                    <span>Payment: </span>
                    <span
                      style={{ textTransform: "capitalize", fontWeight: 600 }}
                      data-testid="payment-method"
                    >
                      {order.payment_method?.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`badge badge-${order.payment_status === "paid" ? "success" : "danger"}`}
                      style={{ marginLeft: 8 }}
                      data-testid="payment-status"
                    >
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .order-detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        .order-item { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .order-item:last-child { border-bottom: none; }
        .timeline { position: relative; padding-left: 24px; }
        .timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: var(--border); }
        .timeline-item { position: relative; padding-bottom: 20px; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-dot { position: absolute; left: -20px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg-card); box-shadow: 0 0 0 2px var(--accent); }
        .timeline-content { padding-left: 8px; }
        @media (max-width: 768px) { .order-detail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// ═══════════════════ ORDER CONFIRMATION ════════════════════
export function OrderConfirmation() {
  const { id } = require("react-router-dom").useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(() => {});
  }, [id]);

  return (
    <div
      style={{ padding: "64px 0", textAlign: "center" }}
      data-testid="order-confirmation-page"
    >
      <div className="container-sm" style={{ maxWidth: 560 }}>
        <div className="confirm-icon" data-testid="confirm-icon">
          ✅
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            marginBottom: 8,
          }}
          data-testid="confirm-title"
        >
          Order Confirmed!
        </h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Thank you for your purchase. We've received your order and will begin
          processing it shortly.
        </p>
        {order && (
          <div className="confirm-card" data-testid="confirm-order-details">
            <p className="text-muted text-sm">Order Number</p>
            <p
              style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 16 }}
              data-testid="confirm-order-number"
            >
              {order.order_number}
            </p>
            <p className="text-muted text-sm">Total Amount</p>
            <p
              style={{
                fontWeight: 700,
                fontSize: "1.4rem",
                color: "var(--accent)",
              }}
              data-testid="confirm-order-total"
            >
              ₹{Number(order.total).toLocaleString("en-IN")}
            </p>
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          <Link
            to={`/orders/${id}`}
            className="btn btn-primary"
            data-testid="track-order-btn"
          >
            Track Order
          </Link>
          <Link
            to="/products"
            className="btn btn-outline"
            data-testid="continue-shopping-btn"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
      <style>{`
        .confirm-icon { font-size: 4rem; margin-bottom: 20px; animation: bounce-in 0.5s ease; }
        .confirm-card { background: var(--bg-muted); border-radius: var(--radius-lg); padding: 24px; margin: 24px 0; }
      `}</style>
    </div>
  );
}

// ═══════════════════ PROFILE ════════════════════
export function Profile() {
  const { user, updateUser } = require("../context/AuthContext").useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/me", {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      updateUser(data.user);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "32px 0" }} data-testid="profile-page">
      <div className="container-sm">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            marginBottom: 24,
          }}
        >
          My Profile
        </h1>
        <div className="tabs">
          <button
            className={`tab ${tab === "profile" ? "active" : ""}`}
            onClick={() => setTab("profile")}
            data-testid="tab-profile"
          >
            Profile
          </button>
          <button
            className={`tab ${tab === "security" ? "active" : ""}`}
            onClick={() => setTab("security")}
            data-testid="tab-security"
          >
            Security
          </button>
        </div>
        {tab === "profile" && (
          <div className="card">
            <div className="card-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-input"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    data-testid="profile-first-name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-input"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    data-testid="profile-last-name"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    value={user?.email}
                    disabled
                    style={{ opacity: 0.6 }}
                    data-testid="profile-email"
                  />
                </div>
              </div>
              <button
                className="btn btn-accent"
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: 20 }}
                data-testid="save-profile-btn"
              >
                {saving ? (
                  <span className="spinner spinner-sm" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        )}
        {tab === "security" && (
          <div className="card">
            <div className="card-body">
              <p className="text-muted">
                Password change functionality — practice form validation here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════ WISHLIST ════════════════════
export function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = require("../context/CartContext").useCart();

  useEffect(() => {
    api
      .get("/users/wishlist")
      .then(({ data }) => setItems(data.wishlist))
      .finally(() => setLoading(false));
  }, []);

  const removeFromWishlist = async (productId) => {
    await api.delete(`/users/wishlist/${productId}`);
    setItems((prev) => prev.filter((i) => i.id !== productId));
    toast.info("Removed from wishlist");
  };

  return (
    <div style={{ padding: "32px 0" }} data-testid="wishlist-page">
      <div className="container">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            marginBottom: 32,
          }}
        >
          My Wishlist ({items.length})
        </h1>
        {loading ? (
          <div className="product-grid">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 320, borderRadius: 12 }}
                />
              ))}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 0" }}
            data-testid="empty-wishlist"
          >
            <p style={{ fontSize: "3rem" }}>❤️</p>
            <h3>Your wishlist is empty</h3>
            <Link
              to="/products"
              className="btn btn-accent"
              style={{ marginTop: 16 }}
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="product-grid" data-testid="wishlist-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className="wishlist-card"
                data-testid="wishlist-item"
              >
                <button
                  className="wishlist-remove"
                  onClick={() => removeFromWishlist(item.id)}
                  data-testid="remove-wishlist-item"
                  aria-label="Remove from wishlist"
                >
                  ♥
                </button>
                <Link to={`/products/${item.slug || item.id}`}>
                  <img
                    src={
                      item.thumbnail ||
                      `https://picsum.photos/seed/${item.id}/200/200`
                    }
                    alt={item.name}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ padding: 14 }}>
                    <p
                      style={{ fontWeight: 700, marginBottom: 4 }}
                      data-testid="wishlist-item-name"
                    >
                      {item.name}
                    </p>
                    <p
                      style={{ fontWeight: 700, color: "var(--accent)" }}
                      data-testid="wishlist-item-price"
                    >
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                </Link>
                <button
                  className="btn btn-accent btn-full"
                  style={{ borderRadius: "0 0 12px 12px" }}
                  onClick={() => addToCart(item.id)}
                  data-testid="wishlist-add-to-cart"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .wishlist-card { position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: all 0.3s; }
        .wishlist-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .wishlist-remove { position: absolute; top: 8px; right: 8px; z-index: 1; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; color: var(--danger); font-size: 1rem; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}

// ═══════════════════ NOT FOUND ════════════════════
export function NotFound() {
  return (
    <div
      style={{ textAlign: "center", padding: "100px 24px" }}
      data-testid="not-found-page"
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "6rem",
          color: "var(--border)",
          marginBottom: 0,
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.75rem",
          marginBottom: 8,
        }}
      >
        Page Not Found
      </h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-accent btn-lg">
        Go Home
      </Link>
    </div>
  );
}

export default Orders;
