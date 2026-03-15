/**
 * @swagger
 * tags:
 *   name: QA Helpers
 *   description: Test automation helper endpoints (disabled in production)
 */

/**
 * @swagger
 * /api/qa/status:
 *   get:
 *     summary: Get QA environment status and record counts
 *     tags: [QA Helpers]
 *     responses:
 *       200:
 *         description: Status and database counts
 *         content:
 *           application/json:
 *             example:
 *               status: "ok"
 *               environment: "development"
 *               counts:
 *                 users: "10"
 *                 products: "52"
 *                 orders: "5"
 *                 coupons: "7"
 *                 reviews: "3"
 *       403:
 *         description: Disabled in production
 */

/**
 * @swagger
 * /api/qa/seed:
 *   post:
 *     summary: Seed database with test data (50+ products, 10 users, coupons)
 *     tags: [QA Helpers]
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Database seeded successfully"
 */

/**
 * @swagger
 * /api/qa/reset:
 *   post:
 *     summary: Reset all test data (orders, carts, reviews, tokens)
 *     tags: [QA Helpers]
 *     responses:
 *       200:
 *         description: Test data reset
 *         content:
 *           application/json:
 *             example:
 *               message: "Test data reset successfully"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */

/**
 * @swagger
 * /api/qa/products/{id}/stock:
 *   patch:
 *     summary: Set product stock to any value (use 0 to simulate out-of-stock)
 *     tags: [QA Helpers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             outOfStock:
 *               summary: Set out of stock
 *               value:
 *                 stock: 0
 *             restoreStock:
 *               summary: Restore stock
 *               value:
 *                 stock: 100
 *     responses:
 *       200:
 *         description: Stock updated
 *         content:
 *           application/json:
 *             example:
 *               product:
 *                 id: "uuid"
 *                 name: "iPhone 15 Pro"
 *                 stock: 0
 *               message: "Stock set to 0"
 */

/**
 * @swagger
 * /api/qa/products/out-of-stock:
 *   post:
 *     summary: Set multiple products to out of stock
 *     tags: [QA Helpers]
 *     requestBody:
 *       content:
 *         application/json:
 *           examples:
 *             specific:
 *               summary: Specific products
 *               value:
 *                 productIds: ["uuid1", "uuid2"]
 *             all:
 *               summary: All products
 *               value: {}
 *     responses:
 *       200:
 *         description: Products set to out of stock
 */

/**
 * @swagger
 * /api/qa/orders/generate:
 *   post:
 *     summary: Generate fake orders for a user
 *     tags: [QA Helpers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             userId: "user-uuid"
 *             count: 5
 *     responses:
 *       200:
 *         description: Orders generated
 *         content:
 *           application/json:
 *             example:
 *               message: "Generated 5 orders"
 *               orders: []
 */

/**
 * @swagger
 * /api/qa/payment/mock:
 *   post:
 *     summary: Mock a payment outcome for an order
 *     tags: [QA Helpers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             success:
 *               summary: Simulate success
 *               value:
 *                 outcome: "success"
 *                 orderId: "order-uuid"
 *             failure:
 *               summary: Simulate failure
 *               value:
 *                 outcome: "failure"
 *                 orderId: "order-uuid"
 *     responses:
 *       200:
 *         description: Payment outcome set
 */

/**
 * @swagger
 * /api/qa/users/{id}/lock:
 *   patch:
 *     summary: Lock or unlock a user account
 *     tags: [QA Helpers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           examples:
 *             lock:
 *               summary: Lock user
 *               value:
 *                 lock: true
 *             unlock:
 *               summary: Unlock user
 *               value:
 *                 lock: false
 *     responses:
 *       200:
 *         description: User locked or unlocked
 */

/**
 * @swagger
 * /api/qa/users/{id}/expire-tokens:
 *   post:
 *     summary: Expire all tokens for a user (simulate session expiry)
 *     tags: [QA Helpers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All tokens revoked
 *         content:
 *           application/json:
 *             example:
 *               message: "All tokens revoked for user"
 */

const router = require("express").Router();
const { query, getPool } = require("../config/database");
const bcrypt = require("bcryptjs");

const qaGuard = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res
      .status(403)
      .json({
        error: "QA endpoints disabled in production",
        code: "QA_DISABLED",
      });
  }
  next();
};

router.use(qaGuard);

router.get("/status", async (req, res, next) => {
  try {
    const {
      rows: [counts],
    } = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM coupons) as coupons,
        (SELECT COUNT(*) FROM reviews) as reviews
    `);
    res.json({ status: "ok", environment: process.env.NODE_ENV, counts });
  } catch (err) {
    next(err);
  }
});

router.post("/reset", async (req, res, next) => {
  try {
    const pool = getPool();
    await pool.query("DELETE FROM order_status_history");
    await pool.query("DELETE FROM order_items");
    await pool.query("DELETE FROM orders");
    await pool.query("DELETE FROM cart_items");
    await pool.query("DELETE FROM carts");
    await pool.query("DELETE FROM reviews");
    await pool.query("DELETE FROM refresh_tokens");
    await pool.query("DELETE FROM wishlists");
    await pool.query("DELETE FROM audit_logs");
    await pool.query(
      "UPDATE users SET login_attempts=0, locked_until=null WHERE role='customer'",
    );
    await pool.query("UPDATE products SET stock=100, sold_count=0");
    await pool.query("UPDATE coupons SET usage_count=0");
    res.json({
      message: "Test data reset successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/seed", async (req, res, next) => {
  try {
    await seedDatabase();
    res.json({ message: "Database seeded successfully" });
  } catch (err) {
    next(err);
  }
});

router.patch("/products/:id/stock", async (req, res, next) => {
  try {
    const { stock } = req.body;
    const { rows } = await query(
      "UPDATE products SET stock = $1 WHERE id = $2 RETURNING id, name, stock",
      [parseInt(stock), req.params.id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Product not found" });
    res.json({ product: rows[0], message: `Stock set to ${stock}` });
  } catch (err) {
    next(err);
  }
});

router.post("/products/out-of-stock", async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (productIds?.length) {
      await query("UPDATE products SET stock = 0 WHERE id = ANY($1)", [
        productIds,
      ]);
    } else {
      await query("UPDATE products SET stock = 0");
    }
    res.json({ message: "Products set to out of stock" });
  } catch (err) {
    next(err);
  }
});

router.post("/orders/generate", async (req, res, next) => {
  try {
    const { userId, count = 5 } = req.body;
    const {
      rows: [user],
    } = await query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { rows: products } = await query(
      "SELECT * FROM products WHERE is_active=true LIMIT 20",
    );
    const statuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const methods = ["credit_card", "upi", "paypal", "cod"];
    const orders = [];
    for (let i = 0; i < parseInt(count); i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const subtotal = parseFloat(product.price) * qty;
      const shipping = subtotal > 500 ? 0 : 49;
      const tax = subtotal * 0.18;
      const total = subtotal + shipping + tax;
      const {
        rows: [order],
      } = await query(
        `INSERT INTO orders (order_number, user_id, status, payment_status, payment_method, shipping_address, subtotal, shipping_cost, tax_amt, total)
         VALUES ($1, $2, $3, 'paid', $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          `ORD-TEST-${Date.now()}-${i}`,
          userId,
          status,
          methods[Math.floor(Math.random() * methods.length)],
          JSON.stringify({
            fullName: `${user.first_name} ${user.last_name}`,
            line1: "123 Test St",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560001",
            country: "India",
            phone: "9876543210",
          }),
          subtotal.toFixed(2),
          shipping.toFixed(2),
          tax.toFixed(2),
          total.toFixed(2),
        ],
      );
      await query(
        "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6)",
        [
          order.id,
          product.id,
          product.name,
          qty,
          product.price,
          (qty * parseFloat(product.price)).toFixed(2),
        ],
      );
      orders.push(order);
    }
    res.json({ message: `Generated ${count} orders`, orders });
  } catch (err) {
    next(err);
  }
});

router.post("/payment/mock", async (req, res, next) => {
  try {
    const { outcome, orderId } = req.body;
    if (orderId) {
      const status = outcome === "success" ? "paid" : "failed";
      await query("UPDATE orders SET payment_status=$1 WHERE id=$2", [
        status,
        orderId,
      ]);
    }
    res.json({
      success: outcome === "success",
      paymentRef: `MOCK-PAY-${Date.now()}`,
      outcome,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/lock", async (req, res, next) => {
  try {
    const { lock } = req.body;
    if (lock) {
      await query(
        "UPDATE users SET status='locked', locked_until=NOW()+INTERVAL '1 hour' WHERE id=$1",
        [req.params.id],
      );
    } else {
      await query(
        "UPDATE users SET status='active', login_attempts=0, locked_until=null WHERE id=$1",
        [req.params.id],
      );
    }
    res.json({ message: lock ? "User locked" : "User unlocked" });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/expire-tokens", async (req, res, next) => {
  try {
    await query("UPDATE refresh_tokens SET revoked=true WHERE user_id=$1", [
      req.params.id,
    ]);
    res.json({ message: "All tokens revoked for user" });
  } catch (err) {
    next(err);
  }
});

const seedDatabase = async () => {
  const pool = getPool();
  const categories = [
    {
      name: "Electronics",
      slug: "electronics",
      desc: "Latest gadgets and devices",
    },
    { name: "Clothing", slug: "clothing", desc: "Fashion for everyone" },
    { name: "Books", slug: "books", desc: "Knowledge and entertainment" },
    {
      name: "Home & Kitchen",
      slug: "home-kitchen",
      desc: "Everything for your home",
    },
    {
      name: "Sports & Fitness",
      slug: "sports-fitness",
      desc: "Stay active and healthy",
    },
    {
      name: "Beauty & Personal Care",
      slug: "beauty",
      desc: "Look and feel your best",
    },
    { name: "Toys & Games", slug: "toys-games", desc: "Fun for all ages" },
    {
      name: "Automotive",
      slug: "automotive",
      desc: "Car accessories and tools",
    },
  ];
  const catRows = {};
  for (const cat of categories) {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, description) VALUES ($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id, slug`,
      [cat.name, cat.slug, cat.desc],
    );
    catRows[cat.slug] = rows[0].id;
  }
  const pass = await bcrypt.hash("Password123!", 12);
  const users = [
    { email: "admin@shopqa.com", first: "Admin", last: "User", role: "admin" },
    { email: "john@test.com", first: "John", last: "Doe", role: "customer" },
    { email: "jane@test.com", first: "Jane", last: "Smith", role: "customer" },
    { email: "bob@test.com", first: "Bob", last: "Johnson", role: "customer" },
    {
      email: "alice@test.com",
      first: "Alice",
      last: "Williams",
      role: "customer",
    },
    {
      email: "charlie@test.com",
      first: "Charlie",
      last: "Brown",
      role: "customer",
    },
    { email: "eve@test.com", first: "Eve", last: "Davis", role: "customer" },
    {
      email: "frank@test.com",
      first: "Frank",
      last: "Miller",
      role: "customer",
    },
    {
      email: "grace@test.com",
      first: "Grace",
      last: "Wilson",
      role: "customer",
    },
    {
      email: "henry@test.com",
      first: "Henry",
      last: "Moore",
      role: "customer",
    },
  ];
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified) VALUES ($1,$2,$3,$4,$5,'active',true) ON CONFLICT (email) DO UPDATE SET first_name=EXCLUDED.first_name`,
      [u.email, pass, u.first, u.last, u.role],
    );
  }
  const productData = [
    {
      name: "iPhone 15 Pro",
      cat: "electronics",
      price: 134900,
      brand: "Apple",
      stock: 25,
      rating: 4.8,
      featured: true,
      desc: "The latest iPhone with A17 Pro chip.",
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      cat: "electronics",
      price: 129999,
      brand: "Samsung",
      stock: 20,
      rating: 4.7,
      featured: true,
      desc: "Flagship Samsung with S Pen.",
    },
    {
      name: "MacBook Air M3",
      cat: "electronics",
      price: 114900,
      brand: "Apple",
      stock: 15,
      rating: 4.9,
      featured: true,
      desc: "M3 chip, 18-hour battery.",
    },
    {
      name: "Sony WH-1000XM5",
      cat: "electronics",
      price: 29990,
      brand: "Sony",
      stock: 40,
      rating: 4.8,
      desc: "Industry-leading noise canceling.",
    },
    {
      name: 'iPad Pro 12.9"',
      cat: "electronics",
      price: 112900,
      brand: "Apple",
      stock: 18,
      rating: 4.7,
      desc: "M4 chip, Liquid Retina XDR.",
    },
    {
      name: "Dell XPS 15",
      cat: "electronics",
      price: 149990,
      brand: "Dell",
      stock: 12,
      rating: 4.6,
      desc: "OLED display, premium laptop.",
    },
    {
      name: "JBL Flip 6",
      cat: "electronics",
      price: 9499,
      brand: "JBL",
      stock: 60,
      rating: 4.5,
      desc: "Portable Bluetooth speaker.",
    },
    {
      name: "Canon EOS R50",
      cat: "electronics",
      price: 67990,
      brand: "Canon",
      stock: 8,
      rating: 4.6,
      desc: "Mirrorless camera.",
    },
    {
      name: 'LG 4K OLED TV 55"',
      cat: "electronics",
      price: 129990,
      brand: "LG",
      stock: 5,
      rating: 4.8,
      desc: "OLED evo, Dolby Vision.",
    },
    {
      name: "Nintendo Switch OLED",
      cat: "electronics",
      price: 29990,
      brand: "Nintendo",
      stock: 30,
      rating: 4.7,
      desc: "7-inch OLED screen.",
    },
    {
      name: "Levi's 511 Slim Jeans",
      cat: "clothing",
      price: 3499,
      brand: "Levi's",
      stock: 100,
      rating: 4.4,
      desc: "Classic slim-fit jeans.",
    },
    {
      name: "Nike Air Force 1",
      cat: "clothing",
      price: 8495,
      brand: "Nike",
      stock: 75,
      rating: 4.6,
      featured: true,
      desc: "Iconic basketball shoe.",
    },
    {
      name: "Adidas Ultraboost 23",
      cat: "clothing",
      price: 14999,
      brand: "Adidas",
      stock: 50,
      rating: 4.7,
      desc: "Boost cushioning running shoe.",
    },
    {
      name: "The North Face Jacket",
      cat: "clothing",
      price: 12999,
      brand: "The North Face",
      stock: 35,
      rating: 4.5,
      desc: "Waterproof shell jacket.",
    },
    {
      name: "Zara Floral Dress",
      cat: "clothing",
      price: 2999,
      brand: "Zara",
      stock: 80,
      rating: 4.3,
      desc: "Elegant floral summer dress.",
    },
    {
      name: "Puma Running T-Shirt",
      cat: "clothing",
      price: 1299,
      brand: "Puma",
      stock: 120,
      rating: 4.2,
      desc: "Moisture-wicking tee.",
    },
    {
      name: "Ray-Ban Aviator",
      cat: "clothing",
      price: 9990,
      brand: "Ray-Ban",
      stock: 45,
      rating: 4.6,
      desc: "Polarized aviator sunglasses.",
    },
    {
      name: "Atomic Habits",
      cat: "books",
      price: 499,
      brand: "Penguin",
      stock: 200,
      rating: 4.9,
      featured: true,
      desc: "James Clear's habit guide.",
    },
    {
      name: "The Psychology of Money",
      cat: "books",
      price: 399,
      brand: "Jaico",
      stock: 180,
      rating: 4.8,
      desc: "Wealth and happiness.",
    },
    {
      name: "Clean Code",
      cat: "books",
      price: 699,
      brand: "O'Reilly",
      stock: 90,
      rating: 4.7,
      desc: "Software craftsmanship.",
    },
    {
      name: "System Design Interview",
      cat: "books",
      price: 849,
      brand: "Amazon KDP",
      stock: 150,
      rating: 4.8,
      desc: "Interview preparation.",
    },
    {
      name: "The Pragmatic Programmer",
      cat: "books",
      price: 799,
      brand: "O'Reilly",
      stock: 110,
      rating: 4.8,
      desc: "Classic dev handbook.",
    },
    {
      name: "Dune",
      cat: "books",
      price: 599,
      brand: "Hodder",
      stock: 160,
      rating: 4.7,
      desc: "Epic sci-fi masterpiece.",
    },
    {
      name: "Instant Pot Duo 7-in-1",
      cat: "home-kitchen",
      price: 8999,
      brand: "Instant Pot",
      stock: 55,
      rating: 4.7,
      featured: true,
      desc: "Pressure cooker.",
    },
    {
      name: "Dyson V15 Vacuum",
      cat: "home-kitchen",
      price: 54900,
      brand: "Dyson",
      stock: 20,
      rating: 4.8,
      desc: "Laser dust detection.",
    },
    {
      name: "Nespresso Vertuo Pop",
      cat: "home-kitchen",
      price: 9999,
      brand: "Nespresso",
      stock: 40,
      rating: 4.5,
      desc: "Single-serve coffee.",
    },
    {
      name: "Le Creuset Dutch Oven",
      cat: "home-kitchen",
      price: 19990,
      brand: "Le Creuset",
      stock: 25,
      rating: 4.9,
      desc: "Cast iron Dutch oven.",
    },
    {
      name: "Philips Air Fryer",
      cat: "home-kitchen",
      price: 11999,
      brand: "Philips",
      stock: 60,
      rating: 4.6,
      desc: "Digital air fryer.",
    },
    {
      name: "IKEA KALLAX Shelving",
      cat: "home-kitchen",
      price: 4999,
      brand: "IKEA",
      stock: 30,
      rating: 4.4,
      desc: "Versatile shelving unit.",
    },
    {
      name: "Fitbit Charge 6",
      cat: "sports-fitness",
      price: 14999,
      brand: "Fitbit",
      stock: 70,
      rating: 4.5,
      featured: true,
      desc: "Fitness tracker with GPS.",
    },
    {
      name: "Yoga Mat Premium",
      cat: "sports-fitness",
      price: 2499,
      brand: "Liforme",
      stock: 90,
      rating: 4.7,
      desc: "Alignment yoga mat.",
    },
    {
      name: "Whey Protein 5kg",
      cat: "sports-fitness",
      price: 4999,
      brand: "MuscleBlaze",
      stock: 100,
      rating: 4.6,
      desc: "Whey protein isolate.",
    },
    {
      name: "Adjustable Dumbbell Set",
      cat: "sports-fitness",
      price: 12999,
      brand: "PowerBlock",
      stock: 25,
      rating: 4.8,
      desc: "5-52.5 lb adjustable.",
    },
    {
      name: "Resistance Bands Set",
      cat: "sports-fitness",
      price: 999,
      brand: "Boldfit",
      stock: 150,
      rating: 4.3,
      desc: "Set of 5 bands.",
    },
    {
      name: "Running Shoes X100",
      cat: "sports-fitness",
      price: 5999,
      brand: "ASICS",
      stock: 65,
      rating: 4.6,
      desc: "GEL cushioning.",
    },
    {
      name: "Olay Regenerist Serum",
      cat: "beauty",
      price: 1299,
      brand: "Olay",
      stock: 110,
      rating: 4.4,
      featured: true,
      desc: "Niacinamide serum.",
    },
    {
      name: "MAC Ruby Woo Lipstick",
      cat: "beauty",
      price: 1850,
      brand: "MAC",
      stock: 80,
      rating: 4.7,
      desc: "Iconic matte red.",
    },
    {
      name: "Dyson Airwrap",
      cat: "beauty",
      price: 44900,
      brand: "Dyson",
      stock: 15,
      rating: 4.6,
      desc: "Multi-styler.",
    },
    {
      name: "The Ordinary Niacinamide",
      cat: "beauty",
      price: 630,
      brand: "The Ordinary",
      stock: 200,
      rating: 4.5,
      desc: "10% + Zinc 1% serum.",
    },
    {
      name: "Nivea SPF 50 Sunscreen",
      cat: "beauty",
      price: 350,
      brand: "Nivea",
      stock: 180,
      rating: 4.3,
      desc: "Daily SPF 50 sunscreen.",
    },
    {
      name: "LEGO Technic Bugatti",
      cat: "toys-games",
      price: 17999,
      brand: "LEGO",
      stock: 20,
      rating: 4.9,
      desc: "3599 piece building kit.",
    },
    {
      name: "Monopoly Board Game",
      cat: "toys-games",
      price: 1499,
      brand: "Hasbro",
      stock: 85,
      rating: 4.3,
      desc: "Classic property trading.",
    },
    {
      name: "Barbie Dreamhouse",
      cat: "toys-games",
      price: 11999,
      brand: "Mattel",
      stock: 18,
      rating: 4.5,
      desc: "Three-story dreamhouse.",
    },
    {
      name: "Hot Wheels 20-Car Pack",
      cat: "toys-games",
      price: 999,
      brand: "Mattel",
      stock: 120,
      rating: 4.6,
      desc: "Die-cast car set.",
    },
    {
      name: "Chess Set Wooden",
      cat: "toys-games",
      price: 2999,
      brand: "WE Games",
      stock: 40,
      rating: 4.7,
      desc: "Tournament weighted pieces.",
    },
    {
      name: 'Michelin Wiper Blade 24"',
      cat: "automotive",
      price: 799,
      brand: "Michelin",
      stock: 90,
      rating: 4.5,
      desc: "Beam wiper blade.",
    },
    {
      name: "Car Dash Cam 4K",
      cat: "automotive",
      price: 7999,
      brand: "Garmin",
      stock: 45,
      rating: 4.6,
      desc: "4K with GPS.",
    },
    {
      name: "Portable Tyre Inflator",
      cat: "automotive",
      price: 2499,
      brand: "Lifelong",
      stock: 75,
      rating: 4.4,
      desc: "Digital air compressor.",
    },
    {
      name: "Car Seat Organizer",
      cat: "automotive",
      price: 699,
      brand: "AmazonBasics",
      stock: 130,
      rating: 4.2,
      desc: "Multi-pocket organizer.",
    },
    {
      name: "Bluetooth OBD2 Scanner",
      cat: "automotive",
      price: 1999,
      brand: "BAFX",
      stock: 55,
      rating: 4.4,
      desc: "Wireless car diagnostic.",
    },
  ];
  for (const p of productData) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await pool.query(
      `INSERT INTO products (name, slug, description, price, category_id, brand, stock, avg_rating, is_active, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) ON CONFLICT (slug) DO UPDATE SET price=EXCLUDED.price, stock=EXCLUDED.stock`,
      [
        p.name,
        slug,
        p.desc,
        p.price,
        catRows[p.cat],
        p.brand,
        p.stock,
        p.rating,
        p.featured || false,
      ],
    );
  }
  const coupons = [
    {
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      desc: "Welcome 10% off",
      limit: 100,
      perUser: 1,
      expires: "2025-12-31",
    },
    {
      code: "FLAT500",
      type: "fixed",
      value: 500,
      desc: "Flat 500 off orders above 2000",
      limit: 50,
      minOrder: 2000,
      expires: "2025-12-31",
    },
    {
      code: "SUMMER25",
      type: "percentage",
      value: 25,
      desc: "25% summer sale",
      limit: 200,
      maxDiscount: 1000,
      expires: "2025-08-31",
    },
    {
      code: "FREESHIP",
      type: "fixed",
      value: 49,
      desc: "Free shipping",
      limit: null,
      expires: null,
    },
    {
      code: "BIGBUY20",
      type: "percentage",
      value: 20,
      desc: "20% off above 5000",
      limit: 30,
      minOrder: 5000,
      maxDiscount: 2000,
      expires: "2025-11-30",
    },
    {
      code: "EXPIRED50",
      type: "percentage",
      value: 50,
      desc: "Expired coupon for testing",
      limit: 100,
      expires: "2020-01-01",
    },
    {
      code: "MAXUSED",
      type: "fixed",
      value: 100,
      desc: "Fully used coupon for testing",
      limit: 5,
      usageCount: 5,
      expires: "2025-12-31",
    },
  ];
  for (const c of coupons) {
    await pool.query(
      `INSERT INTO coupons (code, type, value, description, usage_limit, per_user_limit, min_order_amt, max_discount, expires_at, usage_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (code) DO UPDATE SET value=EXCLUDED.value`,
      [
        c.code,
        c.type,
        c.value,
        c.desc,
        c.limit || null,
        c.perUser || 1,
        c.minOrder || 0,
        c.maxDiscount || null,
        c.expires ? new Date(c.expires) : null,
        c.usageCount || 0,
      ],
    );
  }
  console.log("Database seeded successfully");
};

module.exports = router;
module.exports.seedDatabase = seedDatabase;
