/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order (checkout)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress, paymentMethod]
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 example:
 *                   fullName: "John Doe"
 *                   phone: "9876543210"
 *                   line1: "123 Main Street"
 *                   city: "Bengaluru"
 *                   state: "Karnataka"
 *                   postalCode: "560001"
 *                   country: "India"
 *               deliveryMethod:
 *                 type: string
 *                 enum: [standard, express, overnight, pickup]
 *                 default: standard
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, upi, paypal, cod]
 *               paymentData:
 *                 type: object
 *                 description: "For credit_card: {cardNumber, expiry, cvv, name}. For upi: {upiId}"
 *                 example:
 *                   cardNumber: "4111111111111111"
 *                   expiry: "12/25"
 *                   cvv: "123"
 *                   name: "JOHN DOE"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Order placed successfully"
 *               order:
 *                 id: "uuid"
 *                 order_number: "ORD-LJZ2K8-AB12"
 *                 status: "confirmed"
 *                 payment_status: "paid"
 *                 total: 1581.82
 *       402:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             examples:
 *               declined:
 *                 summary: Card declined
 *                 value:
 *                   error: "Payment declined. Insufficient funds."
 *                   code: "PAYMENT_FAILED"
 *                   paymentError: "INSUFFICIENT_FUNDS"
 *               expired:
 *                 summary: Card expired
 *                 value:
 *                   error: "Card expired."
 *                   code: "PAYMENT_FAILED"
 *                   paymentError: "EXPIRED_CARD"
 *               upi:
 *                 summary: UPI failed
 *                 value:
 *                   error: "UPI payment failed"
 *                   code: "PAYMENT_FAILED"
 *                   paymentError: "UPI_FAILED"
 *   get:
 *     summary: Get user order history
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *     responses:
 *       200:
 *         description: List of orders
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details with items and tracking history
 *     tags: [Orders]
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
 *         description: Full order details
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
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
 *             reason: "Changed my mind"
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel order in current status
 *         content:
 *           application/json:
 *             example:
 *               error: "Cannot cancel order in 'shipped' status"
 *               code: "CANNOT_CANCEL"
 */

/**
 * @swagger
 * /api/orders/{id}/return:
 *   post:
 *     summary: Request order return (only delivered orders)
 *     tags: [Orders]
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
 *             reason: "Product damaged"
 *     responses:
 *       200:
 *         description: Return requested
 *       400:
 *         description: Order not delivered yet
 */

/**
 * @swagger
 * /api/orders/{id}/track:
 *   get:
 *     summary: Track order with timeline
 *     tags: [Orders]
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
 *         description: Order tracking info with timeline
 */

/**
 * @swagger
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: Get invoice data for an order
 *     tags: [Orders]
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
 *         description: Invoice data
 */

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: "[Admin] Get all orders"
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           description: Search by order number or customer email
 *     responses:
 *       200:
 *         description: All orders
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /api/orders/admin/{id}/status:
 *   put:
 *     summary: "[Admin] Update order status"
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
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
 *           example:
 *             status: "shipped"
 *             comment: "Dispatched via FedEx"
 *             trackingNumber: "FX123456789"
 *     responses:
 *       200:
 *         description: Status updated
 */

const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

router.post('/', authenticate, async (req, res, next) => {
  const client = await require('../config/database').getPool().connect();
  try {
    const { shippingAddress, deliveryMethod = 'standard', paymentMethod, paymentData } = req.body;
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ error: 'shippingAddress and paymentMethod required' });
    }
    const { rows: cartRows } = await query('SELECT * FROM carts WHERE user_id = $1', [req.user.id]);
    if (!cartRows.length) return res.status(400).json({ error: 'Cart is empty', code: 'EMPTY_CART' });
    const cart = cartRows[0];
    const { rows: cartItems } = await query(
      `SELECT ci.*, p.name, p.price, p.stock, p.thumbnail
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`, [cart.id]
    );
    if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty', code: 'EMPTY_CART' });
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({ error: `${item.name} has insufficient stock`, code: 'INSUFFICIENT_STOCK', productId: item.product_id });
      }
    }
    let paymentStatus = 'paid';
    let paymentRef = `PAY-${Date.now()}`;
    if (paymentMethod === 'credit_card' && paymentData?.cardNumber) {
      const failCards = ['4000000000000002', '4000000000009995'];
      if (failCards.includes(paymentData.cardNumber.replace(/\s/g, ''))) {
        return res.status(402).json({ error: 'Payment declined. Insufficient funds.', code: 'PAYMENT_FAILED', paymentError: 'INSUFFICIENT_FUNDS' });
      }
      if (paymentData.cardNumber === '4000000000000069') {
        return res.status(402).json({ error: 'Card expired.', code: 'PAYMENT_FAILED', paymentError: 'EXPIRED_CARD' });
      }
    }
    if (paymentMethod === 'upi' && paymentData?.upiId === 'fail@upi') {
      return res.status(402).json({ error: 'UPI payment failed', code: 'PAYMENT_FAILED', paymentError: 'UPI_FAILED' });
    }
    const subtotal = cartItems.reduce((sum, i) => sum + (i.quantity * parseFloat(i.price)), 0);
    const shippingCost = deliveryMethod === 'express' ? 149 : deliveryMethod === 'overnight' ? 299 : subtotal > 500 ? 0 : 49;
    let discountAmt = 0;
    if (cart.coupon_id) {
      const { rows: [coupon] } = await query('SELECT * FROM coupons WHERE id = $1', [cart.coupon_id]);
      if (coupon) {
        discountAmt = coupon.type === 'percentage' ? subtotal * parseFloat(coupon.value) / 100 : parseFloat(coupon.value);
        if (coupon.max_discount) discountAmt = Math.min(discountAmt, parseFloat(coupon.max_discount));
      }
    }
    const taxAmt = (subtotal - discountAmt) * 0.18;
    const total = subtotal - discountAmt + shippingCost + taxAmt;
    const orderNumber = generateOrderNumber();
    await client.query('BEGIN');
    const { rows: [order] } = await client.query(`
      INSERT INTO orders (order_number, user_id, status, payment_status, payment_method, payment_ref, delivery_method, shipping_address, subtotal, discount_amt, shipping_cost, tax_amt, total, coupon_id, estimated_delivery)
      VALUES ($1,$2,'confirmed',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW() + INTERVAL '7 days') RETURNING *
    `, [orderNumber, req.user.id, paymentStatus, paymentMethod, paymentRef, deliveryMethod, JSON.stringify(shippingAddress), subtotal.toFixed(2), discountAmt.toFixed(2), shippingCost.toFixed(2), taxAmt.toFixed(2), total.toFixed(2), cart.coupon_id || null]);
    for (const item of cartItems) {
      await client.query('INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [order.id, item.product_id, item.name, item.quantity, item.price, (item.quantity * item.price).toFixed(2), item.thumbnail]);
      await client.query('UPDATE products SET stock = stock - $1, sold_count = sold_count + $2 WHERE id = $3', [item.quantity, item.quantity, item.product_id]);
    }
    await client.query('INSERT INTO order_status_history (order_id, status, comment) VALUES ($1, $2, $3)', [order.id, 'confirmed', 'Order placed and payment confirmed']);
    if (cart.coupon_id) await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [cart.coupon_id]);
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
    await client.query('UPDATE carts SET coupon_id = null WHERE id = $1', [cart.id]);
    await client.query('COMMIT');
    res.status(201).json({ order, message: 'Order placed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = 'WHERE o.user_id = $1';
    const params = [req.user.id];
    if (status) { whereClause += ` AND o.status = $${params.length + 1}`; params.push(status); }
    const { rows } = await query(
      `SELECT o.*, COUNT(oi.id) as item_count FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
       ${whereClause} GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );
    const { rows: [{ count }] } = await query(`SELECT COUNT(*) FROM orders o ${whereClause}`, params);
    res.json({ orders: rows, total: parseInt(count), page: parseInt(page) });
  } catch (err) { next(err); }
});

router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (status) { where += ` AND o.status = $${idx++}`; params.push(status); }
    if (search) { where += ` AND (o.order_number ILIKE $${idx} OR u.email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    const { rows } = await query(
      `SELECT o.*, u.email, u.first_name, u.last_name, COUNT(oi.id) as item_count
       FROM orders o JOIN users u ON o.user_id = u.id LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where} GROUP BY o.id, u.id ORDER BY o.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );
    res.json({ orders: rows });
  } catch (err) { next(err); }
});

router.put('/admin/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, comment, trackingNumber } = req.body;
    const validStatuses = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded','returned'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status', validStatuses });
    const { rows } = await query(
      `UPDATE orders SET status=$1, tracking_number=COALESCE($2, tracking_number), updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, trackingNumber, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    await query('INSERT INTO order_status_history (order_id, status, comment, updated_by) VALUES ($1,$2,$3,$4)',
      [req.params.id, status, comment || `Status updated to ${status}`, req.user.id]);
    res.json({ order: rows[0] });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    const { rows: history } = await query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC', [order.id]);
    res.json({ order: { ...order, items, history } });
  } catch (err) { next(err); }
});

router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const { rows } = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];
    if (!['pending','confirmed','processing'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot cancel order in '${order.status}' status`, code: 'CANNOT_CANCEL' });
    }
    await query(`UPDATE orders SET status='cancelled', cancelled_at=NOW(), cancel_reason=$1, updated_at=NOW() WHERE id=$2`,
      [reason || 'Customer requested cancellation', order.id]);
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    for (const item of items) {
      await query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
    }
    await query('INSERT INTO order_status_history (order_id, status, comment, updated_by) VALUES ($1, $2, $3, $4)',
      [order.id, 'cancelled', reason || 'Cancelled by customer', req.user.id]);
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) { next(err); }
});

router.post('/:id/return', authenticate, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const { rows } = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    if (rows[0].status !== 'delivered') return res.status(400).json({ error: 'Only delivered orders can be returned', code: 'CANNOT_RETURN' });
    await query("UPDATE orders SET status='return_requested', return_reason=$1 WHERE id=$2", [reason, rows[0].id]);
    res.json({ message: 'Return request submitted successfully' });
  } catch (err) { next(err); }
});

router.get('/:id/track', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*, array_agg(json_build_object('status', h.status, 'comment', h.comment, 'time', h.created_at) ORDER BY h.created_at) as timeline
       FROM orders o LEFT JOIN order_status_history h ON h.order_id = o.id
       WHERE o.id = $1 AND o.user_id = $2 GROUP BY o.id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ tracking: rows[0] });
  } catch (err) { next(err); }
});

router.get('/:id/invoice', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT o.*, u.email, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1 AND o.user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [rows[0].id]);
    res.json({ invoice: { order: rows[0], items } });
  } catch (err) { next(err); }
});

module.exports = router;
