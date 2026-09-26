# 🛍 ShopQA - E-Commerce Platform for QA Automation Practice

A complete, production-grade e-commerce web application built specifically for QA engineers to practice **UI automation**, **API testing**, **database testing**, and **CI/CD pipeline** work.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SHOPQA PLATFORM                       │
├──────────────┬──────────────────┬───────────────────────┤
│   Frontend   │     Backend      │      Database         │
│  React 18    │  Node.js/Express │    PostgreSQL 16       │
│  Port: 3000  │  Port: 5000      │    Port: 5432         │
├──────────────┴──────────────────┴───────────────────────┤
│            API Documentation: /api-docs                  │
│            Health Check:       /health                   │
│            QA Helpers:         /api/qa/*                 │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Option 1: Docker Compose (Recommended)
```bash
git clone https://github.com/your-org/shopqa
cd shopqa
docker-compose up -d
# Seed the database
curl -X POST http://localhost:5000/api/qa/seed
# Open: http://localhost:3000
```

### Option 2: Local Development
```bash
# 1. Start PostgreSQL
createdb shopqa

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm start

# 4. Seed database
curl -X POST http://localhost:5000/api/qa/seed
```

---

## 🔐 Test Credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | admin@shopqa.com | Password123! | Full admin access |
| **Customer 1** | john@test.com | Password123! | Regular customer |
| **Customer 2** | jane@test.com | Password123! | Regular customer |
| **Customer 3** | bob@test.com | Password123! | For lockout testing |

---

## 💳 Payment Test Cards

| Card Number | Expected Result |
|-------------|----------------|
| `4111 1111 1111 1111` | ✅ Payment Success |
| `4000 0000 0000 0002` | ❌ Insufficient Funds |
| `4000 0000 0000 0069` | ❌ Card Expired |
| `4000 0000 0000 9995` | ❌ Do Not Honor |

**UPI Testing:**
- Any valid UPI ID → Success
- `fail@upi` → Payment failure

---

## 🧪 Test Scenarios by Module

### 1. Authentication

| Scenario | Steps | Expected |
|----------|-------|----------|
| Valid login | Login with john@test.com/Password123! | Redirect to home |
| Wrong password | Enter wrong password | Error + attempts remaining |
| Account lockout | Fail login 5 times | Account locked for 30 mins |
| Unverified email | Register but don't verify | EMAIL_NOT_VERIFIED error |
| Verify email (any environment) | Register, then `GET /api/qa/users/{email}/verification-token`, then `GET /api/auth/verify-email/{token}` | Token returned (works even with `NODE_ENV=production`); status becomes `active`; login succeeds |
| Token expiry | Use `/api/qa/users/:id/expire-tokens` | 401 on next request |
| Social login | Click Google/GitHub button | Simulated social auth |
| Forgot password | Request reset, use `/api/auth/reset-password` | Password changed |
| Register with address | Check "Add a delivery address now" on `/register` and fill it in | Address saved as the account's default; appears in Profile → Addresses and pre-fills checkout |
| Register without address | Leave the address checkbox unchecked | Account created with no saved address (optional, doesn't block registration) |
| Change password | Profile → Security, enter correct current + valid new password | Success; old password stops working; other sessions signed out |
| Change password, wrong current password | Enter an incorrect current password | 401 `INVALID_PASSWORD`; inline error; password unchanged |
| Change password, weak new password | Enter a new password missing upper/lower/digit | Inline validation error; no request sent |

### 2. Product Catalog

| Scenario | UI Elements | Notes |
|----------|-------------|-------|
| Category filter | Radio buttons in sidebar | URL updates with `?category=` |
| Price range | Number inputs + radio ranges | `minPrice` & `maxPrice` params |
| Sort products | Dynamic dropdown | 6 sort options |
| Search | Search bar in navbar | Full-text search |
| Search with spacing differences | Search `i phone` or `mac book` | Matches `iPhone 15 Pro` / `MacBook Air M3` (whitespace-insensitive on name/brand) |
| Infinite scroll | Toggle checkbox | Loads more on scroll |
| Lazy loading | Skeleton cards | Visible during fetch |
| Out of stock | Overlay badge + disabled button | `stock = 0` |
| Description tab | Product detail page | Full multi-sentence description for all 50 seeded products |
| Specifications tab | Product detail page | Per-product key/value spec sheet (display, material, warranty, etc.) plus brand/SKU/weight/stock |
| Reviews tab | Product detail page | 4-8 seeded reviews per product (~300 total), `avg_rating`/`review_count` computed from real rows |

### 3. Shopping Cart

| Scenario | Expected |
|----------|----------|
| Add to cart (logged in) | Cart count increments, toast shown |
| Add to cart (guest) | Redirect to login |
| Add out-of-stock item | OUT_OF_STOCK error |
| Exceed available quantity | INSUFFICIENT_STOCK error |
| Apply WELCOME10 coupon | 10% discount applied |
| Apply EXPIRED50 coupon | INVALID_COUPON error |
| Apply MAXUSED coupon | COUPON_EXHAUSTED error |
| Free shipping above ₹500 | Shipping = ₹0 |

### 4. Checkout Multi-Step Form

| Step | Form Fields | Validations |
|------|-------------|-------------|
| Step 1: Shipping | Name, Phone, Address, City, State, Pincode | Required fields, 6-digit pincode. Saved addresses (from Profile or registration) are listed as pickable cards, with the default pre-selected; editing any field switches to a one-off manual entry |
| Step 2: Delivery | Radio (Standard/Express/Overnight/Pickup) | Date picker for scheduled |
| Step 3: Payment | Card/UPI/PayPal/COD | Card number format, CVV |
| Step 4: Review | Summary of all steps | Confirm before placing |

### 5. Address Management (Profile → Addresses)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Add address | Profile → Addresses → "+ Add New Address", fill required fields, save | New card appears in the list |
| First address becomes default | Add an address when none exist | "Set as default address" is pre-checked and saved as default |
| Edit address | Click "Edit" on a card, change fields, save | Card reflects updated values |
| Delete address | Click "Delete" on a card | Address removed from the list and from checkout |
| Set default | Click "Set Default" on a non-default card | That card now shows the "Default" badge; the previous default is unset (only one default at a time) |
| Add n addresses | Repeat "Add New Address" | No upper limit — add as many as needed |
| Use at checkout | Go to `/checkout` with saved addresses | Default address auto-selected; any saved address can be picked, or fields can be edited/typed manually for a one-off address |

### 6. Complex UI Elements

| Element | Location | Test Method |
|---------|----------|-------------|
| Date Picker | Checkout → Delivery step | Click, navigate months, select |
| Infinite Scroll | Products page (toggle) | Scroll to bottom |
| Dynamic Dropdown | Sort select, State dropdown | Select options |
| Modal Popup | Admin product form | Open, ESC close, backdrop click |
| Drag & Drop | Image upload in admin | `dragover`, `drop` events |
| iFrame Payment | Checkout → Card payment | `iframe` locator |
| Shadow DOM | (future enhancement) | `pierce` selector |
| File Upload | Admin product images | `setInputFiles()` |
| Multi-step Form | Checkout flow | Forward/Back navigation |
| Lazy Loading | Product list page | Skeleton → actual content |

---
Test coverage : https://nagendra-shopqa-testcase-coverage.netlify.app/

In-app test case catalog: open `/testcases` on the running frontend for a searchable,
filterable table of 60 sanity/smoke/regression/E2E cases covering every module below.

## 🔌 API Reference

### Base URL
```
http://localhost:5000/api
```

### Key Endpoints

```http
# Auth
POST /auth/register     # accepts an optional `address` object, saved as the default address
POST /auth/login
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/verify-email/:token

# Products
GET  /products           # ?page, limit, search, category, sort, minPrice, maxPrice, rating, inStock
GET  /products/:id       # or /products/:slug — includes specifications{} and reviews[]
GET  /products/featured
GET  /products/categories
GET  /products/images/:id  # uploaded admin image bytes, stored in Postgres (not local disk)

# Cart
GET    /cart
POST   /cart/items       # { productId, quantity }
PUT    /cart/items/:id   # { quantity }
DELETE /cart/items/:id
POST   /cart/coupon      # { code }
DELETE /cart/coupon

# Orders
POST   /orders           # Create from cart
GET    /orders           # User's orders
GET    /orders/:id
POST   /orders/:id/cancel
POST   /orders/:id/return
GET    /orders/:id/track
GET    /orders/:id/invoice

# Reviews
GET    /reviews?productId=
POST   /reviews
PUT    /reviews/:id
DELETE /reviews/:id

# Users — Profile & Security
GET    /users/me
PUT    /users/me                   # { firstName, lastName, phone }
PUT    /users/password             # { currentPassword, newPassword } — revokes other sessions on success

# Users — Addresses (any number per user, one marked default)
GET    /users/addresses
POST   /users/addresses            # { label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault }
PUT    /users/addresses/:id        # update any field, including isDefault
PATCH  /users/addresses/:id/default  # mark this one as the default, unsetting the others
DELETE /users/addresses/:id

# Admin
GET    /admin/dashboard
GET    /admin/users
PATCH  /admin/users/:id  # { status: 'banned' | 'active' }
POST   /admin/coupons
GET    /admin/analytics/revenue

# QA Helpers (non-production only, unless noted)
GET    /qa/status
POST   /qa/seed
POST   /qa/reset
PATCH  /qa/products/:id/stock  # { stock: 0 }
POST   /qa/orders/generate     # { userId, count }
POST   /qa/payment/mock        # { outcome: 'success'|'fail', orderId }
PATCH  /qa/users/:id/lock      # { lock: true|false }
POST   /qa/users/:id/expire-tokens
GET    /qa/users/:email/verification-token  # works even in production — see note below
```

> **`GET /qa/users/:email/verification-token`** is the one QA helper that is *not* disabled in
> production. Registration only echoes `verificationToken` in its own response when
> `NODE_ENV !== 'production'`, and this app has no real email sender wired up — so on a
> production deploy this is the only way to complete register → verify → login end to end.
> It 404s once the account is no longer `pending_verification`, and never exposes anything for
> an already-verified account.

---

## 🤖 Automation Test Execution

### Playwright E2E Tests
```bash
# Install
cd frontend && npm ci && npx playwright install

# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/playwright/shopqa.spec.ts

# Run with browser UI (headed mode)
npx playwright test --headed

# Run specific test
npx playwright test -g "should login as customer"

# Generate HTML report
npx playwright show-report

# Record test (codegen)
npx playwright codegen http://localhost:3000
```

### API Tests (Jest + Supertest)
```bash
cd backend

# Run all API tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch

# Run specific test file
npm test -- tests/api/api.test.js
```

---

## 🔧 QA Helper API Usage

```bash
# Reset all test data (orders, carts, reviews)
curl -X POST http://localhost:5000/api/qa/reset

# Seed 50 products (full descriptions, specs, weight, SKU), 10 users, coupons, ~300 dummy reviews
curl -X POST http://localhost:5000/api/qa/seed

# Set a product out of stock
curl -X PATCH http://localhost:5000/api/qa/products/{id}/stock \
  -H "Content-Type: application/json" \
  -d '{"stock": 0}'

# Generate 5 fake orders for a user
curl -X POST http://localhost:5000/api/qa/orders/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "{userId}", "count": 5}'

# Lock a user account
curl -X PATCH http://localhost:5000/api/qa/users/{id}/lock \
  -H "Content-Type: application/json" \
  -d '{"lock": true}'

# Expire all tokens for a user (simulate session expiry)
curl -X POST http://localhost:5000/api/qa/users/{id}/expire-tokens

# Mock payment success
curl -X POST http://localhost:5000/api/qa/payment/mock \
  -H "Content-Type: application/json" \
  -d '{"outcome": "success", "orderId": "{orderId}"}'
```

---

## 🐛 Known Bugs (For Testing Practice)

These intentional bugs are included for QA practice:

1. **Cart quantity** — No upper limit validation on frontend (can exceed stock if updated rapidly)
2. **Search** — Diacritics/special characters not normalized
3. **Coupon** — `FREESHIP` coupon works even on already-free orders
4. **Product images** — Gallery shows fallback images for seeded products (no actual images)
5. **Mobile nav** — Category bar hidden on mobile (accessibility issue)
6. **Order tracking** — Timeline shows null entries for future statuses
7. **Admin pagination** — No pagination on users list
8. **Password reset** — Reset token not invalidated after first use (in some edge cases)

### ✅ Recently fixed (not test bugs, just history)

- **Admin-uploaded product images going broken after a while** — images were written to the
  backend's local disk (`backend/uploads/products/`), which most PaaS hosts wipe on every
  restart/redeploy. Fixed by storing uploads in Postgres (`product_images` table) and serving
  them from `GET /api/products/images/:id` instead.

---

## 📊 Database Schema

```sql
-- Key tables:
users               -- Authentication, roles, status
categories          -- Product taxonomy  
products            -- Catalog: stock, ratings, sku, weight, specifications (jsonb)
product_variants    -- Size/color variants
product_images      -- Uploaded admin image bytes (bytea) — survives backend restarts
addresses           -- Shipping addresses, any number per user, one is_default
coupons             -- Discount codes with rules
carts + cart_items  -- Shopping cart
orders + order_items -- Placed orders
order_status_history -- Order tracking timeline
reviews             -- Ratings and reviews
refresh_tokens      -- JWT refresh token storage
wishlists           -- User saved products
audit_logs          -- Admin action trail
```

---

## 📁 Project Structure

```
shopqa/
├── backend/
│   ├── src/
│   │   ├── config/       # DB, Swagger setup
│   │   ├── middleware/   # Auth, validation
│   │   ├── routes/       # All API routes
│   │   └── server.js     # Express app
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth, Cart context
│   │   ├── pages/        # Route pages
│   │   ├── styles/       # Global CSS
│   │   └── utils/        # API client
│   ├── Dockerfile
│   └── package.json
├── tests/
│   ├── playwright/       # E2E browser tests
│   └── api/             # API integration tests
├── docker-compose.yml
├── playwright.config.ts
└── .github/
    └── workflows/
        └── ci-cd.yml     # GitHub Actions pipeline
```

---

## 🤝 Contributing

1. Fork and clone
2. Create feature branch: `git checkout -b feature/new-scenario`
3. Add tests before code (TDD)
4. Ensure all existing tests pass
5. Submit PR with description of new test scenarios added
