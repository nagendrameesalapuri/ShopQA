import React, { useMemo, useState } from "react";
import "../styles/testcases.css";

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
  ["Authentication", "Register with a delivery address", "Smoke", "P1", "On /register, check \"Add a delivery address now\", fill address fields, submit", "Account created; address saved as default; visible in Profile → Addresses and pre-filled at checkout"],
  ["Authentication", "Register with invalid address fields", "Regression", "P2", "Check the address toggle, leave City/State empty or enter a non-6-digit postal code, submit", "Inline validation errors on the address fields; form not submitted"],
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
  ["Product Detail", "View product specifications", "Regression", "P2", "Open any seeded product, click the Specifications tab", "Category-specific key/value spec rows shown (display, material, warranty, etc.) alongside brand, SKU, weight and stock"],
  ["Product Detail", "Seeded product has reviews", "Sanity", "P2", "Open any seeded product, click the Reviews tab", "4-8 reviews shown with titles, ratings and reviewer names; header rating matches the review count"],

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
  ["Checkout", "Default address auto-selected", "Smoke", "P1", "As a user with a default saved address, open /checkout", "Shipping step opens with the default address card pre-selected and its fields pre-filled"],
  ["Checkout", "Pick a different saved address", "Regression", "P2", "On the shipping step, click a non-default saved address card", "That card highlights as selected; form fields update to match it"],
  ["Checkout", "Override saved address with manual entry", "Regression", "P2", "With a saved address selected, edit any shipping field by hand", "Selected card deselects; typed values are used for this order only"],
  ["Checkout", "Address validation", "Regression", "P1", "Submit checkout with empty/invalid address and pincode", "Field-level validation errors; order not placed"],
  ["Checkout", "Pay with success card 4111 1111 1111 1111", "Smoke", "P0", "Enter card, place order", "Payment success; redirected to order confirmation"],
  ["Checkout", "Pay with insufficient funds card", "Regression", "P1", "Use 4000 0000 0000 0002", "Payment declined message; order not confirmed; cart retained"],
  ["Checkout", "Pay with expired card", "Regression", "P2", "Use 4000 0000 0000 0069", "Card expired error displayed"],
  ["Checkout", "UPI payment failure", "Regression", "P2", "Choose UPI and enter fail@upi", "Payment failure shown; user can retry"],
  ["Checkout", "Cash on delivery order", "Regression", "P2", "Select COD and place order", "Order created with pending payment status"],

  // ── Address Management ──
  ["Address Management", "Add a new address", "Smoke", "P1", "Profile → Addresses → \"+ Add New Address\", fill required fields, save", "New address card appears in the list"],
  ["Address Management", "First address defaults automatically", "Regression", "P2", "Add an address when the user has none saved yet", "\"Set as default address\" is pre-checked; saved card shows the Default badge"],
  ["Address Management", "Add a second, non-default address", "Regression", "P2", "With one default address already saved, add another without checking default", "Both addresses listed; only the first keeps the Default badge"],
  ["Address Management", "Edit an address", "Regression", "P2", "Click Edit on a card, change city/pincode, save", "Card reflects the updated values immediately"],
  ["Address Management", "Set a different address as default", "Regression", "P2", "Click \"Set Default\" on a non-default card", "That card now shows Default; the previously default card loses the badge"],
  ["Address Management", "Delete an address", "Regression", "P2", "Click Delete on a card", "Address removed from the list and no longer offered at checkout"],
  ["Address Management", "Add multiple addresses", "Regression", "P3", "Repeat \"Add New Address\" 4-5 times with different labels", "All addresses listed with no upper limit; each editable/deletable independently"],

  // ── Orders ──
  ["Orders", "Order history list", "Sanity", "P0", "Open /orders", "User's orders listed with number, date, status, total"],
  ["Orders", "View order detail", "Smoke", "P1", "Click an order", "Items, address, payment and status timeline displayed"],
  ["Orders", "Cancel a pending order", "Regression", "P1", "Open pending order, click Cancel, confirm", "Status becomes cancelled; stock restored"],
  ["Orders", "Return a delivered order", "Regression", "P2", "Open delivered order, request return", "Status becomes return_requested"],
  ["Orders", "Download invoice", "Regression", "P3", "Click Download Invoice on an order", "Invoice PDF downloads with correct order data"],

  // ── Profile & Wishlist ──
  ["Profile & Wishlist", "Update profile", "Regression", "P2", "Open /profile, change name/phone, save", "Success toast; values persist on reload"],
  ["Profile & Wishlist", "Change password", "Smoke", "P1", "Profile → Security, enter correct current password and a valid new password, save", "Success toast; old password no longer works; other logged-in sessions are signed out"],
  ["Profile & Wishlist", "Change password with wrong current password", "Regression", "P1", "Profile → Security, enter an incorrect current password, submit", "401 INVALID_PASSWORD; inline error on Current Password field; password unchanged"],
  ["Profile & Wishlist", "Change password with weak new password", "Regression", "P2", "Enter correct current password, new password 'abc123' (no uppercase), submit", "Inline validation error on New Password; request not sent"],
  ["Profile & Wishlist", "Add product to wishlist", "Smoke", "P2", "Click heart icon on a product", "Product appears in /wishlist"],
  ["Profile & Wishlist", "Move wishlist item to cart", "Regression", "P3", "On /wishlist click Add to Cart", "Item added to cart; cart badge updates"],

  // ── Admin ──
  ["Admin", "Admin login and dashboard", "Smoke", "P0", `Login as ${A}, open /admin`, "Dashboard shows revenue chart, order and user statistics"],
  ["Admin", "Customer cannot access admin", "Regression", "P0", "Login as john@test.com and open /admin", "Access denied / redirected"],
  ["Admin", "Create product", "Regression", "P1", "Admin > Products > Add, fill fields, save", "Product listed in admin and visible in catalog"],
  ["Admin", "Edit and delete product", "Regression", "P2", "Edit price, save; then delete product", "Changes reflected; deleted product no longer in catalog"],
  ["Admin", "Update order status", "Regression", "P1", "Admin > Orders, change status to shipped", "Status saved; customer sees update on order detail"],
  ["Admin", "Manage coupons and users", "Regression", "P2", "Create a coupon; lock and unlock a user", "Coupon usable in cart; locked user cannot login"],
  ["Admin", "Uploaded product image survives a backend restart", "Regression", "P1", "Admin uploads a product image, note it loads; restart/redeploy the backend; reload the product page", "Image still loads (served from /api/products/images/:id, stored in Postgres — not the app server's local disk, so it isn't wiped on restart)"],

  // ── End-to-End & API ──
  ["E2E", "Guest to first order (happy path)", "E2E", "P0", "Register, verify, login, search product, add to cart, apply WELCOME10, checkout with 4111 card", "Order confirmation shown; order in history; stock reduced"],
  ["E2E", "Register with address straight to checkout", "E2E", "P1", "Register with the delivery-address toggle filled in, verify, login, add a product to cart, open checkout", "Registered address appears pre-selected as default on the shipping step with no manual re-entry needed"],
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

const TYPES = ["Sanity", "Smoke", "Regression", "E2E"];
const MODULES = [...new Set(CASES.map((c) => c.module))];

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

  const filtered = q || type || module;
  const reset = () => { setQ(""); setType(""); setModule(""); };

  return (
    <div className="tc-page" data-testid="testcases-page">
      <div className="container">
        <header className="tc-hero">
          <span className="tc-eyebrow">QA Test Suite</span>
          <h1>Test Cases</h1>
          <p>
            {CASES.length} curated sanity, smoke, regression and end-to-end scenarios covering
            every ShopQA module, from authentication to admin.
          </p>
        </header>

        <div className="tc-stats">
          <button type="button" className={`tc-stat tc-t-All${!type ? " active" : ""}`}
            onClick={() => setType("")} data-testid="testcases-stat-all">
            <div className="tc-stat-num">{CASES.length}</div>
            <div className="tc-stat-label">All test cases</div>
          </button>
          {TYPES.map((t) => (
            <button type="button" key={t} className={`tc-stat tc-t-${t}${type === t ? " active" : ""}`}
              onClick={() => setType(type === t ? "" : t)} data-testid={`testcases-stat-${t}`}>
              <div className="tc-stat-num">{CASES.filter((c) => c.type === t).length}</div>
              <div className="tc-stat-label">{t}</div>
            </button>
          ))}
        </div>

        <div className="tc-toolbar">
          <div className="tc-search">
            <span aria-hidden="true">🔍</span>
            <input className="tc-input" placeholder="Search by ID, title, steps…" value={q}
              onChange={(e) => setQ(e.target.value)} data-testid="testcases-search" />
          </div>
          <select className="tc-select" value={type} onChange={(e) => setType(e.target.value)}
            data-testid="testcases-type-filter">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="tc-select" value={module} onChange={(e) => setModule(e.target.value)}
            data-testid="testcases-module-filter">
            <option value="">All modules</option>
            {MODULES.map((m) => <option key={m}>{m}</option>)}
          </select>
          {filtered && <button type="button" className="tc-reset" onClick={reset}>Clear filters</button>}
        </div>

        <p className="tc-count" data-testid="testcases-count">
          Showing <b>{rows.length}</b> of <b>{CASES.length}</b> test cases
        </p>

        <div className="tc-card">
          <div className="tc-scroll">
            <table className="tc-table" data-testid="testcases-table">
              <thead>
                <tr>
                  {["ID", "Module", "Title", "Type", "Priority", "Steps", "Expected Result"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} data-testid={`testcase-${c.id}`}>
                    <td><span className="tc-id">{c.id}</span></td>
                    <td><span className="tc-module">{c.module}</span></td>
                    <td className="tc-title">{c.title}</td>
                    <td><span className={`tc-pill tc-t-${c.type}`}>{c.type}</span></td>
                    <td><span className={`tc-prio tc-p-${c.priority}`}>{c.priority}</span></td>
                    <td>{c.steps}</td>
                    <td>{c.expected}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="tc-empty">No test cases match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
