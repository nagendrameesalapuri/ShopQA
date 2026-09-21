import React, { useMemo, useState } from "react";

const U = "john@test.com / Password123!";
const A = "admin@shopqa.com / Password123!";

// [module, title, type, priority, steps, expected]
const RAW = [
  // ── Authentication ──
  ["Authentication", "Application home page loads", "Sanity", "P0", "Open http://localhost:3000", "Home page renders with navbar, hero and featured products; no console errors"],
  ["Authentication", "Login with valid credentials", "Smoke", "P0", `Go to /login, enter ${U}, click Login`, "User redirected to home; navbar shows user menu"],
  ["Authentication", "Login with wrong password", "Regression", "P1", "Login with john@test.com and a wrong password", "Error message with remaining attempts; user stays on /login"],
  ["Authentication", "Account lockout after 5 failed attempts", "Regression", "P1", "Fail login 5 times for bob@test.com, then try the correct password", "Account locked for 30 minutes; lock message displayed"],
  ["Authentication", "Register new user", "Smoke", "P0", "Go to /register, fill unique email, valid password, submit", "Success message; account created; verification prompt shown"],
  ["Authentication", "Register with duplicate email", "Regression", "P1", "Register using john@test.com", "Error: email already exists"],
  ["Authentication", "Forgot and reset password", "Regression", "P2", "Go to /forgot-password, submit email, use token at /reset-password/:token", "Password changed; login works with new password"],
  ["Authentication", "Logout", "Sanity", "P0", "Login, open user menu, click Logout", "Session cleared; redirected to login/home; protected pages inaccessible"],
  ["Authentication", "Protected route redirects guests", "Regression", "P1", "Logged out, open /cart, /orders, /profile", "Redirected to /login for each route"],
  ["Authentication", "Expired token forces re-login", "Regression", "P2", "Login, call POST /api/qa/users/:id/expire-tokens, navigate to /orders", "401 handled; user redirected to /login"],

  // ── Product Catalog ──
  ["Product Catalog", "Product list loads", "Sanity", "P0", "Open /products", "Product grid shows items with image, name, price, rating"],
  ["Product Catalog", "Filter by category", "Smoke", "P1", "Select a category in sidebar", "Only products of that category shown; URL has ?category="],
  ["Product Catalog", "Filter by price range", "Regression", "P2", "Set min 500 and max 2000", "All shown products priced within range"],
  ["Product Catalog", "Sort products", "Regression", "P2", "Choose Price: Low to High, then High to Low", "Grid reorders correctly for each option"],
  ["Product Catalog", "Search products", "Smoke", "P1", "Type a keyword in navbar search and press Enter", "Results relevant to keyword; autocomplete suggestions appear while typing"],
  ["Product Catalog", "Search with no results", "Regression", "P2", "Search 'zzzxxyy'", "Empty-state message displayed"],
  ["Product Catalog", "Out-of-stock product", "Regression", "P1", "Set stock 0 via /api/qa/products/out-of-stock, open list", "Out-of-stock badge shown; Add to Cart disabled"],

  // ── Product Detail ──
  ["Product Detail", "Open product detail page", "Sanity", "P0", "Click any product card", "Detail page shows title, price, description, images, stock status"],
  ["Product Detail", "Add product to cart from detail page", "Smoke", "P0", "Login, open product, set qty 2, click Add to Cart", "Success toast; cart badge count increases by 2"],
  ["Product Detail", "Submit product review", "Regression", "P2", "Login, open product, rate 4 stars, write review, submit", "Review appears in list; average rating updates"],

  // ── Cart ──
  ["Cart", "View cart", "Sanity", "P0", "Login, add item, open /cart", "Item, qty, price and total displayed"],
  ["Cart", "Update item quantity", "Smoke", "P1", "Change qty from 1 to 3", "Line total and order summary recalculate"],
  ["Cart", "Remove item from cart", "Smoke", "P1", "Click remove on an item", "Item removed; totals update; empty state if last item"],
  ["Cart", "Quantity cannot exceed stock", "Regression", "P1", "Set quantity above available stock", "Validation error; quantity capped"],
  ["Cart", "Cart persists after re-login", "Regression", "P2", "Add item, logout, login again", "Cart items still present"],

  // ── Coupons ──
  ["Coupons", "Apply valid coupon WELCOME10", "Smoke", "P1", "Add items, enter WELCOME10 in cart, Apply", "10% discount applied; total updated"],
  ["Coupons", "Apply flat coupon FLAT500", "Regression", "P2", "Apply FLAT500 with cart above minimum", "Flat 500 deducted from total"],
  ["Coupons", "Apply expired coupon", "Regression", "P2", "Apply EXPIRED50", "Error: coupon expired; totals unchanged"],
  ["Coupons", "Apply exhausted coupon", "Regression", "P3", "Apply MAXUSED", "Error: usage limit reached"],
  ["Coupons", "Remove applied coupon", "Regression", "P2", "Apply coupon, then remove it", "Discount removed; original total restored"],

  // ── Checkout & Payment ──
  ["Checkout", "Proceed to checkout", "Sanity", "P0", "From cart click Checkout", "Checkout page shows address and payment sections with summary"],
  ["Checkout", "Address validation", "Regression", "P1", "Submit checkout with empty/invalid address and pincode", "Field-level validation errors; order not placed"],
  ["Checkout", "Pay with success card 4111 1111 1111 1111", "Smoke", "P0", "Enter card, place order", "Payment success; redirected to order confirmation"],
  ["Checkout", "Pay with insufficient funds card", "Regression", "P1", "Use 4000 0000 0000 0002", "Payment declined message; order not confirmed; cart retained"],
  ["Checkout", "Pay with expired card", "Regression", "P2", "Use 4000 0000 0000 0069", "Card expired error displayed"],
  ["Checkout", "UPI payment failure", "Regression", "P2", "Choose UPI and enter fail@upi", "Payment failure shown; user can retry"],
  ["Checkout", "Cash on delivery order", "Regression", "P2", "Select COD and place order", "Order created with pending payment status"],

  // ── Orders ──
  ["Orders", "Order history list", "Sanity", "P0", "Open /orders", "User's orders listed with number, date, status, total"],
  ["Orders", "View order detail", "Smoke", "P1", "Click an order", "Items, address, payment and status timeline displayed"],
  ["Orders", "Cancel a pending order", "Regression", "P1", "Open pending order, click Cancel, confirm", "Status becomes cancelled; stock restored"],
  ["Orders", "Return a delivered order", "Regression", "P2", "Open delivered order, request return", "Status becomes return_requested"],
  ["Orders", "Download invoice", "Regression", "P3", "Click Download Invoice on an order", "Invoice PDF downloads with correct order data"],

  // ── Profile & Wishlist ──
  ["Profile & Wishlist", "Update profile", "Regression", "P2", "Open /profile, change name/phone, save", "Success toast; values persist on reload"],
  ["Profile & Wishlist", "Change password", "Regression", "P2", "Enter current and new password, save", "Password updated; old password no longer works"],
  ["Profile & Wishlist", "Add product to wishlist", "Smoke", "P2", "Click heart icon on a product", "Product appears in /wishlist"],
  ["Profile & Wishlist", "Move wishlist item to cart", "Regression", "P3", "On /wishlist click Add to Cart", "Item added to cart; cart badge updates"],

  // ── Admin ──
  ["Admin", "Admin login and dashboard", "Smoke", "P0", `Login as ${A}, open /admin`, "Dashboard shows revenue chart, order and user statistics"],
  ["Admin", "Customer cannot access admin", "Regression", "P0", "Login as john@test.com and open /admin", "Access denied / redirected"],
  ["Admin", "Create product", "Regression", "P1", "Admin > Products > Add, fill fields, save", "Product listed in admin and visible in catalog"],
  ["Admin", "Edit and delete product", "Regression", "P2", "Edit price, save; then delete product", "Changes reflected; deleted product no longer in catalog"],
  ["Admin", "Update order status", "Regression", "P1", "Admin > Orders, change status to shipped", "Status saved; customer sees update on order detail"],
  ["Admin", "Manage coupons and users", "Regression", "P2", "Create a coupon; lock and unlock a user", "Coupon usable in cart; locked user cannot login"],

  // ── End-to-End & API ──
  ["E2E", "Guest to first order (happy path)", "E2E", "P0", "Register, verify, login, search product, add to cart, apply WELCOME10, checkout with 4111 card", "Order confirmation shown; order in history; stock reduced"],
  ["E2E", "Order lifecycle across roles", "E2E", "P0", "Customer places order; admin moves it to shipped and delivered; customer requests return", "Each status visible to customer in real time; final status return_requested"],
  ["E2E", "Failed payment then successful retry", "E2E", "P1", "Checkout with 4000 0000 0000 0002, then retry with 4111 1111 1111 1111", "First attempt declined, second succeeds; single order created"],
  ["E2E", "Wishlist to purchase", "E2E", "P1", "Wishlist a product, move to cart, checkout via COD, cancel order", "Order created then cancelled; stock restored"],
  ["API", "Health and login API", "Smoke", "P0", "GET /health; POST /api/auth/login with valid creds", "200 OK; login returns access and refresh tokens"],
  ["API", "Unauthorized API access", "Regression", "P1", "GET /api/orders without token; GET /api/orders/admin/all as customer", "401 without token; 403 for non-admin"],
  ["API", "Cart and order API flow", "Regression", "P1", "POST /api/cart/items, POST /api/orders, GET /api/orders/:id", "201 for creation; order retrievable with correct totals"],
  ["API", "Reset and seed data", "Sanity", "P2", "POST /api/qa/reset then /api/qa/seed", "Database reset; seed users, products and coupons available"],
];

const CASES = RAW.map(([module, title, type, priority, steps, expected], i) => ({
  id: `TC-${String(i + 1).padStart(3, "0")}`,
  module, title, type, priority, steps, expected,
}));

const TYPE_BADGE = { Sanity: "badge-info", Smoke: "badge-warning", Regression: "badge-neutral", E2E: "badge-success" };
const uniq = (k) => [...new Set(CASES.map((c) => c[k]))];

export default function TestCases() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [module, setModule] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CASES.filter((c) =>
      (!type || c.type === type) &&
      (!module || c.module === module) &&
      (!s || `${c.id} ${c.title} ${c.steps} ${c.expected}`.toLowerCase().includes(s))
    );
  }, [q, type, module]);

  return (
    <div style={{ padding: "32px 0" }} data-testid="testcases-page">
      <div className="container">
        <h1 style={{ marginBottom: 4 }}>Test Cases</h1>
        <p style={{ marginBottom: 16 }} data-testid="testcases-count">
          Showing {rows.length} of {CASES.length} test cases
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <input className="form-control" style={{ maxWidth: 280 }} placeholder="Search test cases…"
            value={q} onChange={(e) => setQ(e.target.value)} data-testid="testcases-search" />
          <select className="form-control" style={{ maxWidth: 180 }} value={type}
            onChange={(e) => setType(e.target.value)} data-testid="testcases-type-filter">
            <option value="">All types</option>
            {uniq("type").map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 220 }} value={module}
            onChange={(e) => setModule(e.target.value)} data-testid="testcases-module-filter">
            <option value="">All modules</option>
            {uniq("module").map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }} data-testid="testcases-table">
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                {["ID", "Module", "Title", "Type", "Priority", "Steps", "Expected Result"].map((h) => (
                  <th key={h} style={{ padding: 8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }} data-testid={`testcase-${c.id}`}>
                  <td style={{ padding: 8, whiteSpace: "nowrap" }}>{c.id}</td>
                  <td style={{ padding: 8 }}>{c.module}</td>
                  <td style={{ padding: 8, fontWeight: 600 }}>{c.title}</td>
                  <td style={{ padding: 8 }}><span className={`badge ${TYPE_BADGE[c.type]}`}>{c.type}</span></td>
                  <td style={{ padding: 8 }}>{c.priority}</td>
                  <td style={{ padding: 8 }}>{c.steps}</td>
                  <td style={{ padding: 8 }}>{c.expected}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 16 }}>No test cases match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
