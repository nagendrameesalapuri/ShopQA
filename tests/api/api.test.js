/**
 * ShopQA API Automation Tests
 * Covers all REST API endpoints with positive/negative/edge cases
 *
 * Run: npm test (from backend directory)
 * Uses: Jest + Supertest
 */

const request = require("supertest");
const app = require("../src/server");

// ─── Test Tokens (stored after auth) ─────────────────────────────────────────
let adminToken, customerToken, customerId;
let productId, cartItemId, orderId, couponId, reviewId;

// ═══════════════════════════════════════════════════
// AUTHENTICATION TESTS
// ═══════════════════════════════════════════════════
describe("🔐 Authentication API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: `test_${Date.now()}@qa.com`,
          password: "Password123!",
          firstName: "QA",
          lastName: "Test",
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.verificationToken).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "john@test.com",
          password: "Password123!",
          firstName: "John",
          lastName: "Doe",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EMAIL_TAKEN");
    });

    it("should reject weak password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "new@test.com",
          password: "weak",
          firstName: "New",
          lastName: "User",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject missing required fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "missing@test.com" });

      expect(res.status).toBe(400);
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "notanemail",
          password: "Password123!",
          firstName: "A",
          lastName: "B",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login as admin and return tokens", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@shopqa.com",
          password: "Password123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe("admin");

      adminToken = res.body.accessToken;
    });

    it("should login as customer", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@test.com",
          password: "Password123!",
        });

      expect(res.status).toBe(200);

      customerToken = res.body.accessToken;
      customerId = res.body.user.id;
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@test.com",
          password: "WrongPassword1",
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
      expect(res.body.attemptsRemaining).toBeDefined();
    });

    it("should return 401 for non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "ghost@test.com",
          password: "Password123!",
        });

      expect(res.status).toBe(401);
    });
  });
});

// ═══════════════════════════════════════════════════
// PRODUCT TESTS
// ═══════════════════════════════════════════════════
describe("📦 Products API", () => {
  describe("GET /api/products", () => {
    it("should return paginated products", async () => {
      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThan(0);

      productId = res.body.products[0].id;
    });

    it("should search products", async () => {
      const res = await request(app).get("/api/products?search=iphone");

      expect(res.status).toBe(200);
      expect(res.body.products).toBeDefined();

      res.body.products.forEach((p) => {
        expect(p.name.toLowerCase()).toContain("iphone");
      });
    });

    it("should filter by price range", async () => {
      const res = await request(app).get("/api/products?minPrice=100&maxPrice=1000");

      expect(res.status).toBe(200);

      res.body.products.forEach((p) => {
        expect(parseFloat(p.price)).toBeGreaterThanOrEqual(100);
        expect(parseFloat(p.price)).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return product details", async () => {
      const res = await request(app).get(`/api/products/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body.product.id).toBe(productId);
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get(
        "/api/products/00000000-0000-0000-0000-000000000000"
      );

      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════
// CART TESTS
// ═══════════════════════════════════════════════════
describe("🛒 Cart API", () => {
  it("should require auth to access cart", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("should get cart with auth", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.cart).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════
describe("🔬 Edge Cases", () => {
  it("should return 404 for unknown route", async () => {
    const res = await request(app).get("/api/nonexistent/route");

    expect(res.status).toBe(404);
  });

  it("should handle SQL injection in search", async () => {
    const res = await request(app).get("/api/products?search=' OR 1=1 --");

    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
  });

  it("should handle XSS in search", async () => {
    const res = await request(app).get(
      "/api/products?search=<script>alert(1)</script>"
    );

    expect(res.status).toBe(200);
  });
});
```
