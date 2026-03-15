import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const data = await applyCoupon(couponCode.trim().toUpperCase());
      setCouponSuccess(
        `Coupon applied! You saved ₹${data.coupon.discount?.toFixed(2)}`,
      );
      toast.success("Coupon applied!");
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid coupon code";
      setCouponError(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setCouponCode("");
    setCouponSuccess("");
    toast.info("Coupon removed");
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "48px 0" }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 120, borderRadius: 12, marginBottom: 16 }}
                />
              ))}
          </div>
          <div
            className="skeleton"
            style={{ width: 320, height: 320, borderRadius: 12 }}
          />
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div
        className="container"
        style={{ padding: "80px 0", textAlign: "center" }}
        data-testid="empty-cart"
      >
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>🛒</div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            marginBottom: 8,
          }}
        >
          Your cart is empty
        </h2>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link
          to="/products"
          className="btn btn-accent btn-lg"
          data-testid="continue-shopping-btn"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0" }} data-testid="cart-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Shopping Cart</span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            marginBottom: 32,
          }}
        >
          Shopping Cart{" "}
          <span
            style={{
              fontSize: "1rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
            }}
          >
            ({cart.itemCount} items)
          </span>
        </h1>

        <div className="cart-layout">
          {/* ── Items ── */}
          <div className="cart-items" data-testid="cart-items-list">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="cart-item"
                data-testid="cart-item"
                data-product-id={item.product_id}
              >
                <img
                  src={
                    item.thumbnail
                      ? `https://shopqa-backend.onrender.com${item.thumbnail}`
                      : `https://picsum.photos/seed/${item.id}/300/300`
                  }
                  alt={item.name}
                  className="cart-item-img"
                  data-testid="cart-item-image"
                />
                <div className="cart-item-info">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="cart-item-name"
                    data-testid="cart-item-name"
                  >
                    {item.name}
                  </Link>
                  <p
                    className="cart-item-price text-muted text-sm"
                    data-testid="cart-item-unit-price"
                  >
                    ₹{Number(item.price).toLocaleString("en-IN")} each
                  </p>
                  {item.stock <= 5 && item.stock > 0 && (
                    <p
                      className="text-warning text-xs"
                      data-testid="low-stock-warning"
                    >
                      ⚠️ Only {item.stock} left!
                    </p>
                  )}
                  {item.stock === 0 && (
                    <p
                      className="text-danger text-xs"
                      data-testid="oos-warning"
                    >
                      🚫 Out of stock
                    </p>
                  )}
                </div>

                <div className="cart-item-actions">
                  <div className="qty-input" data-testid="cart-qty-control">
                    <button
                      className="qty-btn"
                      onClick={() =>
                        item.quantity > 1
                          ? updateQuantity(item.id, item.quantity - 1)
                          : removeItem(item.id)
                      }
                      data-testid="qty-decrease"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qty-num" data-testid="cart-qty">
                      {item.quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      data-testid="qty-increase"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <p className="cart-item-total" data-testid="cart-item-total">
                    ₹{(item.quantity * item.price).toLocaleString("en-IN")}
                  </p>
                  <button
                    className="btn btn-ghost btn-icon remove-btn"
                    onClick={() => removeItem(item.id)}
                    data-testid="remove-item-btn"
                    aria-label={`Remove ${item.name} from cart`}
                    title="Remove item"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <div style={{ paddingTop: 16 }}>
              <Link
                to="/products"
                className="btn btn-outline"
                data-testid="continue-shopping-link"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="cart-summary" data-testid="cart-summary">
            <h3 style={{ marginBottom: 20 }}>Order Summary</h3>

            {/* Coupon */}
            <div className="coupon-section" data-testid="coupon-section">
              <p className="coupon-label">Have a coupon?</p>
              {cart.coupon ? (
                <div className="coupon-applied" data-testid="coupon-applied">
                  <div>
                    <p className="coupon-code-badge">🎟 {cart.coupon.code}</p>
                    <p className="text-sm text-success">
                      {cart.coupon.type === "percentage"
                        ? `${cart.coupon.value}% off`
                        : `₹${cart.coupon.value} off`}
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleRemoveCoupon}
                    data-testid="remove-coupon-btn"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="coupon-input-wrap">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    data-testid="coupon-input"
                    aria-label="Coupon code"
                  />
                  <button
                    className="btn btn-outline"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    data-testid="apply-coupon-btn"
                  >
                    {couponLoading ? (
                      <span className="spinner spinner-sm" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="form-error" data-testid="coupon-error">
                  {couponError}
                </p>
              )}
              {couponSuccess && (
                <p
                  className="text-success text-sm"
                  data-testid="coupon-success"
                >
                  {couponSuccess}
                </p>
              )}
              <div
                className="coupon-hints text-xs text-muted"
                style={{ marginTop: 6 }}
              >
                Try: WELCOME10, FLAT500, SUMMER25, FREESHIP
              </div>
            </div>

            {/* Totals */}
            <div className="summary-totals" data-testid="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">
                  ₹{Number(cart.subtotal).toLocaleString("en-IN")}
                </span>
              </div>
              {cart.discount > 0 && (
                <div
                  className="summary-row"
                  style={{ color: "var(--success)" }}
                >
                  <span>Discount</span>
                  <span data-testid="discount-amount">
                    -₹{Number(cart.discount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <span data-testid="cart-shipping">
                  {cart.shipping === 0 ? (
                    <span style={{ color: "var(--success)" }}>FREE</span>
                  ) : (
                    `₹${cart.shipping}`
                  )}
                </span>
              </div>
              {cart.shipping === 0 && (
                <p className="text-xs text-success" style={{ marginTop: -8 }}>
                  🎉 Free shipping on orders above ₹500!
                </p>
              )}
              <div className="summary-row">
                <span>Tax (18% GST)</span>
                <span data-testid="cart-tax">
                  ₹{Number(cart.tax).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="summary-row summary-total-row">
                <span>Total</span>
                <span data-testid="cart-total">
                  ₹{Number(cart.total).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              className="btn btn-accent btn-full btn-lg"
              onClick={() => navigate("/checkout")}
              data-testid="proceed-checkout-btn"
              style={{ marginTop: 20 }}
            >
              Proceed to Checkout →
            </button>

            <div className="trust-badges" data-testid="trust-badges">
              <div className="trust-badge">
                <span>🔒</span>
                <span>Secure Checkout</span>
              </div>
              <div className="trust-badge">
                <span>↩️</span>
                <span>Easy Returns</span>
              </div>
              <div className="trust-badge">
                <span>🚚</span>
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
        .cart-items { display: flex; flex-direction: column; gap: 0; }
        .cart-item { display: flex; align-items: center; gap: 20px; padding: 20px 0; border-bottom: 1px solid var(--border); }
        .cart-item:first-child { padding-top: 0; }
        .cart-item-img { width: 80px; height: 80px; border-radius: var(--radius); object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
        .cart-item-info { flex: 1; min-width: 0; }
        .cart-item-name { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .cart-item-name:hover { color: var(--accent); }
        .cart-item-actions { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
        .cart-item-total { font-weight: 700; font-size: 1rem; min-width: 80px; text-align: right; }
        .remove-btn:hover { color: var(--danger); background: #fee2e2; }
        .cart-summary { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; position: sticky; top: 90px; }
        .coupon-section { background: var(--bg-muted); border-radius: var(--radius); padding: 16px; margin-bottom: 20px; }
        .coupon-label { font-weight: 700; font-size: 0.85rem; margin-bottom: 10px; }
        .coupon-input-wrap { display: flex; gap: 8px; }
        .coupon-applied { display: flex; align-items: center; justify-content: space-between; }
        .coupon-code-badge { font-weight: 700; color: var(--success); }
        .summary-totals { display: flex; flex-direction: column; gap: 12px; padding-bottom: 16px; border-bottom: 2px solid var(--border); }
        .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
        .summary-total-row { font-weight: 700; font-size: 1.1rem; padding-top: 12px; border-top: 2px solid var(--border); }
        .trust-badges { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
        .trust-badge { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.7rem; color: var(--text-muted); }
        .trust-badge span:first-child { font-size: 1.2rem; }
        .text-success { color: var(--success); }
        .text-warning { color: var(--warning); }
        .text-danger  { color: var(--danger);  }
        .coupon-hints { margin-top: 6px; }
        @media (max-width: 900px) { .cart-layout { grid-template-columns: 1fr; } }
        @media (max-width: 600px) { .cart-item { flex-wrap: wrap; } .cart-item-actions { width: 100%; justify-content: space-between; } }
      `}</style>
    </div>
  );
}
