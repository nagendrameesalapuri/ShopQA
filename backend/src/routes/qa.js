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
 *                 products: "50"
 *                 orders: "5"
 *                 coupons: "7"
 *                 reviews: "300"
 *       403:
 *         description: Disabled in production
 */

/**
 * @swagger
 * /api/qa/seed:
 *   post:
 *     summary: Seed database with test data (50 products, 10 users, coupons, dummy reviews)
 *     description: |
 *       Upserts the full test catalog: 8 categories and 50 products (each with a full
 *       description, a `specifications` key/value sheet, a weight and a generated SKU),
 *       10 users (1 admin + 9 customers), 7 coupons, and 4-8 dummy reviews per product
 *       (~300 total) spread across the seeded customers. After inserting reviews it
 *       recomputes every product's `avg_rating`/`review_count` from the real review rows.
 *       Safe to call repeatedly — every insert upserts rather than duplicating, so this
 *       is also how you refresh catalog/review content on an already-seeded database.
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
const chaos = require("../config/chaos");

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

// ─── Chaos Engineering: inject artificial latency/errors into the real
// storefront endpoints (product list/detail, add-to-cart) so Playwright can
// drive the actual UI and assert on loading spinners, retries, and error
// states under controllable, repeatable network conditions. ───────────────
/**
 * @swagger
 * /api/qa/chaos:
 *   get:
 *     summary: Get current chaos-engineering state
 *     tags: [QA Helpers]
 *     responses:
 *       200: { description: Current latency/error-rate configuration }
 *   post:
 *     summary: Configure chaos-engineering (latency/errors on real endpoints)
 *     tags: [QA Helpers]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latencyMs: { type: integer, example: 3000, description: Added delay on affected requests (0-10000ms) }
 *               errorRate: { type: number, example: 0.5, description: Probability (0-1) a request fails with errorStatus }
 *               errorStatus: { type: integer, example: 500 }
 *     responses:
 *       200: { description: Updated chaos configuration }
 */
router.get("/chaos", (req, res) => {
  res.json({ chaos: chaos.getState() });
});

router.post("/chaos", (req, res) => {
  const { latencyMs, errorRate, errorStatus } = req.body;
  res.json({ chaos: chaos.configure({ latencyMs, errorRate, errorStatus }) });
});

/**
 * @swagger
 * /api/qa/chaos/reset:
 *   post:
 *     summary: Disable chaos-engineering (zero latency/error rate)
 *     tags: [QA Helpers]
 *     responses:
 *       200: { description: Chaos configuration reset to defaults }
 */
router.post("/chaos/reset", (req, res) => {
  res.json({ chaos: chaos.reset() });
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
          `ORD-${Date.now().toString(36).toUpperCase()}${i}`,
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

// Coupon expirations must stay relative to seed-time, not hardcoded absolute
// dates — a fixed date like "2025-12-31" silently starts failing every
// "Invalid or expired coupon" test once real time passes it.
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

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
  const userRows = {};
  for (const u of users) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified) VALUES ($1,$2,$3,$4,$5,'active',true) ON CONFLICT (email) DO UPDATE SET first_name=EXCLUDED.first_name RETURNING id`,
      [u.email, pass, u.first, u.last, u.role],
    );
    userRows[u.email] = rows[0].id;
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
      desc: "The iPhone 15 Pro brings a titanium design, the blazing-fast A17 Pro chip and a pro-grade camera system to your pocket. The Action Button puts your favorite shortcut one press away, while USB-C finally brings universal charging. Whether you're editing 4K video or gaming, this is Apple's most capable iPhone yet.",
      weight: 0.187,
      specs: {
        "Display": "6.1\" Super Retina XDR, 120Hz ProMotion",
        "Processor": "A17 Pro chip (3nm)",
        "Storage Options": "128GB / 256GB / 512GB / 1TB",
        "Camera": "48MP main + 12MP ultra-wide + 12MP telephoto",
        "Battery Life": "Up to 23 hours video playback",
        "Build": "Titanium frame, Ceramic Shield front",
        "Connectivity": "5G, Wi-Fi 6E, Bluetooth 5.3, USB-C",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      cat: "electronics",
      price: 129999,
      brand: "Samsung",
      stock: 20,
      rating: 4.7,
      featured: true,
      desc: "Samsung's flagship pairs a 200MP camera with a built-in S Pen and Galaxy AI features like Circle to Search and live translation. The titanium frame and flat display are built for productivity, while the 5000mAh battery keeps up with a full day of heavy use.",
      weight: 0.232,
      specs: {
        "Display": "6.8\" Dynamic AMOLED 2X, 120Hz",
        "Processor": "Snapdragon 8 Gen 3",
        "RAM / Storage": "12GB / 256GB, 512GB, 1TB",
        "Camera": "200MP main + 12MP ultra-wide + dual telephoto",
        "Battery": "5000mAh with 45W fast charging",
        "S Pen": "Built-in, low-latency",
        "Connectivity": "5G, Wi-Fi 7, Bluetooth 5.3",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "MacBook Air M3",
      cat: "electronics",
      price: 114900,
      brand: "Apple",
      stock: 15,
      rating: 4.9,
      featured: true,
      desc: "The redesigned MacBook Air runs on Apple's M3 chip, delivering desktop-class performance in a fanless 1.24kg chassis. With up to 18 hours of battery life, a stunning Liquid Retina display and support for two external monitors, it's built for creators and professionals on the move.",
      weight: 1.24,
      specs: {
        "Display": "13.6\" Liquid Retina, 500 nits",
        "Processor": "Apple M3 chip (8-core CPU)",
        "Memory": "8GB / 16GB / 24GB unified memory",
        "Storage": "256GB - 2TB SSD",
        "Battery Life": "Up to 18 hours",
        "Ports": "2x Thunderbolt/USB-4, MagSafe 3",
        "Operating System": "macOS Sonoma",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Sony WH-1000XM5",
      cat: "electronics",
      price: 29990,
      brand: "Sony",
      stock: 40,
      rating: 4.8,
      desc: "Sony's flagship headphones combine industry-leading noise cancellation with rich, detailed sound tuned by Sony engineers. Eight microphones adapt to your environment in real time, and 30-hour battery life with quick charge means you're rarely without music.",
      weight: 0.25,
      specs: {
        "Type": "Over-ear, wireless noise-cancelling",
        "Driver": "30mm dynamic driver",
        "Noise Cancellation": "Dual Noise Sensor + QN1 processor",
        "Battery Life": "Up to 30 hours (NC on)",
        "Quick Charge": "3 min charge = 3 hours playback",
        "Connectivity": "Bluetooth 5.2, multipoint pairing",
        "Microphones": "8 mics for calls and ANC",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: 'iPad Pro 12.9"',
      cat: "electronics",
      price: 112900,
      brand: "Apple",
      stock: 18,
      rating: 4.7,
      desc: "The iPad Pro with the M4 chip and Tandem OLED Liquid Retina XDR display is Apple's thinnest and most powerful iPad ever. It's ideal for illustration, video editing and note-taking with Apple Pencil Pro, and doubles as a full laptop replacement with the Magic Keyboard.",
      weight: 0.579,
      specs: {
        "Display": "12.9\" Tandem OLED Liquid Retina XDR",
        "Processor": "Apple M4 chip",
        "Storage Options": "256GB - 2TB",
        "Camera": "12MP wide + LiDAR scanner",
        "Battery Life": "Up to 10 hours",
        "Accessories": "Supports Apple Pencil Pro, Magic Keyboard",
        "Connectivity": "Wi-Fi 6E, optional 5G",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Dell XPS 15",
      cat: "electronics",
      price: 149990,
      brand: "Dell",
      stock: 12,
      rating: 4.6,
      desc: "The Dell XPS 15 pairs a stunning edge-to-edge OLED display with discrete graphics for creative professionals. Its CNC-machined aluminum chassis, near-invisible bezels and premium keyboard make it one of the most refined Windows laptops available.",
      weight: 1.86,
      specs: {
        "Display": "15.6\" 3.5K OLED touch",
        "Processor": "Intel Core i7 (13th Gen)",
        "Graphics": "NVIDIA RTX 4050 6GB",
        "Memory": "16GB - 64GB DDR5",
        "Storage": "512GB - 2TB SSD",
        "Battery Life": "Up to 13 hours",
        "Operating System": "Windows 11 Home",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "JBL Flip 6",
      cat: "electronics",
      price: 9499,
      brand: "JBL",
      stock: 60,
      rating: 4.5,
      desc: "The JBL Flip 6 delivers bold JBL Original Pro Sound in a rugged, IP67 waterproof and dustproof body you can take anywhere. Up to 12 hours of playtime and PartyBoost pairing make it a favorite for pool days, hikes and backyard parties alike.",
      weight: 0.55,
      specs: {
        "Speaker Type": "Portable Bluetooth speaker",
        "Output Power": "30W RMS",
        "Battery Life": "Up to 12 hours",
        "Water Resistance": "IP67 waterproof & dustproof",
        "Connectivity": "Bluetooth 5.1, PartyBoost",
        "Charging": "USB-C, 2.5 hours full charge",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Canon EOS R50",
      cat: "electronics",
      price: 67990,
      brand: "Canon",
      stock: 8,
      rating: 4.6,
      desc: "A lightweight mirrorless camera built for creators, the Canon EOS R50 offers 4K video, fast autofocus with subject tracking, and an intuitive vertical shooting mode for social content. It's an ideal entry point into interchangeable-lens photography.",
      weight: 0.375,
      specs: {
        "Sensor": "24.2MP APS-C CMOS",
        "Video": "4K UHD up to 30fps",
        "Autofocus": "Dual Pixel CMOS AF II, eye/subject tracking",
        "ISO Range": "100-32000 (expandable to 51200)",
        "Screen": "2.95\" vari-angle touchscreen",
        "Connectivity": "Wi-Fi, Bluetooth",
        "Lens Mount": "Canon RF mount",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: 'LG 4K OLED TV 55"',
      cat: "electronics",
      price: 129990,
      brand: "LG",
      stock: 5,
      rating: 4.8,
      desc: "LG's OLED evo panel delivers perfect blacks and infinite contrast, powered by the α9 AI processor for lifelike upscaling. With Dolby Vision, Dolby Atmos and a 120Hz refresh rate, it's a home-theatre and gaming powerhouse in one.",
      weight: 17.4,
      specs: {
        "Screen Size": "55 inches",
        "Panel Type": "OLED evo 4K",
        "Processor": "α9 AI Processor Gen6",
        "Refresh Rate": "120Hz, VRR, ALLM",
        "HDR": "Dolby Vision, HDR10, HLG",
        "Audio": "Dolby Atmos, 2.2ch 40W",
        "Smart Platform": "webOS 23",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Nintendo Switch OLED",
      cat: "electronics",
      price: 29990,
      brand: "Nintendo",
      stock: 30,
      rating: 4.7,
      desc: "The Nintendo Switch OLED model features a vivid 7-inch OLED screen, a wide adjustable stand and enhanced audio, all while keeping the flexibility to play docked, tabletop or handheld. Includes Joy-Con controllers for instant multiplayer fun.",
      weight: 0.42,
      specs: {
        "Display": "7\" OLED touchscreen",
        "Internal Storage": "64GB (expandable via microSD)",
        "Battery Life": "4.5 - 9 hours",
        "Modes": "TV, Tabletop, Handheld",
        "Controllers": "Detachable Joy-Con (L/R)",
        "Connectivity": "Wi-Fi, Bluetooth, wired LAN in dock",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Levi's 511 Slim Jeans",
      cat: "clothing",
      price: 3499,
      brand: "Levi's",
      stock: 100,
      rating: 4.4,
      desc: "A modern slim fit that sits below the waist and tapers from hip to ankle without being tight, the Levi's 511 is built from comfort-stretch denim that moves with you. A wardrobe staple that pairs equally well with sneakers or boots.",
      weight: 0.55,
      specs: {
        "Fit": "Slim, tapered leg",
        "Material": "99% Cotton, 1% Elastane",
        "Rise": "Below waist, sits close to skin",
        "Closure": "Zip fly, button closure",
        "Care Instructions": "Machine wash cold, tumble dry low",
        "Available Sizes": "28-40 (waist), 30-34 (length)",
      },
    },
    {
      name: "Nike Air Force 1",
      cat: "clothing",
      price: 8495,
      brand: "Nike",
      stock: 75,
      rating: 4.6,
      featured: true,
      desc: "The shoe that started it all. The Nike Air Force 1 pairs classic hoops style with a durable leather upper and Nike Air cushioning for all-day comfort. A crisp, versatile silhouette that has stayed a street-style icon for decades.",
      weight: 0.9,
      specs: {
        "Upper Material": "Full-grain leather",
        "Midsole": "Nike Air cushioning",
        "Outsole": "Rubber, pivot points for traction",
        "Closure": "Lace-up",
        "Style": "Low-top",
        "Available Sizes": "UK 6 - UK 12",
        "Care Instructions": "Wipe clean with damp cloth",
      },
    },
    {
      name: "Adidas Ultraboost 23",
      cat: "clothing",
      price: 14999,
      brand: "Adidas",
      stock: 50,
      rating: 4.7,
      desc: "Engineered for energy return, the Ultraboost 23 combines responsive BOOST midsole cushioning with a Primeknit+ upper that adapts to your foot. A Linear Energy Push system channels every stride forward, making it a favorite for daily training and long runs.",
      weight: 0.31,
      specs: {
        "Midsole": "BOOST cushioning",
        "Upper": "Primeknit+ adaptive knit",
        "Outsole": "Continental rubber, multi-surface traction",
        "Drop": "10mm heel-to-toe",
        "Best For": "Road running, daily training",
        "Available Sizes": "UK 5 - UK 13",
        "Care Instructions": "Spot clean, air dry",
      },
    },
    {
      name: "The North Face Jacket",
      cat: "clothing",
      price: 12999,
      brand: "The North Face",
      stock: 35,
      rating: 4.5,
      desc: "Built for unpredictable weather, this DryVent shell jacket is fully seam-sealed and waterproof-breathable, with an adjustable hood and pit zips for ventilation. A lightweight, packable layer for hiking, travel and everyday rain protection.",
      weight: 0.45,
      specs: {
        "Material": "DryVent 2.5L waterproof-breathable shell",
        "Waterproof Rating": "Fully seam-sealed, 10,000mm",
        "Features": "Adjustable hood, pit-zip vents",
        "Fit": "Regular fit",
        "Pockets": "2 hand pockets, 1 chest pocket",
        "Care Instructions": "Machine wash cold, do not iron",
        "Available Sizes": "S, M, L, XL, XXL",
      },
    },
    {
      name: "Zara Floral Dress",
      cat: "clothing",
      price: 2999,
      brand: "Zara",
      stock: 80,
      rating: 4.3,
      desc: "A flowing midi dress in a soft floral print, finished with a V-neckline and adjustable waist tie for a flattering silhouette. Lightweight and breathable, it transitions effortlessly from daytime brunches to evening events.",
      weight: 0.28,
      specs: {
        "Material": "100% Viscose",
        "Length": "Midi",
        "Neckline": "V-neck with tie detail",
        "Sleeve": "Short sleeve",
        "Care Instructions": "Hand wash cold, hang dry",
        "Available Sizes": "XS, S, M, L, XL",
      },
    },
    {
      name: "Puma Running T-Shirt",
      cat: "clothing",
      price: 1299,
      brand: "Puma",
      stock: 120,
      rating: 4.2,
      desc: "Built with Puma's dryCELL moisture-wicking technology, this lightweight running tee keeps you cool and dry on every run. Reflective details improve low-light visibility, while flatlock seams prevent chafing on longer distances.",
      weight: 0.14,
      specs: {
        "Material": "100% Recycled Polyester",
        "Technology": "dryCELL moisture-wicking",
        "Fit": "Regular, athletic cut",
        "Features": "Flatlock seams, reflective logo",
        "Care Instructions": "Machine wash cold, do not bleach",
        "Available Sizes": "S, M, L, XL, XXL",
      },
    },
    {
      name: "Ray-Ban Aviator",
      cat: "clothing",
      price: 9990,
      brand: "Ray-Ban",
      stock: 45,
      rating: 4.6,
      desc: "The original pilot sunglasses, reissued with polarized lenses that cut glare without distorting color. A thin metal frame and teardrop lens shape make this a timeless accessory for any face shape.",
      weight: 0.031,
      specs: {
        "Lens Type": "Polarized, G-15 green",
        "Frame Material": "Metal alloy",
        "UV Protection": "100% UVA/UVB protection",
        "Lens Width": "58mm",
        "Includes": "Case and cleaning cloth",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Atomic Habits",
      cat: "books",
      price: 499,
      brand: "Penguin",
      stock: 200,
      rating: 4.9,
      featured: true,
      desc: "James Clear's #1 bestseller reveals how tiny, consistent changes compound into remarkable results. Grounded in psychology and neuroscience, it offers a practical framework for building good habits and breaking bad ones — one percent at a time.",
      weight: 0.27,
      specs: {
        "Author": "James Clear",
        "Format": "Paperback",
        "Pages": "320",
        "Language": "English",
        "Publisher": "Penguin Random House",
        "ISBN": "978-1847941831",
        "Genre": "Self-help / Personal development",
      },
    },
    {
      name: "The Psychology of Money",
      cat: "books",
      price: 399,
      brand: "Jaico",
      stock: 180,
      rating: 4.8,
      desc: "Morgan Housel explores the strange ways people think about money through 19 short stories, showing that financial success is less about what you know and more about how you behave. A must-read on wealth, greed and happiness.",
      weight: 0.2,
      specs: {
        "Author": "Morgan Housel",
        "Format": "Paperback",
        "Pages": "242",
        "Language": "English",
        "Publisher": "Jaico Publishing House",
        "ISBN": "978-9390166268",
        "Genre": "Finance / Personal development",
      },
    },
    {
      name: "Clean Code",
      cat: "books",
      price: 699,
      brand: "O'Reilly",
      stock: 90,
      rating: 4.7,
      desc: "Robert C. Martin's classic guide teaches the principles, patterns and practices of writing readable, maintainable code. Packed with real-world case studies, it's essential reading for any developer who wants to write software that lasts.",
      weight: 0.45,
      specs: {
        "Author": "Robert C. Martin",
        "Format": "Paperback",
        "Pages": "464",
        "Language": "English",
        "Publisher": "Prentice Hall",
        "ISBN": "978-0132350884",
        "Genre": "Software engineering",
      },
    },
    {
      name: "System Design Interview",
      cat: "books",
      price: 849,
      brand: "Amazon KDP",
      stock: 150,
      rating: 4.8,
      desc: "An insider's guide to acing system design interviews, walking through the design of real large-scale systems like URL shorteners, chat apps and news feeds step by step. A favorite prep resource among engineers at top tech companies.",
      weight: 0.4,
      specs: {
        "Author": "Alex Xu",
        "Format": "Paperback",
        "Pages": "322",
        "Language": "English",
        "Publisher": "Independently published",
        "ISBN": "978-1736049112",
        "Genre": "Computer science / Interview prep",
      },
    },
    {
      name: "The Pragmatic Programmer",
      cat: "books",
      price: 799,
      brand: "O'Reilly",
      stock: 110,
      rating: 4.8,
      desc: "A timeless collection of tips and techniques for becoming a more effective, adaptable software developer, from managing technical debt to automating your workflow. This 20th-anniversary edition remains a rite of passage for programmers.",
      weight: 0.5,
      specs: {
        "Author": "David Thomas, Andrew Hunt",
        "Format": "Paperback",
        "Pages": "352",
        "Language": "English",
        "Publisher": "Addison-Wesley",
        "ISBN": "978-0135957059",
        "Genre": "Software engineering",
      },
    },
    {
      name: "Dune",
      cat: "books",
      price: 599,
      brand: "Hodder",
      stock: 160,
      rating: 4.7,
      desc: "Frank Herbert's epic tells the story of Paul Atreides on the desert planet Arrakis, the galaxy's only source of the precious spice melange. A sweeping saga of politics, religion and ecology that defined modern science fiction.",
      weight: 0.45,
      specs: {
        "Author": "Frank Herbert",
        "Format": "Paperback",
        "Pages": "688",
        "Language": "English",
        "Publisher": "Hodder Paperbacks",
        "ISBN": "978-1444727977",
        "Genre": "Science fiction",
      },
    },
    {
      name: "Instant Pot Duo 7-in-1",
      cat: "home-kitchen",
      price: 8999,
      brand: "Instant Pot",
      stock: 55,
      rating: 4.7,
      featured: true,
      desc: "One appliance replaces seven: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and warmer. 14 customizable smart programs make weeknight cooking effortless, while built-in safety features give total peace of mind.",
      weight: 5.4,
      specs: {
        "Capacity": "6 quarts (5.7 litres)",
        "Functions": "7-in-1: pressure cook, slow cook, sauté & more",
        "Smart Programs": "14 one-touch programs",
        "Material": "Stainless steel inner pot",
        "Power": "1000W",
        "Safety": "10+ built-in safety mechanisms",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Dyson V15 Vacuum",
      cat: "home-kitchen",
      price: 54900,
      brand: "Dyson",
      stock: 20,
      rating: 4.8,
      desc: "The Dyson V15 Detect uses a laser to reveal microscopic dust on hard floors and a piezo sensor to count and size particles in real time. With powerful cyclone suction and up to 60 minutes of runtime, deep cleaning has never been this precise.",
      weight: 3.0,
      specs: {
        "Type": "Cordless stick vacuum",
        "Suction": "230 AW (Air Watts)",
        "Runtime": "Up to 60 minutes",
        "Bin Capacity": "0.76 litres",
        "Filtration": "Whole-machine HEPA",
        "Special Feature": "Laser dust detection, piezo sensor",
        "Charging Time": "4.5 hours",
        "Warranty": "2-year manufacturer warranty",
      },
    },
    {
      name: "Nespresso Vertuo Pop",
      cat: "home-kitchen",
      price: 9999,
      brand: "Nespresso",
      stock: 40,
      rating: 4.5,
      desc: "Compact and colorful, the Vertuo Pop uses Centrifusion technology to brew five cup sizes at the touch of a button, from a rich espresso to a full-size mug. Automatic capsule recognition means perfect extraction every time.",
      weight: 2.7,
      specs: {
        "Brewing Technology": "Centrifusion",
        "Cup Sizes": "5 (Espresso to Alto)",
        "Water Tank": "0.6 litres",
        "Pressure": "Up to 5 bar",
        "Heat-up Time": "Less than 30 seconds",
        "Auto Shut-off": "After 9 minutes",
        "Warranty": "2-year manufacturer warranty",
      },
    },
    {
      name: "Le Creuset Dutch Oven",
      cat: "home-kitchen",
      price: 19990,
      brand: "Le Creuset",
      stock: 25,
      rating: 4.9,
      desc: "Hand-cast in France, this enameled cast iron Dutch oven distributes and retains heat with remarkable evenness, from a slow braise to a crusty loaf of bread. A kitchen heirloom built to be passed down for generations.",
      weight: 5.2,
      specs: {
        "Material": "Enameled cast iron",
        "Capacity": "5.3 litres (26cm)",
        "Compatible Cooktops": "Gas, electric, induction, oven",
        "Oven-Safe Temp": "Up to 260°C",
        "Origin": "Hand-cast in France",
        "Care Instructions": "Hand wash recommended",
        "Warranty": "Limited lifetime warranty",
      },
    },
    {
      name: "Philips Air Fryer",
      cat: "home-kitchen",
      price: 11999,
      brand: "Philips",
      stock: 60,
      rating: 4.6,
      desc: "Philips' Rapid Air technology circulates hot air to fry with up to 90% less fat than deep frying, without compromising on crunch. The digital touchscreen offers preset programs for fries, chicken, fish and baking.",
      weight: 4.1,
      specs: {
        "Capacity": "4.1 litres (fits for 2-4 people)",
        "Technology": "Rapid Air, Fat Removal Technology",
        "Power": "1400W",
        "Presets": "7 digital cooking programs",
        "Temperature Range": "40°C - 200°C",
        "Dishwasher Safe Parts": "Yes",
        "Warranty": "2-year manufacturer warranty",
      },
    },
    {
      name: "IKEA KALLAX Shelving",
      cat: "home-kitchen",
      price: 4999,
      brand: "IKEA",
      stock: 30,
      rating: 4.4,
      desc: "A versatile 4x4 cube shelving unit that works as a bookcase, room divider or TV bench. Its clean lines suit any room, and compatible inserts and boxes let you customize storage exactly how you need it.",
      weight: 29.5,
      specs: {
        "Configuration": "4x4 cube storage unit",
        "Dimensions": "147 x 147 x 39 cm",
        "Material": "Particleboard, fibreboard, foil",
        "Max Load per Shelf": "13 kg",
        "Assembly": "Flat-pack, tools included",
        "Orientation": "Can be used vertically or horizontally",
        "Warranty": "10-year limited warranty",
      },
    },
    {
      name: "Fitbit Charge 6",
      cat: "sports-fitness",
      price: 14999,
      brand: "Fitbit",
      stock: 70,
      rating: 4.5,
      featured: true,
      desc: "Fitbit's most advanced tracker adds built-in GPS, 40+ exercise modes and Google apps like Maps and Wallet on your wrist. With continuous heart-rate tracking and up to 7 days of battery life, it's a complete daily health companion.",
      weight: 0.037,
      specs: {
        "Display": "1.04\" AMOLED touchscreen",
        "Battery Life": "Up to 7 days",
        "GPS": "Built-in GPS",
        "Water Resistance": "50m water resistant",
        "Sensors": "Heart rate, SpO2, skin temperature",
        "Exercise Modes": "40+ modes",
        "Compatibility": "Android & iOS",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Yoga Mat Premium",
      cat: "sports-fitness",
      price: 2499,
      brand: "Liforme",
      stock: 90,
      rating: 4.7,
      desc: "Featuring a patented alignment system printed directly on the mat, this premium yoga mat helps you find the correct position for every pose. Eco-friendly natural rubber provides exceptional grip, even during the sweatiest sessions.",
      weight: 2.5,
      specs: {
        "Material": "Natural rubber, eco-polyurethane top",
        "Dimensions": "185 x 68 cm",
        "Thickness": "4.2 mm",
        "Special Feature": "AlignForMe positioning system",
        "Grip": "Sweat-resistant, non-slip surface",
        "Care Instructions": "Wipe clean with damp cloth",
      },
    },
    {
      name: "Whey Protein 5kg",
      cat: "sports-fitness",
      price: 4999,
      brand: "MuscleBlaze",
      stock: 100,
      rating: 4.6,
      desc: "A fast-absorbing whey protein isolate and concentrate blend delivering 25g of protein per serving to support muscle recovery and growth. Low in sugar and available in multiple flavors, it mixes smoothly into shakes, smoothies or oats.",
      weight: 5.0,
      specs: {
        "Type": "Whey protein isolate & concentrate blend",
        "Protein per Serving": "25g",
        "Servings per Container": "~166 (30g scoop)",
        "Flavors": "Chocolate, Vanilla, Cafe Mocha",
        "Added Sugar": "Low sugar formula",
        "Certification": "Lab tested, banned-substance free",
        "Shelf Life": "18 months from manufacture",
      },
    },
    {
      name: "Adjustable Dumbbell Set",
      cat: "sports-fitness",
      price: 12999,
      brand: "PowerBlock",
      stock: 25,
      rating: 4.8,
      desc: "Replace an entire rack of weights with one compact pair of dumbbells that adjusts from 5 to 52.5 lbs in seconds via a simple selector pin. A space-saving solution for strength training at home, from beginner to advanced lifters.",
      weight: 23.8,
      specs: {
        "Weight Range": "5 - 52.5 lbs per dumbbell (adjustable)",
        "Adjustment Mechanism": "Selector pin, tool-free",
        "Material": "Steel plates, rubber-coated handle",
        "Space Saved": "Replaces 15 pairs of dumbbells",
        "Included": "Pair of dumbbells + storage tray",
        "Warranty": "2-year manufacturer warranty",
      },
    },
    {
      name: "Resistance Bands Set",
      cat: "sports-fitness",
      price: 999,
      brand: "Boldfit",
      stock: 150,
      rating: 4.3,
      desc: "A set of five color-coded latex resistance bands, ranging from light to extra-heavy resistance, for strength training, mobility work and physical therapy. Compact and portable, they're a full home gym that fits in a drawer.",
      weight: 0.3,
      specs: {
        "Set Includes": "5 bands (light to extra-heavy)",
        "Material": "Natural latex",
        "Resistance Levels": "5-30 lbs across the set",
        "Use Cases": "Strength training, mobility, rehab",
        "Portable": "Includes carry pouch",
        "Care Instructions": "Wipe clean, keep away from sharp edges",
      },
    },
    {
      name: "Running Shoes X100",
      cat: "sports-fitness",
      price: 5999,
      brand: "ASICS",
      stock: 65,
      rating: 4.6,
      desc: "Engineered with ASICS GEL technology in the rearfoot and forefoot, the X100 absorbs shock on every stride while a breathable mesh upper keeps feet cool over long distances. A dependable daily trainer for road runners of all levels.",
      weight: 0.28,
      specs: {
        "Cushioning": "GEL technology (heel & forefoot)",
        "Upper Material": "Engineered breathable mesh",
        "Outsole": "AHAR high-abrasion rubber",
        "Drop": "10mm heel-to-toe",
        "Best For": "Road running, daily training",
        "Available Sizes": "UK 5 - UK 12",
        "Care Instructions": "Air dry, do not machine wash",
      },
    },
    {
      name: "Olay Regenerist Serum",
      cat: "beauty",
      price: 1299,
      brand: "Olay",
      stock: 110,
      rating: 4.4,
      featured: true,
      desc: "A lightweight, fast-absorbing serum formulated with niacinamide and amino-peptides to visibly firm skin and reduce the look of fine lines. Dermatologist-tested and fragrance-free, it fits easily into any daily skincare routine.",
      weight: 0.05,
      specs: {
        "Key Ingredients": "Niacinamide, Amino-Peptide Complex",
        "Volume": "50 ml",
        "Skin Type": "All skin types",
        "Benefits": "Firms skin, reduces fine lines",
        "Fragrance": "Fragrance-free",
        "Dermatologist Tested": "Yes",
        "Usage": "Apply morning and night after cleansing",
      },
    },
    {
      name: "MAC Ruby Woo Lipstick",
      cat: "beauty",
      price: 1850,
      brand: "MAC",
      stock: 80,
      rating: 4.7,
      desc: "MAC's most iconic shade, Ruby Woo is a vivid blue-red in a retro matte finish that flatters nearly every skin tone. Long-wearing and richly pigmented, it's a red-carpet staple that never goes out of style.",
      weight: 0.003,
      specs: {
        "Shade": "Ruby Woo (blue-red)",
        "Finish": "Retro Matte",
        "Net Weight": "3 g",
        "Formula": "Long-wearing, richly pigmented",
        "Skin Tone Match": "Universally flattering",
        "Cruelty-Free": "Yes",
      },
    },
    {
      name: "Dyson Airwrap",
      cat: "beauty",
      price: 44900,
      brand: "Dyson",
      stock: 15,
      rating: 4.6,
      desc: "The Dyson Airwrap uses controlled airflow — the Coanda effect — to curl, wave, smooth and dry hair with no extreme heat, reducing damage from styling. The multi-styler comes with interchangeable barrels and brushes for every hair type.",
      weight: 0.63,
      specs: {
        "Technology": "Air Multiplier, Coanda effect styling",
        "Attachments": "Barrels, smoothing brush, round brush",
        "Max Heat": "Intelligent heat control, no extreme heat",
        "Motor": "Dyson digital motor V9",
        "Cord Length": "2.8 m",
        "Suitable For": "Most hair types and lengths",
        "Warranty": "2-year manufacturer warranty",
      },
    },
    {
      name: "The Ordinary Niacinamide",
      cat: "beauty",
      price: 630,
      brand: "The Ordinary",
      stock: 200,
      rating: 4.5,
      desc: "A high-strength, targeted serum with 10% niacinamide and 1% zinc to visibly balance sebum activity and reduce the appearance of blemishes and congestion. A cult-favorite for oily and combination skin at an unbeatable price.",
      weight: 0.03,
      specs: {
        "Key Ingredients": "Niacinamide 10%, Zinc PCA 1%",
        "Volume": "30 ml",
        "Skin Type": "Oily, combination-prone skin",
        "Benefits": "Reduces blemishes, balances sebum",
        "Fragrance": "Fragrance-free",
        "Usage": "Apply AM and/or PM before heavier creams",
      },
    },
    {
      name: "Nivea SPF 50 Sunscreen",
      cat: "beauty",
      price: 350,
      brand: "Nivea",
      stock: 180,
      rating: 4.3,
      desc: "A lightweight, non-greasy sunscreen with broad-spectrum SPF 50 protection against UVA and UVB rays. Quickly absorbed with no white cast, it's suitable for daily use under makeup or on its own.",
      weight: 0.075,
      specs: {
        "SPF Rating": "SPF 50 / PA+++",
        "Volume": "75 ml",
        "Protection": "Broad-spectrum UVA/UVB",
        "Finish": "Non-greasy, no white cast",
        "Skin Type": "All skin types",
        "Water Resistance": "Water resistant up to 40 minutes",
      },
    },
    {
      name: "LEGO Technic Bugatti",
      cat: "toys-games",
      price: 17999,
      brand: "LEGO",
      stock: 20,
      rating: 4.9,
      desc: "A meticulously detailed 1:8 scale replica of the Bugatti Chiron with a working 8-speed gearbox, steering and a W16 engine with moving pistons. With 3,599 pieces, this is a showpiece build for serious LEGO Technic enthusiasts.",
      weight: 3.6,
      specs: {
        "Piece Count": "3,599 pieces",
        "Scale": "1:8 replica",
        "Age Range": "18+",
        "Features": "Working gearbox, steering, moving pistons",
        "Dimensions (Built)": "58 x 24 x 15 cm",
        "Series": "LEGO Technic",
      },
    },
    {
      name: "Monopoly Board Game",
      cat: "toys-games",
      price: 1499,
      brand: "Hasbro",
      stock: 85,
      rating: 4.3,
      desc: "The classic property-trading game where players buy, sell and trade their way to bankrupting opponents. A timeless family game night staple that's introduced generations to the thrill (and rivalry) of real estate tycoonery.",
      weight: 1.1,
      specs: {
        "Players": "2-8 players",
        "Age Range": "8+",
        "Play Time": "60-180 minutes",
        "Includes": "Board, tokens, cards, play money, dice",
        "Category": "Family strategy board game",
      },
    },
    {
      name: "Barbie Dreamhouse",
      cat: "toys-games",
      price: 11999,
      brand: "Mattel",
      stock: 18,
      rating: 4.5,
      desc: "A three-story dollhouse packed with a working elevator, pool with slide, and over 75 pieces of furniture and accessories. Lights and sounds bring imaginative play to life across ten distinct play areas.",
      weight: 8.2,
      specs: {
        "Stories": "3-story dollhouse",
        "Included Pieces": "75+ furniture & accessory pieces",
        "Features": "Working elevator, pool with slide, lights & sounds",
        "Age Range": "3-7 years",
        "Assembled Dimensions": "116 x 44 x 109 cm",
        "Power": "Requires 3x AA batteries (included)",
      },
    },
    {
      name: "Hot Wheels 20-Car Pack",
      cat: "toys-games",
      price: 999,
      brand: "Mattel",
      stock: 120,
      rating: 4.6,
      desc: "A pack of 20 die-cast Hot Wheels vehicles featuring a mix of muscle cars, trucks and fantasy rides in 1:64 scale. Great for building a collection, racing on tracksets, or gifting to any car-loving kid.",
      weight: 0.9,
      specs: {
        "Included": "20 die-cast vehicles",
        "Scale": "1:64",
        "Material": "Die-cast metal body, plastic chassis",
        "Age Range": "3+",
        "Compatibility": "Works with Hot Wheels tracksets",
      },
    },
    {
      name: "Chess Set Wooden",
      cat: "toys-games",
      price: 2999,
      brand: "WE Games",
      stock: 40,
      rating: 4.7,
      desc: "A handcrafted wooden chess set with tournament-weighted pieces felted for smooth movement and a folding board that doubles as storage. Elegant enough for display, sturdy enough for serious play.",
      weight: 1.4,
      specs: {
        "Material": "Solid wood, felt-bottomed pieces",
        "Board Size": "38 x 38 cm (folding)",
        "King Height": "9.5 cm, weighted base",
        "Storage": "Pieces store inside folding board",
        "Recommended Age": "6+",
      },
    },
    {
      name: 'Michelin Wiper Blade 24"',
      cat: "automotive",
      price: 799,
      brand: "Michelin",
      stock: 90,
      rating: 4.5,
      desc: "A premium beam-style wiper blade with an aerodynamic profile that reduces wind lift at highway speeds. The precision-cut rubber edge delivers streak-free wiping in rain, sleet and snow.",
      weight: 0.15,
      specs: {
        "Blade Length": "24 inches",
        "Type": "Beam blade (frameless)",
        "Material": "Natural rubber wiping edge",
        "Compatibility": "Universal hook-style arms",
        "Weather Rating": "All-season performance",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Car Dash Cam 4K",
      cat: "automotive",
      price: 7999,
      brand: "Garmin",
      stock: 45,
      rating: 4.6,
      desc: "Record crystal-clear 4K footage with built-in GPS tagging, automatic incident detection and parking mode monitoring. Voice control lets you save footage hands-free, so you always have evidence when it matters most.",
      weight: 0.12,
      specs: {
        "Video Resolution": "4K UHD @ 30fps",
        "Field of View": "140 degrees",
        "GPS": "Built-in, speed & location tagging",
        "Storage": "microSD, up to 256GB (not included)",
        "Special Features": "Incident detection, parking mode, voice control",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Portable Tyre Inflator",
      cat: "automotive",
      price: 2499,
      brand: "Lifelong",
      stock: 75,
      rating: 4.4,
      desc: "A digital air compressor that plugs into your 12V socket and inflates a tyre from flat to full in minutes. The built-in pressure gauge and auto shut-off take the guesswork out of roadside emergencies.",
      weight: 0.85,
      specs: {
        "Max Pressure": "150 PSI",
        "Power Source": "12V DC car socket",
        "Display": "Digital pressure gauge",
        "Auto Shut-off": "Yes, at preset pressure",
        "Cord Length": "3 m power cord",
        "Included": "Inflator, adapter nozzles, carry bag",
        "Warranty": "1-year manufacturer warranty",
      },
    },
    {
      name: "Car Seat Organizer",
      cat: "automotive",
      price: 699,
      brand: "AmazonBasics",
      stock: 130,
      rating: 4.2,
      desc: "A multi-pocket organizer that hangs on the back of any car seat, keeping tablets, tissues, water bottles and snacks within easy reach. Durable, water-resistant fabric holds up to daily family road trips.",
      weight: 0.4,
      specs: {
        "Material": "Water-resistant polyester",
        "Pockets": "9 multi-size storage pockets",
        "Mounting": "Adjustable straps, universal fit",
        "Compatible With": "Most car seat headrests",
        "Care Instructions": "Wipe clean with damp cloth",
      },
    },
    {
      name: "Bluetooth OBD2 Scanner",
      cat: "automotive",
      price: 1999,
      brand: "BAFX",
      stock: 55,
      rating: 4.4,
      desc: "Plug this compact scanner into your car's OBD2 port to read and clear check-engine codes straight from your smartphone over Bluetooth. Works with most third-party diagnostic apps for real-time engine data on Android and iOS.",
      weight: 0.08,
      specs: {
        "Connectivity": "Bluetooth 4.0",
        "Compatibility": "OBD2 vehicles (1996+), Android & iOS",
        "Functions": "Read/clear codes, live data stream",
        "Power Source": "Powered via OBD2 port",
        "App Support": "Torque, Car Scanner, and more",
        "Warranty": "1-year manufacturer warranty",
      },
    },
  ];
  const productIds = [];
  for (let i = 0; i < productData.length; i++) {
    const p = productData[i];
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const skuPrefix =
      (p.brand || "GEN").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() ||
      "GEN";
    const sku = `${skuPrefix}-${String(i + 1).padStart(4, "0")}`;
    const { rows } = await pool.query(
      `INSERT INTO products (name, slug, description, price, category_id, brand, stock, avg_rating, is_active, is_featured, sku, weight, specifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12)
       ON CONFLICT (slug) DO UPDATE SET
         price=EXCLUDED.price, stock=EXCLUDED.stock, description=EXCLUDED.description,
         is_featured=EXCLUDED.is_featured, sku=EXCLUDED.sku, weight=EXCLUDED.weight,
         specifications=EXCLUDED.specifications, avg_rating=EXCLUDED.avg_rating
       RETURNING id`,
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
        sku,
        p.weight || null,
        JSON.stringify(p.specs || {}),
      ],
    );
    productIds.push(rows[0].id);
  }

  // ── Dummy reviews for every product ────────────────────────────────────────
  const reviewers = users.filter((u) => u.role === "customer");
  const reviewPool = {
    5: [
      {
        title: "Exceeded my expectations",
        body: "Genuinely impressed with the build quality and how it performs day to day. Arrived well packaged and set up in minutes. Would buy again without hesitation.",
      },
      {
        title: "Worth every rupee",
        body: "Was on the fence about the price but it's clear where the money went. Feels premium and works exactly as described.",
      },
      {
        title: "Best purchase this year",
        body: "I've tried a few alternatives before and this is easily the best one. Highly recommend to anyone comparing options.",
      },
      {
        title: "Perfect, no complaints",
        body: "Does exactly what it promises. Fast delivery too. Five stars all the way.",
      },
    ],
    4: [
      {
        title: "Great value overall",
        body: "Really solid product for the price. A couple of minor niggles but nothing that affects daily use. Would recommend.",
      },
      {
        title: "Happy with this",
        body: "Works well and looks good. Docked one star only because I expected slightly better packaging.",
      },
      {
        title: "Good buy",
        body: "Does the job well. Took a star off for a small learning curve when I first set it up, but no regrets.",
      },
    ],
    3: [
      {
        title: "Decent, does the job",
        body: "It's fine — not amazing, not bad. Meets the basic requirement but doesn't particularly stand out from cheaper options.",
      },
      {
        title: "Average experience",
        body: "Works as expected most of the time. Had one hiccup during setup that took a bit of troubleshooting.",
      },
    ],
    2: [
      {
        title: "Expected more for the price",
        body: "It works, but the quality feels below what the price suggests. Might look at alternatives next time.",
      },
    ],
  };
  const ratingWeights = [
    { r: 5, w: 5 },
    { r: 4, w: 4 },
    { r: 3, w: 2 },
    { r: 2, w: 1 },
  ];
  const pickRating = (seed) => {
    const total = ratingWeights.reduce((s, x) => s + x.w, 0);
    let n = seed % total;
    for (const { r, w } of ratingWeights) {
      if (n < w) return r;
      n -= w;
    }
    return 5;
  };
  let reviewSeed = 0;
  for (let pi = 0; pi < productData.length; pi++) {
    const p = productData[pi];
    const productId = productIds[pi];
    const baseRating = Math.round(p.rating || 4.5);
    const reviewCount = 4 + (pi % 5); // 4-8 reviews per product
    for (let j = 0; j < reviewCount; j++) {
      reviewSeed++;
      const reviewer = reviewers[(pi + j) % reviewers.length];
      const userId = userRows[reviewer.email];
      // Bias ratings around the product's seeded rating, occasionally lower.
      let rating = j === 0 ? baseRating : pickRating(reviewSeed);
      rating = Math.max(1, Math.min(5, rating));
      const bucket = reviewPool[rating] || reviewPool[3];
      const pick = bucket[reviewSeed % bucket.length];
      const daysAgo = 3 + ((reviewSeed * 7) % 85);
      const verified = reviewSeed % 5 !== 0;
      await pool.query(
        `INSERT INTO reviews (product_id, user_id, rating, title, body, status, verified_purchase, created_at)
         VALUES ($1,$2,$3,$4,$5,'approved',$6, NOW() - ($7 || ' days')::interval)
         ON CONFLICT (product_id, user_id) DO UPDATE SET
           rating=EXCLUDED.rating, title=EXCLUDED.title, body=EXCLUDED.body,
           verified_purchase=EXCLUDED.verified_purchase, created_at=EXCLUDED.created_at`,
        [productId, userId, rating, pick.title, pick.body, verified, String(daysAgo)],
      );
    }
  }
  // Recompute avg_rating / review_count for every product from real review rows.
  await pool.query(`
    UPDATE products p SET
      avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews r WHERE r.product_id = p.id AND r.status = 'approved'), 0),
      review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'approved')
  `);
  const coupons = [
    {
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      desc: "Welcome 10% off",
      limit: 100,
      perUser: 1,
      expires: daysFromNow(90),
    },
    {
      code: "FLAT500",
      type: "fixed",
      value: 500,
      desc: "Flat 500 off orders above 2000",
      limit: 50,
      minOrder: 2000,
      expires: daysFromNow(90),
    },
    {
      code: "SUMMER25",
      type: "percentage",
      value: 25,
      desc: "25% summer sale",
      limit: 200,
      maxDiscount: 1000,
      expires: daysFromNow(60),
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
      expires: daysFromNow(75),
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
      // Not expired — this coupon should fail on usage-limit exhaustion
      // (COUPON_EXHAUSTED), not on expiry, so the two failure modes stay
      // distinguishable for testing.
      expires: daysFromNow(90),
    },
  ];
  for (const c of coupons) {
    await pool.query(
      `INSERT INTO coupons (code, type, value, description, usage_limit, per_user_limit, min_order_amt, max_discount, expires_at, usage_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (code) DO UPDATE SET value=EXCLUDED.value, expires_at=EXCLUDED.expires_at, usage_count=EXCLUDED.usage_count, usage_limit=EXCLUDED.usage_limit`,
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
