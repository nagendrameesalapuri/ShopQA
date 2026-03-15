/**
 * ShopQA API Automation Tests
 * Covers all REST API endpoints with positive/negative/edge cases
 * 
 * Run: npm test (from backend directory)
 * Uses: Jest + Supertest
 */

const request = require('supertest');
const app = require('../src/server');

// ─── Test Tokens (stored after auth) ─────────────────────────────────────────
let adminToken, customerToken, customerId;
let productId, cartItemId, orderId, couponId, reviewId;

// ═══════════════════════════════════════════════════
// AUTHENTICATION TESTS
// ═══════════════════════════════════════════════════
describe('🔐 Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `test_${Date.now()}@qa.com`, password: 'Password123!', firstName: 'QA', lastName: 'Test' });
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.verificationToken).toBeDefined(); // Dev mode
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@test.com', password: 'Password123!', firstName: 'John', lastName: 'Doe' });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_TAKEN');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'weak', firstName: 'New', lastName: 'User' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'missing@test.com' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'notanemail', password: 'Password123!', firstName: 'A', lastName: 'B' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login as admin and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@shopqa.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.accessToken;
    });

    it('should login as customer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      customerToken = res.body.accessToken;
      customerId    = res.body.user.id;
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'WrongPassword1' });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.attemptsRemaining).toBeDefined();
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'Password123!' });
      expect(res.status).toBe(401);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Use QA endpoint to reset attempts first
      await request(app).patch('/api/qa/users/unlock-all').send();

      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/auth/login')
          .send({ email: 'bob@test.com', password: 'WrongPassword' });
      }
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bob@test.com', password: 'Password123!' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_LOCKED');
    });

    it('should reject unverified email account', async () => {
      // Create unverified user via register without verifying
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ email: `unverified_${Date.now()}@test.com`, password: 'Password123!', firstName: 'Un', lastName: 'Verified' });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: regRes.body.user.email, password: 'Password123!' });
      expect(loginRes.status).toBe(403);
      expect(loginRes.body.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('Token Management', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 with expired/invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('john@test.com');
    });
  });
});

// ═══════════════════════════════════════════════════
// PRODUCT TESTS
// ═══════════════════════════════════════════════════
describe('📦 Products API', () => {
  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.pages).toBeGreaterThan(0);
      expect(res.body.hasNext).toBeDefined();
      productId = res.body.products[0].id;
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/api/products?category=electronics');
      expect(res.status).toBe(200);
      res.body.products.forEach((p: any) => {
        expect(p.category_slug).toBe('electronics');
      });
    });

    it('should search products', async () => {
      const res = await request(app).get('/api/products?search=iphone');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      res.body.products.forEach((p: any) => {
        expect(p.name.toLowerCase()).toContain('iphone');
      });
    });

    it('should filter by price range', async () => {
      const res = await request(app).get('/api/products?minPrice=100&maxPrice=1000');
      expect(res.status).toBe(200);
      res.body.products.forEach((p: any) => {
        expect(parseFloat(p.price)).toBeGreaterThanOrEqual(100);
        expect(parseFloat(p.price)).toBeLessThanOrEqual(1000);
      });
    });

    it('should sort by price ascending', async () => {
      const res = await request(app).get('/api/products?sort=price_asc&limit=5');
      const prices = res.body.products.map((p: any) => parseFloat(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should filter in-stock products only', async () => {
      const res = await request(app).get('/api/products?inStock=true');
      res.body.products.forEach((p: any) => {
        expect(p.stock).toBeGreaterThan(0);
      });
    });

    it('should respect pagination', async () => {
      const page1 = await request(app).get('/api/products?page=1&limit=5');
      const page2 = await request(app).get('/api/products?page=2&limit=5');
      const ids1 = page1.body.products.map((p: any) => p.id);
      const ids2 = page2.body.products.map((p: any) => p.id);
      expect(ids1.some((id: any) => ids2.includes(id))).toBe(false);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product details', async () => {
      const res = await request(app).get(`/api/products/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body.product.id).toBe(productId);
      expect(res.body.product.variants).toBeDefined();
      expect(res.body.product.related).toBeDefined();
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('Admin Product Management', () => {
    it('should require admin to create product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Test Product', price: 999, stock: 10 });
      expect(res.status).toBe(403);
    });

    it('should allow admin to update product stock', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: 0 });
      expect(res.status).toBe(200);
      expect(res.body.product.stock).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════
// CART TESTS
// ═══════════════════════════════════════════════════
describe('🛒 Cart API', () => {
  it('should get empty cart', async () => {
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.cart).toBeDefined();
    expect(res.body.cart.itemCount).toBeGreaterThanOrEqual(0);
  });

  it('should require auth to access cart', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('should add item to cart', async () => {
    // First get an in-stock product
    const { body } = await request(app).get('/api/products?inStock=true&limit=1');
    const pid = body.products[0]?.id;

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: pid, quantity: 2 });
    expect(res.status).toBe(201);

    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${customerToken}`);
    cartItemId = cart.body.cart.items[0]?.id;
  });

  it('should reject adding out-of-stock item', async () => {
    // Use QA endpoint to set stock to 0
    const { body } = await request(app).get('/api/products?inStock=true&limit=1');
    const pid = body.products[0]?.id;
    await request(app).patch(`/api/qa/products/${pid}/stock`).send({ stock: 0 });

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: pid, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('OUT_OF_STOCK');
  });

  it('should update cart item quantity', async () => {
    if (!cartItemId) return;
    const res = await request(app)
      .put(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 3 });
    expect(res.status).toBe(200);
  });

  it('should apply valid coupon', async () => {
    const res = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'WELCOME10' });
    expect(res.status).toBe(200);
    expect(res.body.coupon.code).toBe('WELCOME10');
    expect(res.body.coupon.discount).toBeGreaterThan(0);
  });

  it('should reject expired coupon', async () => {
    const res = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'EXPIRED50' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_COUPON');
  });

  it('should reject invalid coupon', async () => {
    const res = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'NOTAREALCODE' });
    expect(res.status).toBe(400);
  });

  it('should remove item from cart', async () => {
    if (!cartItemId) return;
    const res = await request(app)
      .delete(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════
// ORDER TESTS
// ═══════════════════════════════════════════════════
describe('📋 Orders API', () => {
  const shippingAddress = { fullName: 'John Doe', phone: '9876543210', line1: '123 Test St', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India' };

  it('should create order with successful payment', async () => {
    // Add item to cart first
    const { body: { products } } = await request(app).get('/api/products?inStock=true&limit=1');
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: products[0].id, quantity: 1 });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress,
        deliveryMethod: 'standard',
        paymentMethod: 'credit_card',
        paymentData: { cardNumber: '4111111111111111', expiry: '12/25', cvv: '123', name: 'JOHN DOE' },
      });
    expect(res.status).toBe(201);
    expect(res.body.order.order_number).toMatch(/ORD-/);
    expect(res.body.order.payment_status).toBe('paid');
    orderId = res.body.order.id;
  });

  it('should simulate payment failure with declined card', async () => {
    // Add item to cart first
    const { body: { products } } = await request(app).get('/api/products?inStock=true&limit=1');
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: products[0].id, quantity: 1 });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress,
        paymentMethod: 'credit_card',
        paymentData: { cardNumber: '4000000000000002', expiry: '12/25', cvv: '123', name: 'JOHN DOE' },
      });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe('PAYMENT_FAILED');
    expect(res.body.paymentError).toBe('INSUFFICIENT_FUNDS');
  });

  it('should simulate UPI payment failure', async () => {
    const { body: { products } } = await request(app).get('/api/products?inStock=true&limit=1');
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: products[0].id, quantity: 1 });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shippingAddress, paymentMethod: 'upi', paymentData: { upiId: 'fail@upi' } });
    expect(res.status).toBe(402);
    expect(res.body.paymentError).toBe('UPI_FAILED');
  });

  it('should list user orders', async () => {
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toBeInstanceOf(Array);
  });

  it('should get order by ID', async () => {
    if (!orderId) return;
    const res = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.order.items).toBeInstanceOf(Array);
    expect(res.body.order.history).toBeInstanceOf(Array);
  });

  it('should cancel order', async () => {
    if (!orderId) return;
    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Test cancellation' });
    expect(res.status).toBe(200);
  });

  it('should not cancel already cancelled order', async () => {
    if (!orderId) return;
    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CANNOT_CANCEL');
  });

  it('should not access another user order', async () => {
    if (!orderId) return;
    const res = await request(app).get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    // Admin token is a different user, should 404
    expect([404, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════
// REVIEWS TESTS
// ═══════════════════════════════════════════════════
describe('⭐ Reviews API', () => {
  it('should get product reviews', async () => {
    const res = await request(app).get(`/api/reviews?productId=${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.avgRating).toBeDefined();
  });

  it('should require productId', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(400);
  });

  it('should add a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, rating: 4, title: 'Great product', body: 'Very happy with this purchase!' });
    expect([201, 409]).toContain(res.status);
    if (res.status === 201) reviewId = res.body.review.id;
  });

  it('should reject rating out of range', async () => {
    const { body: { products } } = await request(app).get('/api/products?limit=2');
    const pid = products[1]?.id;
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: pid, rating: 6 }); // Invalid
    expect(res.status).toBe(400);
  });

  it('should prevent duplicate review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, rating: 3, title: 'Duplicate', body: 'Test' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_REVIEWED');
  });
});

// ═══════════════════════════════════════════════════
// ADMIN TESTS
// ═══════════════════════════════════════════════════
describe('⚙️ Admin API', () => {
  it('should get dashboard stats', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats.total_orders).toBeDefined();
    expect(res.body.stats.total_users).toBeDefined();
  });

  it('should list all users', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it('should block a user', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'banned' });
    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe('banned');

    // Unblock for other tests
    await request(app).patch(`/api/admin/users/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`).send({ status: 'active' });
  });

  it('should create a coupon', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `TEST${Date.now()}`, type: 'percentage', value: 15, usageLimit: 10, expiresAt: '2025-12-31' });
    expect(res.status).toBe(201);
    couponId = res.body.coupon.id;
  });

  it('should deny admin endpoints to non-admin', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════
// QA HELPER ENDPOINTS
// ═══════════════════════════════════════════════════
describe('🧪 QA Helper Endpoints', () => {
  it('should return QA status', async () => {
    const res = await request(app).get('/api/qa/status');
    expect(res.status).toBe(200);
    expect(res.body.environment).not.toBe('production');
    expect(res.body.counts).toBeDefined();
  });

  it('should toggle product stock', async () => {
    const { body: { products } } = await request(app).get('/api/products?limit=1');
    const pid = products[0].id;
    const res = await request(app).patch(`/api/qa/products/${pid}/stock`).send({ stock: 0 });
    expect(res.status).toBe(200);
    expect(res.body.product.stock).toBe(0);
  });

  it('should be disabled in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/api/qa/status');
    expect(res.status).toBe(403);
    process.env.NODE_ENV = originalEnv;
  });

  it('should reset test data', async () => {
    const res = await request(app).post('/api/qa/reset');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset');
  });
});

// ═══════════════════════════════════════════════════
// EDGE CASES & NEGATIVE SCENARIOS
// ═══════════════════════════════════════════════════
describe('🔬 Edge Cases', () => {
  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/nonexistent/route');
    expect(res.status).toBe(404);
  });

  it('should handle malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ malformed json');
    expect([400, 422, 500]).toContain(res.status);
  });

  it('should handle SQL injection in search', async () => {
    const res = await request(app).get("/api/products?search=' OR 1=1; --");
    expect(res.status).toBe(200); // Should return empty results, not crash
    expect(res.body.products).toBeDefined();
  });

  it('should handle XSS in search', async () => {
    const res = await request(app).get('/api/products?search=<script>alert(1)</script>');
    expect(res.status).toBe(200);
  });

  it('should handle very large page number', async () => {
    const res = await request(app).get('/api/products?page=99999');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });

  it('should handle negative price filter', async () => {
    const res = await request(app).get('/api/products?minPrice=-100');
    expect(res.status).toBe(200);
  });
});
