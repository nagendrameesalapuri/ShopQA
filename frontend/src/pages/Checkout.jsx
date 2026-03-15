import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { toast } from "react-toastify";
import DatePicker from "../components/common/DatePicker";

const STEPS = ["Shipping", "Delivery", "Payment", "Review"];

const DELIVERY_OPTIONS = [
  {
    value: "standard",
    label: "Standard Delivery",
    desc: "5-7 business days",
    price: 49,
    freeOver: 500,
  },
  {
    value: "express",
    label: "Express Delivery",
    desc: "2-3 business days",
    price: 149,
    freeOver: null,
  },
  {
    value: "overnight",
    label: "Overnight Delivery",
    desc: "Next business day",
    price: 299,
    freeOver: null,
  },
  {
    value: "pickup",
    label: "Store Pickup",
    desc: "Ready in 2 hours",
    price: 0,
    freeOver: null,
  },
];

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, steps }) {
  return (
    <div className="step-indicator" data-testid="step-indicator">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div
            className={`step-item ${i < current ? "done" : i === current ? "active" : ""}`}
            data-testid={`step-${i}`}
          >
            <div className="step-dot">{i < current ? "✓" : i + 1}</div>
            <span className="step-label">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line ${i < current ? "done" : ""}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Step 1: Shipping Address ──────────────────────────────────────────────────
function ShippingStep({ data, onChange, addresses, onSelectSaved }) {
  const [useSaved, setUseSaved] = useState(false);

  return (
    <div data-testid="step-shipping">
      <h2 className="step-title">Shipping Address</h2>

      {addresses.length > 0 && (
        <div className="saved-addresses" data-testid="saved-addresses">
          <p className="section-label">Saved Addresses</p>
          <div className="address-cards">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`address-card ${useSaved === addr.id ? "selected" : ""}`}
                onClick={() => {
                  setUseSaved(addr.id);
                  onSelectSaved(addr);
                }}
                data-testid={`saved-address-${addr.id}`}
              >
                <p className="address-label-badge">{addr.label}</p>
                <p>
                  <strong>{addr.full_name}</strong>
                </p>
                <p className="text-muted text-sm">
                  {addr.line1}, {addr.city}, {addr.state} {addr.postal_code}
                </p>
                <p className="text-muted text-sm">{addr.phone}</p>
              </div>
            ))}
          </div>
          <div
            style={{
              margin: "16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span className="text-muted text-sm">or enter new address</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            className="form-input"
            value={data.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="John Doe"
            data-testid="field-full-name"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone *</label>
          <input
            className="form-input"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+91 98765 43210"
            type="tel"
            data-testid="field-phone"
            required
          />
        </div>
        <div className="form-group form-group-full">
          <label className="form-label">Address Line 1 *</label>
          <input
            className="form-input"
            value={data.line1}
            onChange={(e) => onChange("line1", e.target.value)}
            placeholder="House/Flat No., Street"
            data-testid="field-line1"
            required
          />
        </div>
        <div className="form-group form-group-full">
          <label className="form-label">Address Line 2</label>
          <input
            className="form-input"
            value={data.line2}
            onChange={(e) => onChange("line2", e.target.value)}
            placeholder="Area, Landmark (optional)"
            data-testid="field-line2"
          />
        </div>
        <div className="form-group">
          <label className="form-label">City *</label>
          <input
            className="form-input"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Bengaluru"
            data-testid="field-city"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">State *</label>
          <select
            className="form-input"
            value={data.state}
            onChange={(e) => onChange("state", e.target.value)}
            data-testid="field-state"
            required
          >
            <option value="">Select State</option>
            {[
              "Andhra Pradesh",
              "Assam",
              "Bihar",
              "Delhi",
              "Goa",
              "Gujarat",
              "Haryana",
              "Himachal Pradesh",
              "Jharkhand",
              "Karnataka",
              "Kerala",
              "Madhya Pradesh",
              "Maharashtra",
              "Odisha",
              "Punjab",
              "Rajasthan",
              "Tamil Nadu",
              "Telangana",
              "Uttar Pradesh",
              "West Bengal",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Postal Code *</label>
          <input
            className="form-input"
            value={data.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            placeholder="560001"
            maxLength={6}
            data-testid="field-postal"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Country</label>
          <select
            className="form-input"
            value={data.country}
            onChange={(e) => onChange("country", e.target.value)}
            data-testid="field-country"
          >
            <option value="India">India</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Delivery Method ───────────────────────────────────────────────────
function DeliveryStep({ selected, onChange, subtotal }) {
  return (
    <div data-testid="step-delivery">
      <h2 className="step-title">Delivery Method</h2>
      <div className="delivery-options">
        {DELIVERY_OPTIONS.map((opt) => {
          const isFree = opt.freeOver !== null && subtotal >= opt.freeOver;
          const price = isFree ? 0 : opt.price;
          return (
            <label
              key={opt.value}
              className={`delivery-option ${selected === opt.value ? "selected" : ""}`}
              data-testid={`delivery-${opt.value}`}
            >
              <input
                type="radio"
                name="delivery"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => onChange(opt.value)}
              />
              <div className="delivery-info">
                <p className="delivery-name">{opt.label}</p>
                <p className="text-muted text-sm">{opt.desc}</p>
              </div>
              <div className="delivery-price">
                {price === 0 ? (
                  <span className="text-success font-bold">FREE</span>
                ) : (
                  <span>₹{price}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Date picker for scheduled delivery */}
      <div style={{ marginTop: 24 }}>
        <p className="form-label" style={{ marginBottom: 8 }}>
          Preferred Delivery Date (optional)
        </p>
        <DatePicker minDate={new Date()} data-testid="delivery-date-picker" />
      </div>
    </div>
  );
}

// ── Step 3: Payment ───────────────────────────────────────────────────────────
function PaymentStep({
  method,
  onMethodChange,
  cardData,
  onCardChange,
  upiData,
  onUpiChange,
}) {
  const [showCard, setShowCard] = useState(false);

  return (
    <div data-testid="step-payment">
      <h2 className="step-title">Payment Method</h2>

      <div className="payment-methods">
        {/* Credit Card */}
        <label
          className={`payment-option ${method === "credit_card" ? "selected" : ""}`}
          data-testid="payment-credit-card"
        >
          <input
            type="radio"
            name="payment"
            value="credit_card"
            checked={method === "credit_card"}
            onChange={() => {
              onMethodChange("credit_card");
              setShowCard(true);
            }}
          />
          <span className="payment-icon">💳</span>
          <div>
            <p className="payment-name">Credit / Debit Card</p>
            <p className="text-muted text-xs">Visa, Mastercard, RuPay</p>
          </div>
        </label>

        {method === "credit_card" && (
          <div className="card-form" data-testid="card-form">
            {/* iFrame payment simulation */}
            <div
              className="iframe-payment"
              data-testid="iframe-payment-wrapper"
              id="payment-iframe-container"
            >
              <iframe
                title="payment-gateway"
                srcDoc={`
                  <html><body style="font-family:sans-serif;padding:16px;margin:0">
                  <p style="font-size:0.8rem;color:#666;margin-bottom:8px">🔒 Secure Payment</p>
                  <input id="cc" placeholder="Card Number" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;margin-bottom:8px;font-size:0.9rem" maxlength="19" />
                  <script>document.getElementById('cc').addEventListener('input',function(e){var v=e.target.value.replace(/\D/g,'').replace(/(\d{4})/g,'$1 ').trim();e.target.value=v;window.parent.postMessage({type:'cardNumber',value:v.replace(/\s/g,'')},'*')})</script>
                  </body></html>
                `}
                className="payment-iframe"
                data-testid="payment-iframe"
                style={{ width: "100%", height: 80, border: "none" }}
              />
            </div>
            <div className="form-grid">
              <div className="form-group form-group-full">
                <label className="form-label">Card Number (for testing)</label>
                <input
                  className="form-input"
                  value={cardData.cardNumber}
                  onChange={(e) => onCardChange("cardNumber", e.target.value)}
                  placeholder="4111 1111 1111 1111"
                  maxLength={19}
                  data-testid="card-number"
                />
                <p className="form-hint">
                  Use 4111111111111111 for success, 4000000000000002 for failure
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  className="form-input"
                  value={cardData.expiry}
                  onChange={(e) => onCardChange("expiry", e.target.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                  data-testid="card-expiry"
                />
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input
                  className="form-input"
                  value={cardData.cvv}
                  onChange={(e) => onCardChange("cvv", e.target.value)}
                  placeholder="•••"
                  maxLength={4}
                  type="password"
                  data-testid="card-cvv"
                />
              </div>
              <div className="form-group form-group-full">
                <label className="form-label">Name on Card</label>
                <input
                  className="form-input"
                  value={cardData.name}
                  onChange={(e) => onCardChange("name", e.target.value)}
                  placeholder="JOHN DOE"
                  data-testid="card-name"
                />
              </div>
            </div>
          </div>
        )}

        {/* UPI */}
        <label
          className={`payment-option ${method === "upi" ? "selected" : ""}`}
          data-testid="payment-upi"
        >
          <input
            type="radio"
            name="payment"
            value="upi"
            checked={method === "upi"}
            onChange={() => onMethodChange("upi")}
          />
          <span className="payment-icon">📱</span>
          <div>
            <p className="payment-name">UPI</p>
            <p className="text-muted text-xs">PhonePe, GPay, Paytm</p>
          </div>
        </label>

        {method === "upi" && (
          <div
            className="upi-form"
            data-testid="upi-form"
            style={{ marginLeft: 24, padding: 16 }}
          >
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                className="form-input"
                value={upiData.upiId}
                onChange={(e) => onUpiChange("upiId", e.target.value)}
                placeholder="yourname@upi"
                data-testid="upi-id"
              />
              <p className="form-hint">
                Use fail@upi to simulate payment failure
              </p>
            </div>
          </div>
        )}

        {/* PayPal */}
        <label
          className={`payment-option ${method === "paypal" ? "selected" : ""}`}
          data-testid="payment-paypal"
        >
          <input
            type="radio"
            name="payment"
            value="paypal"
            checked={method === "paypal"}
            onChange={() => onMethodChange("paypal")}
          />
          <span className="payment-icon">🅿</span>
          <div>
            <p className="payment-name">PayPal</p>
            <p className="text-muted text-xs">Pay securely via PayPal</p>
          </div>
        </label>

        {/* COD */}
        <label
          className={`payment-option ${method === "cod" ? "selected" : ""}`}
          data-testid="payment-cod"
        >
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={method === "cod"}
            onChange={() => onMethodChange("cod")}
          />
          <span className="payment-icon">💵</span>
          <div>
            <p className="payment-name">Cash on Delivery</p>
            <p className="text-muted text-xs">Pay when you receive</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// ── Main Checkout Page ────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);

  const [shipping, setShipping] = useState({
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [delivery, setDelivery] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [upiData, setUpiData] = useState({ upiId: "" });

  useEffect(() => {
    api
      .get("/users/addresses")
      .then(({ data }) => setAddresses(data.addresses || []))
      .catch(() => {});
  }, []);

  if (!cart?.items?.length) {
    return (
      <div
        className="container"
        style={{ padding: "80px 0", textAlign: "center" }}
      >
        <p style={{ fontSize: "3rem" }}>🛒</p>
        <h2>Your cart is empty</h2>
        <button
          className="btn btn-accent"
          onClick={() => navigate("/products")}
          style={{ marginTop: 16 }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const deliveryOption = DELIVERY_OPTIONS.find((o) => o.value === delivery);
  const deliveryPrice =
    deliveryOption?.freeOver && cart.subtotal >= deliveryOption.freeOver
      ? 0
      : deliveryOption?.price || 0;

  const validateStep = () => {
    if (step === 0) {
      const { fullName, phone, line1, city, state, postalCode } = shipping;
      if (!fullName || !phone || !line1 || !city || !state || !postalCode) {
        toast.error("Please fill in all required fields");
        return false;
      }
      if (!/^\d{6}$/.test(postalCode)) {
        toast.error("Invalid postal code");
        return false;
      }
    }
    if (step === 2 && paymentMethod === "credit_card") {
      if (!cardData.cardNumber || !cardData.expiry || !cardData.cvv) {
        toast.error("Please fill in card details");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const paymentData = paymentMethod === "credit_card" ? cardData : upiData;
      const { data } = await api.post("/orders", {
        shippingAddress: shipping,
        deliveryMethod: delivery,
        paymentMethod,
        paymentData,
      });
      toast.success("Order placed successfully! 🎉");
      navigate(`/order-confirmation/${data.order.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to place order";
      const code = err.response?.data?.code;
      if (code === "PAYMENT_FAILED") {
        toast.error(`Payment failed: ${msg}`, { autoClose: 6000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "32px 0" }}>
      <div className="container-sm">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            marginBottom: 32,
          }}
        >
          Checkout
        </h1>

        <StepIndicator current={step} steps={STEPS} />

        <div className="checkout-layout">
          <div className="checkout-form">
            {step === 0 && (
              <ShippingStep
                data={shipping}
                onChange={(k, v) => setShipping((p) => ({ ...p, [k]: v }))}
                addresses={addresses}
                onSelectSaved={(addr) =>
                  setShipping({
                    fullName: addr.full_name,
                    phone: addr.phone,
                    line1: addr.line1,
                    line2: addr.line2 || "",
                    city: addr.city,
                    state: addr.state,
                    postalCode: addr.postal_code,
                    country: addr.country,
                  })
                }
              />
            )}
            {step === 1 && (
              <DeliveryStep
                selected={delivery}
                onChange={setDelivery}
                subtotal={cart.subtotal}
              />
            )}
            {step === 2 && (
              <PaymentStep
                method={paymentMethod}
                onMethodChange={setPaymentMethod}
                cardData={cardData}
                onCardChange={(k, v) => setCardData((p) => ({ ...p, [k]: v }))}
                upiData={upiData}
                onUpiChange={(k, v) => setUpiData((p) => ({ ...p, [k]: v }))}
              />
            )}
            {step === 3 && (
              <div data-testid="step-review">
                <h2 className="step-title">Review Your Order</h2>
                <div className="review-section">
                  <p className="review-label">Shipping to</p>
                  <p>
                    {shipping.fullName} — {shipping.phone}
                  </p>
                  <p className="text-muted text-sm">
                    {shipping.line1}, {shipping.city}, {shipping.state}{" "}
                    {shipping.postalCode}
                  </p>
                </div>
                <div className="review-section">
                  <p className="review-label">Delivery</p>
                  <p>
                    {deliveryOption?.label} —{" "}
                    {deliveryPrice === 0 ? "FREE" : `₹${deliveryPrice}`}
                  </p>
                </div>
                <div className="review-section">
                  <p className="review-label">Payment</p>
                  <p>
                    {paymentMethod === "credit_card"
                      ? `Card ending in ${cardData.cardNumber.slice(-4)}`
                      : paymentMethod.toUpperCase()}
                  </p>
                </div>
              </div>
            )}

            <div className="step-actions">
              {step > 0 && (
                <button
                  className="btn btn-outline"
                  onClick={handleBack}
                  data-testid="btn-back"
                >
                  ← Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  className="btn btn-accent btn-lg"
                  onClick={handleNext}
                  data-testid="btn-next"
                  style={{ marginLeft: "auto" }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  className="btn btn-accent btn-lg"
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  data-testid="btn-place-order"
                  style={{ marginLeft: "auto" }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner spinner-sm" /> Placing Order…
                    </>
                  ) : (
                    "✓ Place Order"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary" data-testid="order-summary">
            <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="summary-item"
                data-testid="summary-item"
              >
                <img
                  alt={item.name}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p className="summary-item-name">{item.name}</p>
                  <p className="text-muted text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="summary-item-price">
                  ₹{(item.quantity * item.price).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{cart.subtotal?.toLocaleString("en-IN")}</span>
              </div>
              {cart.discount > 0 && (
                <div className="summary-row text-success">
                  <span>Discount</span>
                  <span>-₹{cart.discount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {deliveryPrice === 0 ? "FREE" : `₹${deliveryPrice}`}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax (18%)</span>
                <span>₹{cart.tax?.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>
                  ₹
                  {(
                    cart.total +
                    deliveryPrice -
                    (DELIVERY_OPTIONS.find((o) => o.value === "standard")
                      ?.price || 0)
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .step-indicator { display: flex; align-items: center; margin-bottom: 40px; }
        .step-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .step-dot { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; background: var(--bg-muted); color: var(--text-muted); border: 2px solid var(--border); transition: all 0.3s; }
        .step-item.active .step-dot { background: var(--primary); color: #fff; border-color: var(--primary); }
        .step-item.done .step-dot { background: var(--success); color: #fff; border-color: var(--success); }
        .step-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
        .step-item.active .step-label { color: var(--primary); }
        .step-line { flex: 1; height: 2px; background: var(--border); transition: background 0.3s; }
        .step-line.done { background: var(--success); }
        .checkout-layout { display: grid; grid-template-columns: 1fr 360px; gap: 40px; align-items: start; }
        .checkout-form { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 32px; }
        .step-title { font-size: 1.5rem; margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group-full { grid-column: 1 / -1; }
        .step-actions { display: flex; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
        .saved-addresses .address-cards { display: flex; flex-wrap: wrap; gap: 12px; }
        .address-card { border: 2px solid var(--border); border-radius: var(--radius); padding: 14px; cursor: pointer; min-width: 180px; transition: all var(--transition); }
        .address-card:hover { border-color: var(--primary); }
        .address-card.selected { border-color: var(--accent); background: #fff7ed; }
        .address-label-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
        .section-label { font-weight: 700; font-size: 0.85rem; margin-bottom: 10px; color: var(--text-muted); text-transform: uppercase; }
        .delivery-options { display: flex; flex-direction: column; gap: 12px; }
        .delivery-option { display: flex; align-items: center; gap: 14px; padding: 16px; border: 2px solid var(--border); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition); }
        .delivery-option.selected { border-color: var(--accent); background: #fff7ed; }
        .delivery-info { flex: 1; }
        .delivery-name { font-weight: 600; }
        .delivery-price { font-weight: 700; }
        .payment-methods { display: flex; flex-direction: column; gap: 12px; }
        .payment-option { display: flex; align-items: center; gap: 14px; padding: 14px; border: 2px solid var(--border); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition); }
        .payment-option.selected { border-color: var(--accent); background: #fff7ed; }
        .payment-icon { font-size: 1.5rem; }
        .payment-name { font-weight: 600; }
        .card-form, .upi-form { background: var(--bg-muted); border-radius: var(--radius-lg); padding: 20px; }
        .iframe-payment { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 16px; }
        .review-section { padding: 16px 0; border-bottom: 1px solid var(--border); }
        .review-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
        .order-summary { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; position: sticky; top: 90px; }
        .summary-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .summary-item-name { font-size: 0.875rem; font-weight: 600; line-height: 1.3; }
        .summary-item-price { font-weight: 700; white-space: nowrap; }
        .summary-totals { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
        .summary-total { font-weight: 700; font-size: 1.1rem; padding-top: 10px; border-top: 2px solid var(--border); }
        .text-success { color: var(--success); }
        @media (max-width: 900px) { .checkout-layout { grid-template-columns: 1fr; } .form-grid { grid-template-columns: 1fr; } .form-group-full { grid-column: 1; } }
      `}</style>
    </div>
  );
}
