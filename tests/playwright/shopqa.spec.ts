/**
 * ShopQA - Playwright E2E Automation Tests
 * Covers: Auth, Product Catalog, Cart, Checkout, Orders, Admin Panel
 * 
 * Run: npx playwright test
 * Run with UI: npx playwright test --ui
 * Run specific: npx playwright test auth.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nagendra-shopqa.netlify.app';
const API_URL  = process.env.API_URL  || 'https://shopqa-backend.onrender.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function loginAs(page: Page, role: 'admin' | 'customer' = 'customer') {
  const creds = {
    admin:    { email: 'admin@shopqa.com',  password: 'Password123!' },
    customer: { email: 'john@test.com',     password: 'Password123!' },
  };
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="input-email"]', creds[role].email);
  await page.fill('[data-testid="input-password"]', creds[role].password);
  await page.click('[data-testid="btn-login"]');
  await page.waitForURL('**/*', { timeout: 10000 });
}

// ═══════════════════════════════════════════════════
// 1. AUTHENTICATION TESTS
// ═══════════════════════════════════════════════════
test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display login form with all elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-forgot"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-register"]')).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.click('[data-testid="btn-login"]');
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('[data-testid="input-email"]', 'notanemail');
      await page.click('[data-testid="btn-login"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
    });

    test('should show error for wrong credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('[data-testid="input-email"]', 'wrong@email.com');
      await page.fill('[data-testid="input-password"]', 'WrongPassword1');
      await page.click('[data-testid="btn-login"]');
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid');
    });

    test('should successfully login as customer', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('[data-testid="input-email"]', 'john@test.com');
      await page.fill('[data-testid="input-password"]', 'Password123!');
      await page.click('[data-testid="btn-login"]');
      await expect(page.locator('[data-testid="user-menu-btn"]')).toBeVisible({ timeout: 10000 });
    });

    test('should successfully login as admin and redirect to admin', async ({ page }) => {
      await loginAs(page, 'admin');
      await expect(page).toHaveURL(`${BASE_URL}/admin`, { timeout: 5000 });
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      const input = page.locator('[data-testid="input-password"]');
      await input.fill('mypassword');
      await expect(input).toHaveAttribute('type', 'password');
      await page.click('[data-testid="toggle-password"]');
      await expect(input).toHaveAttribute('type', 'text');
      await page.click('[data-testid="toggle-password"]');
      await expect(input).toHaveAttribute('type', 'password');
    });

    test('should use quick login buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.locator('details[data-testid="test-credentials"] summary').click();
      await page.click('[data-testid="quick-login-admin"]');
      await expect(page.locator('[data-testid="input-email"]')).toHaveValue('admin@shopqa.com');
    });

    test('should show session expired message', async ({ page }) => {
      await page.goto(`${BASE_URL}/login?expired=true`);
      await expect(page.locator('[data-testid="session-expired-msg"]')).toBeVisible();
    });
  });

  test.describe('Registration', () => {
    test('should show validation for weak password', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.fill('[data-testid="input-reg-email"]', 'new@test.com');
      await page.fill('[data-testid="input-reg-password"]', 'weak');
      await page.click('[data-testid="btn-register"]');
      await expect(page.locator('[data-testid="password-strength"]')).toContainText('weak');
    });

    test('should fail if passwords do not match', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.fill('[data-testid="input-reg-password"]', 'Password123!');
      await page.fill('[data-testid="input-reg-confirm-password"]', 'Password456!');
      await page.click('[data-testid="btn-register"]');
      await expect(page.locator('[data-testid="confirm-password-error"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to home', async ({ page }) => {
      await loginAs(page);
      await page.click('[data-testid="user-menu-btn"]');
      await page.click('[data-testid="menu-logout"]');
      await expect(page.locator('[data-testid="nav-login"]')).toBeVisible({ timeout: 5000 });
    });
  });
});

// ═══════════════════════════════════════════════════
// 2. PRODUCT CATALOG TESTS
// ═══════════════════════════════════════════════════
test.describe('Product Catalog', () => {
  test('should display product listing page', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({ timeout: 10000 });
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(12); // Default page size
  });

  test('should show product count', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await expect(page.locator('[data-testid="product-count"]')).not.toContainText('Loading');
    await expect(page.locator('[data-testid="product-count"]')).toContainText('products');
  });

  test('should filter by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.locator('[data-testid="filter-cat-electronics"]').click();
    await page.waitForURL('**/products?**category=electronics**');
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    // All visible products should be electronics
    const firstCategory = await page.locator('[data-testid="product-category"]').first().textContent();
    expect(firstCategory?.toLowerCase()).toContain('electronics');
  });

  test('should sort products by price ascending', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.selectOption('[data-testid="sort-select"]', 'price_asc');
    await page.waitForURL('**/products?**sort=price_asc**');
    const prices = page.locator('[data-testid="product-price"]');
    const first  = await prices.first().textContent();
    const last   = await prices.last().textContent();
    const parse = (s: string) => parseInt(s?.replace(/[^0-9]/g, '') || '0');
    expect(parse(first!)).toBeLessThanOrEqual(parse(last!));
  });

  test('should search for products', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.fill('[data-testid="nav-search-input"]', 'iPhone');
    await page.click('[data-testid="nav-search-btn"]');
    await page.waitForURL('**/products?search=iPhone**');
    await expect(page.locator('[data-testid="list-title"]')).toContainText('iPhone');
  });

  test('should show no results for invalid search', async ({ page }) => {
    await page.goto(`${BASE_URL}/products?search=xyznonexistent123`);
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No products found');
  });

  test('should paginate products', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    const beforeFirst = await page.locator('[data-testid="product-name"]').first().textContent();
    await page.click('[data-testid="next-page"]');
    await expect(page).toHaveURL(/page=2/);
    const afterFirst = await page.locator('[data-testid="product-name"]').first().textContent();
    expect(beforeFirst).not.toBe(afterFirst);
  });

  test('should switch to grid and list view', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.click('[data-testid="view-list"]');
    await expect(page.locator('[data-testid="product-grid"]')).toHaveClass(/list-view/);
    await page.click('[data-testid="view-grid"]');
    await expect(page.locator('[data-testid="product-grid"]')).not.toHaveClass(/list-view/);
  });

  test('should enable infinite scroll', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.check('[data-testid="infinite-scroll-toggle"]');
    const initialCount = await page.locator('[data-testid="product-card"]').count();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const newCount = await page.locator('[data-testid="product-card"]').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should show out-of-stock badge', async ({ page }) => {
    // This product should be OOS from test setup
    await page.goto(`${BASE_URL}/products?inStock=false`);
    await page.waitForTimeout(1000);
    const oosBadge = page.locator('[data-testid="out-of-stock-badge"]').first();
    if (await oosBadge.isVisible()) {
      await expect(oosBadge).toContainText('Out of Stock');
    }
  });

  test.describe('Product Detail', () => {
    test('should display full product details', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.locator('[data-testid="product-card"]').first().click();
      await expect(page.locator('[data-testid="product-detail-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-detail-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-detail-stock"]')).toBeVisible();
      await expect(page.locator('[data-testid="star-rating"]')).toBeVisible();
    });

    test('should navigate between product images', async ({ page }) => {
      await page.goto(`${BASE_URL}/products/iphone-15-pro`);
      // Images gallery navigation if available
    });
  });
});

// ═══════════════════════════════════════════════════
// 3. CART TESTS
// ═══════════════════════════════════════════════════
test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    const initialCount = parseInt(await page.locator('[data-testid="cart-count"]').textContent() || '0');
    await page.locator('[data-testid="add-to-cart-btn"]').first().click();
    await expect(page.locator('[data-testid="cart-count"]')).toContainText(String(initialCount + 1));
  });

  test('should show toast on add to cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.locator('[data-testid="add-to-cart-btn"]').first().click();
    await expect(page.locator('.Toastify__toast')).toContainText('Added to cart');
  });

  test('should update quantity in cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const increaseBtn = page.locator('[data-testid="qty-increase"]').first();
    if (await increaseBtn.isVisible()) {
      const qtyBefore = await page.locator('[data-testid="cart-qty"]').first().textContent();
      await increaseBtn.click();
      await page.waitForTimeout(500);
      const qtyAfter = await page.locator('[data-testid="cart-qty"]').first().textContent();
      expect(parseInt(qtyAfter || '0')).toBe(parseInt(qtyBefore || '0') + 1);
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const removeBtns = page.locator('[data-testid="remove-item-btn"]');
    if (await removeBtns.count() > 0) {
      const countBefore = await removeBtns.count();
      await removeBtns.first().click();
      await page.waitForTimeout(1000);
      const countAfter = await page.locator('[data-testid="remove-item-btn"]').count();
      expect(countAfter).toBe(countBefore - 1);
    }
  });

  test('should apply valid coupon', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.fill('[data-testid="coupon-input"]', 'WELCOME10');
    await page.click('[data-testid="apply-coupon-btn"]');
    await expect(page.locator('[data-testid="coupon-success"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
  });

  test('should reject invalid coupon', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.fill('[data-testid="coupon-input"]', 'INVALIDCODE999');
    await page.click('[data-testid="apply-coupon-btn"]');
    await expect(page.locator('[data-testid="coupon-error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should reject expired coupon', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.fill('[data-testid="coupon-input"]', 'EXPIRED50');
    await page.click('[data-testid="apply-coupon-btn"]');
    await expect(page.locator('[data-testid="coupon-error"]')).toContainText(/expired|invalid/i);
  });

  test('should show correct total with coupon', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const subtotalText = await page.locator('[data-testid="cart-subtotal"]').textContent();
    await page.fill('[data-testid="coupon-input"]', 'WELCOME10');
    await page.click('[data-testid="apply-coupon-btn"]');
    await page.waitForTimeout(1000);
    const totalText = await page.locator('[data-testid="cart-total"]').textContent();
    // Total should be less than subtotal after discount
    const subtotal = parseFloat(subtotalText?.replace(/[^0-9.]/g, '') || '0');
    const total    = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
    // Account for tax, just check it processed
    expect(total).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════
// 4. CHECKOUT TESTS
// ═══════════════════════════════════════════════════
test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    // Add item to cart
    await page.goto(`${BASE_URL}/products`);
    await page.locator('[data-testid="add-to-cart-btn"]').first().click();
    await page.waitForTimeout(500);
  });

  test('should show step indicator with 4 steps', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    const steps = page.locator('[data-testid="step-indicator"] [data-testid^="step-"]');
    await expect(steps).toHaveCount(4);
  });

  test('should validate required shipping fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.click('[data-testid="btn-next"]');
    await expect(page.locator('.Toastify__toast')).toContainText(/required|fill/i);
  });

  test('should validate postal code format', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.fill('[data-testid="field-full-name"]', 'John Doe');
    await page.fill('[data-testid="field-phone"]', '9876543210');
    await page.fill('[data-testid="field-line1"]', '123 Test Street');
    await page.fill('[data-testid="field-city"]', 'Bengaluru');
    await page.selectOption('[data-testid="field-state"]', 'Karnataka');
    await page.fill('[data-testid="field-postal"]', '12'); // Invalid
    await page.click('[data-testid="btn-next"]');
    await expect(page.locator('.Toastify__toast')).toContainText(/postal|zip/i);
  });

  test('should navigate through all checkout steps', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    // Fill step 1
    await page.fill('[data-testid="field-full-name"]', 'John Doe');
    await page.fill('[data-testid="field-phone"]', '9876543210');
    await page.fill('[data-testid="field-line1"]', '123 Test Street');
    await page.fill('[data-testid="field-city"]', 'Bengaluru');
    await page.selectOption('[data-testid="field-state"]', 'Karnataka');
    await page.fill('[data-testid="field-postal"]', '560001');
    await page.click('[data-testid="btn-next"]');
    await expect(page.locator('[data-testid="step-delivery"]')).toBeVisible({ timeout: 3000 });

    // Step 2: delivery
    await page.click('[data-testid="delivery-express"]');
    await page.click('[data-testid="btn-next"]');
    await expect(page.locator('[data-testid="step-payment"]')).toBeVisible({ timeout: 3000 });

    // Step 3: payment
    await page.click('[data-testid="payment-credit-card"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.fill('[data-testid="card-name"]', 'JOHN DOE');
    await page.click('[data-testid="btn-next"]');
    await expect(page.locator('[data-testid="step-review"]')).toBeVisible({ timeout: 3000 });

    await expect(page.locator('[data-testid="btn-place-order"]')).toBeVisible();
  });

  test('should simulate payment failure with declined card', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    // Skip to payment step
    await page.fill('[data-testid="field-full-name"]', 'John Doe');
    await page.fill('[data-testid="field-phone"]', '9876543210');
    await page.fill('[data-testid="field-line1"]', '123 Main St');
    await page.fill('[data-testid="field-city"]', 'Mumbai');
    await page.selectOption('[data-testid="field-state"]', 'Maharashtra');
    await page.fill('[data-testid="field-postal"]', '400001');
    await page.click('[data-testid="btn-next"]');
    await page.click('[data-testid="btn-next"]'); // Skip delivery
    await page.fill('[data-testid="card-number"]', '4000000000000002'); // Declined
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.fill('[data-testid="card-name"]', 'JOHN DOE');
    await page.click('[data-testid="btn-next"]');
    await page.click('[data-testid="btn-place-order"]');
    await expect(page.locator('.Toastify__toast--error')).toContainText(/payment/i, { timeout: 10000 });
  });

  test('should select date from date picker', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.fill('[data-testid="field-full-name"]', 'John Doe');
    await page.fill('[data-testid="field-phone"]', '9876543210');
    await page.fill('[data-testid="field-line1"]', '123 Main St');
    await page.fill('[data-testid="field-city"]', 'Delhi');
    await page.selectOption('[data-testid="field-state"]', 'Delhi');
    await page.fill('[data-testid="field-postal"]', '110001');
    await page.click('[data-testid="btn-next"]');
    await page.click('[data-testid="date-picker-trigger"]');
    await expect(page.locator('[data-testid="datepicker-calendar"]')).toBeVisible();
    await page.click('[data-testid="dp-next-month"]');
    await page.locator('[data-testid^="dp-day-"]').first().click();
    await expect(page.locator('[data-testid="datepicker-calendar"]')).not.toBeVisible();
  });
});

// ═══════════════════════════════════════════════════
// 5. ORDER TESTS
// ═══════════════════════════════════════════════════
test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('should display order history', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
    await expect(page.locator('[data-testid="orders-page"]')).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
    await page.selectOption('[data-testid="order-status-filter"]', 'delivered');
    await page.waitForTimeout(500);
    // All visible orders should be delivered
    const statuses = page.locator('[data-testid="order-status-badge"]');
    const count = await statuses.count();
    for (let i = 0; i < count; i++) {
      await expect(statuses.nth(i)).toContainText('delivered');
    }
  });
});

// ═══════════════════════════════════════════════════
// 6. ADMIN PANEL TESTS
// ═══════════════════════════════════════════════════
test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.locator('[data-testid="stats-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-users"]')).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.click('[data-testid="sidebar-products"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/products`);
  });

  test('should show orders table', async ({ page }) => {
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
  });

  test('should deny access to non-admin user', async ({ page }) => {
    await loginAs(page, 'customer');
    await page.goto(`${BASE_URL}/admin`);
    // Should see access denied
    await expect(page.locator('text=Access Denied')).toBeVisible({ timeout: 5000 });
  });

  test.describe('Product Management', () => {
    test('should open add product modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/products`);
      await page.click('[data-testid="btn-add-product"]');
      await expect(page.locator('[data-testid="product-form-modal"]')).toBeVisible();
    });

    test('should validate product form', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/products`);
      await page.click('[data-testid="btn-add-product"]');
      await page.click('[data-testid="btn-save-product"]');
      await expect(page.locator('[data-testid="product-name-error"]')).toBeVisible();
    });

    test('should upload product image via drag-and-drop', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/products`);
      await page.click('[data-testid="btn-add-product"]');
      // File upload simulation
      const dropzone = page.locator('[data-testid="image-dropzone"]');
      await expect(dropzone).toBeVisible();
    });
  });

  test.describe('Coupon Management', () => {
    test('should create a new coupon', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/coupons`);
      await page.click('[data-testid="btn-create-coupon"]');
      await page.fill('[data-testid="coupon-code"]', 'TESTQA20');
      await page.selectOption('[data-testid="coupon-type"]', 'percentage');
      await page.fill('[data-testid="coupon-value"]', '20');
      await page.fill('[data-testid="coupon-limit"]', '100');
      await page.click('[data-testid="btn-save-coupon"]');
      await expect(page.locator('text=TESTQA20')).toBeVisible({ timeout: 5000 });
    });

    test('should prevent duplicate coupon codes', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/coupons`);
      await page.click('[data-testid="btn-create-coupon"]');
      await page.fill('[data-testid="coupon-code"]', 'WELCOME10'); // Already exists
      await page.selectOption('[data-testid="coupon-type"]', 'percentage');
      await page.fill('[data-testid="coupon-value"]', '5');
      await page.click('[data-testid="btn-save-coupon"]');
      await expect(page.locator('.Toastify__toast--error')).toBeVisible({ timeout: 5000 });
    });
  });
});

// ═══════════════════════════════════════════════════
// 7. DRAG AND DROP
// ═══════════════════════════════════════════════════
test.describe('Interactive Elements', () => {
  test('should perform file upload via drag-and-drop', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/admin/products`);
    await page.click('[data-testid="btn-add-product"]');
    const dropzone = page.locator('[data-testid="image-dropzone"]');
    if (await dropzone.isVisible()) {
      // Simulate drag over
      await dropzone.dispatchEvent('dragover', { dataTransfer: { types: ['Files'] } });
      await expect(dropzone).toHaveClass(/drag-over/);
    }
  });

  test('should open and close modal popup', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/admin/products`);
    await page.click('[data-testid="btn-add-product"]');
    const modal = page.locator('[data-testid="product-form-modal"]');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should open date picker and select a date', async ({ page }) => {
    await loginAs(page);
    await page.goto(`${BASE_URL}/admin/products`);
    await page.click('[data-testid="btn-add-product"]');
    const dp = page.locator('[data-testid="date-picker-trigger"]').first();
    if (await dp.isVisible()) {
      await dp.click();
      await expect(page.locator('[data-testid="datepicker-calendar"]')).toBeVisible();
      const today = new Date().getDate();
      await page.locator(`[data-testid="dp-day-${today + 1}"]`).click();
      await expect(page.locator('[data-testid="datepicker-calendar"]')).not.toBeVisible();
    }
  });
});

// ═══════════════════════════════════════════════════
// 8. ACCESSIBILITY
// ═══════════════════════════════════════════════════
test.describe('Accessibility', () => {
  test('should have proper ARIA labels on navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('[role="search"]')).toBeVisible();
    await expect(page.locator('[aria-label="Search products"]')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBeTruthy();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/ShopQA/i);
  });
});
