// ═══════════════════ REVIEWS ═══════════════════
/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Product reviews and ratings
 *   - name: Users
 *     description: User profile and addresses
 *   - name: Admin
 *     description: Admin panel operations
 *   - name: Coupons
 *     description: Coupon validation
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get product reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product UUID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, highest, lowest, helpful]
 *           default: newest
 *     responses:
 *       200:
 *         description: List of reviews with rating summary
 *         content:
 *           application/json:
 *             example:
 *               reviews: []
 *               total: 5
 *               avgRating: 4.2
 *               distribution: [{rating: 5, count: 3}, {rating: 4, count: 2}]
 *   post:
 *     summary: Add a product review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             productId: "product-uuid"
 *             rating: 5
 *             title: "Excellent product!"
 *             body: "Really happy with this purchase."
 *     responses:
 *       201:
 *         description: Review added
 *       409:
 *         description: Already reviewed
 *         content:
 *           application/json:
 *             example:
 *               error: "You have already reviewed this product"
 *               code: "ALREADY_REVIEWED"
 */

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Edit your review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             rating: 4
 *             title: "Updated title"
 *             body: "Changed my mind slightly"
 *     responses:
 *       200:
 *         description: Review updated
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 */

/**
 * @swagger
 * /api/reviews/{id}/helpful:
 *   post:
 *     summary: Mark review as helpful
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Helpful count incremented
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             firstName: "John"
 *             lastName: "Doe"
 *             phone: "9876543210"
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /api/users/addresses:
 *   get:
 *     summary: Get saved addresses
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved addresses
 *   post:
 *     summary: Add new address
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             label: "Home"
 *             fullName: "John Doe"
 *             phone: "9876543210"
 *             line1: "123 Main St"
 *             city: "Bengaluru"
 *             state: "Karnataka"
 *             postalCode: "560001"
 *             country: "India"
 *             isDefault: true
 *     responses:
 *       201:
 *         description: Address created
 */

/**
 * @swagger
 * /api/users/wishlist:
 *   get:
 *     summary: Get wishlist
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist items
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             productId: "product-uuid"
 *     responses:
 *       201:
 *         description: Added to wishlist
 */

/**
 * @swagger
 * /api/users/wishlist/{productId}:
 *   delete:
 *     summary: Remove from wishlist
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed from wishlist
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: "[Admin] Get dashboard statistics"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             example:
 *               stats:
 *                 total_users: 10
 *                 total_products: 52
 *                 total_orders: 25
 *                 total_revenue: "49500.00"
 *                 pending_orders: 3
 *                 out_of_stock: 2
 *               recentOrders: []
 *               salesChart: []
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: "[Admin] List all users"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, admin]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, locked, banned, pending_verification]
 *     responses:
 *       200:
 *         description: List of users
 */

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: "[Admin] Update user status or role"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
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
 *             ban:
 *               summary: Ban a user
 *               value:
 *                 status: "banned"
 *             unban:
 *               summary: Unban a user
 *               value:
 *                 status: "active"
 *             makeAdmin:
 *               summary: Make admin
 *               value:
 *                 role: "admin"
 *     responses:
 *       200:
 *         description: User updated
 */

/**
 * @swagger
 * /api/admin/coupons:
 *   get:
 *     summary: "[Admin] List all coupons"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All coupons
 *   post:
 *     summary: "[Admin] Create new coupon"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             percentage:
 *               summary: Percentage discount
 *               value:
 *                 code: "SUMMER25"
 *                 type: "percentage"
 *                 value: 25
 *                 usageLimit: 100
 *                 minOrderAmt: 500
 *                 maxDiscount: 1000
 *                 expiresAt: "2025-12-31"
 *             fixed:
 *               summary: Fixed amount discount
 *               value:
 *                 code: "FLAT500"
 *                 type: "fixed"
 *                 value: 500
 *                 usageLimit: 50
 *                 minOrderAmt: 2000
 *     responses:
 *       201:
 *         description: Coupon created
 */

/**
 * @swagger
 * /api/admin/coupons/{id}:
 *   put:
 *     summary: "[Admin] Update coupon"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: Coupon updated
 *   delete:
 *     summary: "[Admin] Delete coupon"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted
 */

/**
 * @swagger
 * /api/admin/analytics/revenue:
 *   get:
 *     summary: "[Admin] Revenue analytics"
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Revenue data by date
 */

/**
 * @swagger
 * /api/coupons/validate/{code}:
 *   get:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: WELCOME10
 *     responses:
 *       200:
 *         description: Coupon is valid
 *         content:
 *           application/json:
 *             example:
 *               coupon:
 *                 code: "WELCOME10"
 *                 type: "percentage"
 *                 value: 10
 *                 minOrderAmt: "0.00"
 *       404:
 *         description: Invalid coupon
 *       400:
 *         description: Coupon usage limit reached
 */

const reviewRouter = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

reviewRouter.get('/', async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 10, sort = 'newest' } = req.query;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const sortMap = { newest: 'r.created_at DESC', highest: 'r.rating DESC', lowest: 'r.rating ASC', helpful: 'r.helpful_count DESC' };
    const orderBy = sortMap[sort] || 'r.created_at DESC';
    const { rows } = await query(`
      SELECT r.*, u.first_name, u.last_name, u.avatar_url
      FROM reviews r JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1 AND r.status = 'approved'
      ORDER BY ${orderBy} LIMIT $2 OFFSET $3
    `, [productId, parseInt(limit), offset]);
    const { rows: [{ count, avg }] } = await query(
      "SELECT COUNT(*) as count, AVG(rating)::DECIMAL(3,2) as avg FROM reviews WHERE product_id=$1 AND status='approved'", [productId]
    );
    const { rows: dist } = await query(
      "SELECT rating, COUNT(*) as count FROM reviews WHERE product_id=$1 AND status='approved' GROUP BY rating ORDER BY rating DESC", [productId]
    );
    res.json({ reviews: rows, total: parseInt(count), avgRating: parseFloat(avg || 0), distribution: dist, page: parseInt(page) });
  } catch (err) { next(err); }
});

reviewRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { productId, rating, title, body, orderId } = req.body;
    if (!productId || !rating) return res.status(400).json({ error: 'productId and rating required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1-5' });
    const { rows: existing } = await query('SELECT id FROM reviews WHERE product_id=$1 AND user_id=$2', [productId, req.user.id]);
    if (existing.length) return res.status(409).json({ error: 'You have already reviewed this product', code: 'ALREADY_REVIEWED' });
    const verifiedPurchase = orderId ? true : false;
    const { rows } = await query(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, title, body, verified_purchase)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [productId, req.user.id, orderId || null, rating, title, body, verifiedPurchase]
    );
    await query(`UPDATE products SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE product_id=$1 AND status='approved'), review_count = (SELECT COUNT(*) FROM reviews WHERE product_id=$1 AND status='approved') WHERE id=$1`, [productId]);
    res.status(201).json({ review: rows[0] });
  } catch (err) { next(err); }
});

reviewRouter.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { rating, title, body } = req.body;
    const { rows } = await query('UPDATE reviews SET rating=$1, title=$2, body=$3, updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING *', [rating, title, body, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Review not found or not yours' });
    res.json({ review: rows[0] });
  } catch (err) { next(err); }
});

reviewRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query("DELETE FROM reviews WHERE id=$1 AND (user_id=$2 OR $3='admin') RETURNING product_id", [req.params.id, req.user.id, req.user.role]);
    if (!rows.length) return res.status(404).json({ error: 'Review not found' });
    await query(`UPDATE products SET avg_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id=$1 AND status='approved'), 0), review_count = (SELECT COUNT(*) FROM reviews WHERE product_id=$1 AND status='approved') WHERE id=$1`, [rows[0].product_id]);
    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
});

reviewRouter.post('/:id/helpful', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id=$1 RETURNING helpful_count', [req.params.id]);
    res.json({ helpfulCount: rows[0]?.helpful_count });
  } catch (err) { next(err); }
});

module.exports.reviewRouter = reviewRouter;

// ═══════════════════ USERS ═══════════════════
const userRouter = require('express').Router();

userRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, email, first_name, last_name, phone, role, status, avatar_url, created_at FROM users WHERE id=$1', [req.user.id]);
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

userRouter.put('/me', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const { rows } = await query('UPDATE users SET first_name=$1, last_name=$2, phone=$3, updated_at=NOW() WHERE id=$4 RETURNING id, email, first_name, last_name, phone', [firstName, lastName, phone, req.user.id]);
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

userRouter.get('/addresses', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    res.json({ addresses: rows });
  } catch (err) { next(err); }
});

userRouter.post('/addresses', authenticate, async (req, res, next) => {
  try {
    const { label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault } = req.body;
    if (isDefault) await query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);
    const { rows } = await query(
      `INSERT INTO addresses (user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, label||'Home', fullName, phone, line1, line2||null, city, state, postalCode, country||'India', isDefault||false]
    );
    res.status(201).json({ address: rows[0] });
  } catch (err) { next(err); }
});

userRouter.delete('/addresses/:id', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Address deleted' });
  } catch (err) { next(err); }
});

userRouter.get('/wishlist', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT w.id, p.* FROM wishlists w JOIN products p ON w.product_id=p.id WHERE w.user_id=$1', [req.user.id]);
    res.json({ wishlist: rows });
  } catch (err) { next(err); }
});

userRouter.post('/wishlist', authenticate, async (req, res, next) => {
  try {
    const { productId } = req.body;
    await query('INSERT INTO wishlists (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, productId]);
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) { next(err); }
});

userRouter.delete('/wishlist/:productId', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM wishlists WHERE user_id=$1 AND product_id=$2', [req.user.id, req.params.productId]);
    res.json({ message: 'Removed from wishlist' });
  } catch (err) { next(err); }
});

module.exports.userRouter = userRouter;

// ═══════════════════ ADMIN ═══════════════════
const adminRouter = require('express').Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/dashboard', async (req, res, next) => {
  try {
    const { rows: [stats] } = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role='customer') as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW()-INTERVAL '7 days') as new_users_week,
        (SELECT COUNT(*) FROM products WHERE is_active=true) as total_products,
        (SELECT COUNT(*) FROM products WHERE stock = 0) as out_of_stock,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE status='pending') as pending_orders,
        (SELECT SUM(total) FROM orders WHERE payment_status='paid') as total_revenue,
        (SELECT SUM(total) FROM orders WHERE payment_status='paid' AND created_at > NOW()-INTERVAL '30 days') as revenue_month
    `);
    const { rows: recentOrders } = await query(`SELECT o.order_number, o.total, o.status, o.created_at, u.email FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC LIMIT 5`);
    const { rows: salesChart } = await query(`SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders FROM orders WHERE created_at > NOW()-INTERVAL '30 days' AND payment_status='paid' GROUP BY DATE(created_at) ORDER BY date`);
    res.json({ stats, recentOrders, salesChart });
  } catch (err) { next(err); }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1'; const params = []; let idx = 1;
    if (search) { where += ` AND (email ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (role)   { where += ` AND role=$${idx++}`; params.push(role); }
    if (status) { where += ` AND status=$${idx++}`; params.push(status); }
    const { rows } = await query(`SELECT id, email, first_name, last_name, role, status, created_at, last_login, login_attempts FROM users ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, parseInt(limit), offset]);
    const { rows: [{ count }] } = await query(`SELECT COUNT(*) FROM users ${where}`, params);
    res.json({ users: rows, total: parseInt(count) });
  } catch (err) { next(err); }
});

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const { rows } = await query('UPDATE users SET status=COALESCE($1,status), role=COALESCE($2,role), updated_at=NOW() WHERE id=$3 RETURNING id, email, status, role', [status, role, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

adminRouter.get('/coupons', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ coupons: rows });
  } catch (err) { next(err); }
});

adminRouter.post('/coupons', async (req, res, next) => {
  try {
    const { code, type, value, description, usageLimit, perUserLimit, minOrderAmt, maxDiscount, expiresAt } = req.body;
    const { rows } = await query(
      `INSERT INTO coupons (code, type, value, description, usage_limit, per_user_limit, min_order_amt, max_discount, expires_at, created_by)
       VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [code, type, value, description, usageLimit||null, perUserLimit||1, minOrderAmt||0, maxDiscount||null, expiresAt||null, req.user.id]
    );
    res.status(201).json({ coupon: rows[0] });
  } catch (err) { next(err); }
});

adminRouter.put('/coupons/:id', async (req, res, next) => {
  try {
    const { isActive, expiresAt, usageLimit } = req.body;
    const { rows } = await query('UPDATE coupons SET is_active=COALESCE($1,is_active), expires_at=COALESCE($2,expires_at), usage_limit=COALESCE($3,usage_limit) WHERE id=$4 RETURNING *', [isActive, expiresAt, usageLimit, req.params.id]);
    res.json({ coupon: rows[0] });
  } catch (err) { next(err); }
});

adminRouter.delete('/coupons/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM coupons WHERE id=$1', [req.params.id]);
    res.json({ message: 'Coupon deleted' });
  } catch (err) { next(err); }
});

adminRouter.post('/categories', async (req, res, next) => {
  try {
    const { name, description, imageUrl, sortOrder } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { rows } = await query('INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *', [name, slug, description, imageUrl, sortOrder||0]);
    res.status(201).json({ category: rows[0] });
  } catch (err) { next(err); }
});

adminRouter.get('/analytics/revenue', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';
    const { rows } = await query(`SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders, AVG(total) as avg_order FROM orders WHERE created_at > NOW()-INTERVAL '${interval}' AND payment_status='paid' GROUP BY DATE(created_at) ORDER BY date`);
    res.json({ data: rows, period });
  } catch (err) { next(err); }
});

module.exports.adminRouter = adminRouter;

// ═══════════════════ COUPONS ═══════════════════
const couponRouter = require('express').Router();

couponRouter.get('/validate/:code', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM coupons WHERE code=UPPER($1) AND is_active=true AND (expires_at IS NULL OR expires_at > NOW())", [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Invalid coupon', code: 'INVALID_COUPON' });
    const c = rows[0];
    if (c.usage_limit && c.usage_count >= c.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit reached', code: 'COUPON_EXHAUSTED' });
    }
    res.json({ coupon: { code: c.code, type: c.type, value: c.value, description: c.description, minOrderAmt: c.min_order_amt } });
  } catch (err) { next(err); }
});

module.exports.couponRouter = couponRouter;
