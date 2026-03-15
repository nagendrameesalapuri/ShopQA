/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart operations
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get current user cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart with items and totals
 *         content:
 *           application/json:
 *             example:
 *               cart:
 *                 subtotal: 1299.00
 *                 discount: 129.90
 *                 shipping: 0
 *                 tax: 233.82
 *                 total: 1402.92
 *                 itemCount: 2
 *       401:
 *         description: Unauthorized - missing token
 */

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "paste-a-product-uuid-here"
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added
 *         content:
 *           application/json:
 *             example:
 *               message: "Item added to cart"
 *       400:
 *         description: Out of stock
 *         content:
 *           application/json:
 *             example:
 *               error: "Product out of stock"
 *               code: "OUT_OF_STOCK"
 */

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   put:
 *     summary: Update item quantity
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed
 *         content:
 *           application/json:
 *             example:
 *               message: "Item removed from cart"
 */

/**
 * @swagger
 * /api/cart/coupon:
 *   post:
 *     summary: Apply coupon code
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "WELCOME10"
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Coupon applied"
 *               coupon:
 *                 code: "WELCOME10"
 *                 type: "percentage"
 *                 value: 10
 *                 discount: 129.90
 *       400:
 *         description: Invalid coupon
 *         content:
 *           application/json:
 *             examples:
 *               invalid:
 *                 summary: Invalid or expired coupon
 *                 value:
 *                   error: "Invalid or expired coupon"
 *                   code: "INVALID_COUPON"
 *               alreadyUsed:
 *                 summary: Already used
 *                 value:
 *                   error: "You have already used this coupon"
 *                   code: "COUPON_ALREADY_USED"
 *               minOrder:
 *                 summary: Min order not met
 *                 value:
 *                   error: "Minimum order amount 2000 required"
 *                   code: "MIN_ORDER_NOT_MET"
 *   delete:
 *     summary: Remove coupon from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon removed
 */

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */

const router = require("express").Router();
const { query } = require("../config/database");
const { authenticate } = require("../middleware/auth");

const getOrCreateCart = async (userId) => {
  let { rows } = await query("SELECT * FROM carts WHERE user_id = $1", [
    userId,
  ]);
  if (!rows.length) {
    const result = await query(
      "INSERT INTO carts (user_id) VALUES ($1) RETURNING *",
      [userId],
    );
    rows = result.rows;
  }
  return rows[0];
};

const getCartTotal = async (cartId) => {
  const { rows } = await query(
    `
    SELECT ci.*, p.name, p.thumbnail, p.stock,
      (ci.quantity * ci.price) as item_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $1
  `,
    [cartId],
  );
  const subtotal = rows.reduce(
    (sum, item) => sum + parseFloat(item.item_total),
    0,
  );
  return { items: rows, subtotal };
};

router.get("/", authenticate, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const { items, subtotal } = await getCartTotal(cart.id);
    let discount = 0,
      coupon = null;
    if (cart.coupon_id) {
      const { rows } = await query("SELECT * FROM coupons WHERE id = $1", [
        cart.coupon_id,
      ]);
      if (rows.length) {
        coupon = rows[0];
        discount =
          coupon.type === "percentage"
            ? (subtotal * parseFloat(coupon.value)) / 100
            : parseFloat(coupon.value);
        if (coupon.max_discount)
          discount = Math.min(discount, parseFloat(coupon.max_discount));
      }
    }
    const shipping = subtotal > 500 ? 0 : 49;
    const tax = (subtotal - discount) * 0.18;
    const total = subtotal - discount + shipping + tax;
    res.json({
      cart: {
        id: cart.id,
        items,
        coupon,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/items", authenticate, async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    if (!productId)
      return res.status(400).json({ error: "productId required" });
    const {
      rows: [product],
    } = await query(
      "SELECT * FROM products WHERE id = $1 AND is_active = true",
      [productId],
    );
    if (!product)
      return res
        .status(404)
        .json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
    if (product.stock < 1)
      return res
        .status(400)
        .json({ error: "Product out of stock", code: "OUT_OF_STOCK" });
    if (quantity > product.stock) {
      return res
        .status(400)
        .json({
          error: `Only ${product.stock} items available`,
          code: "INSUFFICIENT_STOCK",
          available: product.stock,
        });
    }
    const cart = await getOrCreateCart(req.user.id);
    const { rows: existing } = await query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cart.id, productId],
    );
    if (existing.length) {
      const newQty = existing[0].quantity + parseInt(quantity);
      if (newQty > product.stock)
        return res
          .status(400)
          .json({
            error: `Only ${product.stock} items available`,
            code: "INSUFFICIENT_STOCK",
          });
      await query("UPDATE cart_items SET quantity = $1 WHERE id = $2", [
        newQty,
        existing[0].id,
      ]);
    } else {
      await query(
        "INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price) VALUES ($1,$2,$3,$4,$5)",
        [
          cart.id,
          productId,
          variantId || null,
          parseInt(quantity),
          product.price,
        ],
      );
    }
    res.status(201).json({ message: "Item added to cart" });
  } catch (err) {
    next(err);
  }
});

router.put("/items/:itemId", authenticate, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    const { rows } = await query(
      "SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = $1 AND ci.cart_id = $2",
      [req.params.itemId, cart.id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Cart item not found" });
    if (quantity > rows[0].stock)
      return res
        .status(400)
        .json({
          error: `Only ${rows[0].stock} available`,
          code: "INSUFFICIENT_STOCK",
        });
    await query("UPDATE cart_items SET quantity = $1 WHERE id = $2", [
      parseInt(quantity),
      req.params.itemId,
    ]);
    res.json({ message: "Cart updated" });
  } catch (err) {
    next(err);
  }
});

router.delete("/items/:itemId", authenticate, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await query("DELETE FROM cart_items WHERE id = $1 AND cart_id = $2", [
      req.params.itemId,
      cart.id,
    ]);
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    next(err);
  }
});

router.post("/coupon", authenticate, async (req, res, next) => {
  try {
    const { code } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    const { subtotal } = await getCartTotal(cart.id);
    const { rows } = await query(
      `SELECT * FROM coupons WHERE code = UPPER($1) AND is_active = true
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      [code],
    );
    if (!rows.length)
      return res
        .status(400)
        .json({ error: "Invalid or expired coupon", code: "INVALID_COUPON" });
    const coupon = rows[0];
    if (subtotal < parseFloat(coupon.min_order_amt)) {
      return res
        .status(400)
        .json({
          error: `Minimum order amount ${coupon.min_order_amt} required`,
          code: "MIN_ORDER_NOT_MET",
        });
    }
    const { rows: userUsage } = await query(
      "SELECT COUNT(*) FROM orders WHERE user_id = $1 AND coupon_id = $2",
      [req.user.id, coupon.id],
    );
    if (parseInt(userUsage[0].count) >= (coupon.per_user_limit || 1)) {
      return res
        .status(400)
        .json({
          error: "You have already used this coupon",
          code: "COUPON_ALREADY_USED",
        });
    }
    await query("UPDATE carts SET coupon_id = $1 WHERE id = $2", [
      coupon.id,
      cart.id,
    ]);
    const discount =
      coupon.type === "percentage"
        ? Math.min(
            (subtotal * parseFloat(coupon.value)) / 100,
            parseFloat(coupon.max_discount || Infinity),
          )
        : parseFloat(coupon.value);
    res.json({
      message: "Coupon applied",
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/coupon", authenticate, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await query("UPDATE carts SET coupon_id = null WHERE id = $1", [cart.id]);
    res.json({ message: "Coupon removed" });
  } catch (err) {
    next(err);
  }
});

router.delete("/", authenticate, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
