/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog endpoints
 */

const router = require("express").Router();
const { query } = require("../config/database");
const {
  authenticate,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// ─── Multer Setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/products");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  },
});

// ─── List Products ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products with filtering, sorting, and pagination
 *     tags: [Products]
 *     parameters:
 *       - { in: query, name: page,      schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,     schema: { type: integer, default: 12 } }
 *       - { in: query, name: search,    schema: { type: string } }
 *       - { in: query, name: category,  schema: { type: string } }
 *       - { in: query, name: minPrice,  schema: { type: number } }
 *       - { in: query, name: maxPrice,  schema: { type: number } }
 *       - { in: query, name: rating,    schema: { type: number } }
 *       - { in: query, name: inStock,   schema: { type: boolean } }
 *       - { in: query, name: featured,  schema: { type: boolean } }
 *       - { in: query, name: sort,      schema: { type: string, enum: [price_asc, price_desc, rating_desc, newest, popular, name_asc] } }
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      inStock,
      featured,
      brand,
      sort = "newest",
      tags,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ["p.is_active = true"];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR p.brand ILIKE $${paramIdx})`,
      );
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category) {
      conditions.push(`c.slug = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }
    if (minPrice) {
      conditions.push(`p.price >= $${paramIdx}`);
      params.push(parseFloat(minPrice));
      paramIdx++;
    }
    if (maxPrice) {
      conditions.push(`p.price <= $${paramIdx}`);
      params.push(parseFloat(maxPrice));
      paramIdx++;
    }
    if (rating) {
      conditions.push(`p.avg_rating >= $${paramIdx}`);
      params.push(parseFloat(rating));
      paramIdx++;
    }
    if (inStock === "true") conditions.push("p.stock > 0");
    if (featured === "true") conditions.push("p.is_featured = true");
    if (brand) {
      conditions.push(`p.brand ILIKE $${paramIdx}`);
      params.push(`%${brand}%`);
      paramIdx++;
    }
    if (tags) {
      conditions.push(`$${paramIdx} = ANY(p.tags)`);
      params.push(tags);
      paramIdx++;
    }

    const sortMap = {
      price_asc: "p.price ASC",
      price_desc: "p.price DESC",
      rating_desc: "p.avg_rating DESC",
      newest: "p.created_at DESC",
      popular: "p.sold_count DESC",
      name_asc: "p.name ASC",
    };
    const orderBy = sortMap[sort] || "p.created_at DESC";
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);

    const { rows: products } = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params,
    );

    const pages = Math.ceil(total / parseInt(limit));
    res.json({
      products,
      total,
      page: parseInt(page),
      pages,
      hasNext: parseInt(page) < pages,
      hasPrev: parseInt(page) > 1,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Featured Products ────────────────────────────────────────────────────────
router.get("/featured", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_featured = true AND p.is_active = true
       ORDER BY p.sold_count DESC LIMIT 8`,
    );
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/categories", async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `);
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Search Suggestions ───────────────────────────────────────────────────────
router.get("/search/suggestions", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });
    const { rows } = await query(
      `SELECT name, slug, thumbnail, price FROM products
       WHERE name ILIKE $1 AND is_active = true LIMIT 8`,
      [`%${q}%`],
    );
    res.json({ suggestions: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Single Product ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details by ID or slug
 *     tags: [Products]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product details }
 *       404: { description: Product not found }
 */
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const { rows } = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (p.slug = $1 ${isUUID ? "OR p.id = $2" : ""})`,
      isUUID ? [id, id] : [id],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" });
    }

    const product = rows[0];

    const { rows: variants } = await query(
      "SELECT * FROM product_variants WHERE product_id = $1",
      [product.id],
    );
    const { rows: reviews } = await query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC LIMIT 5`,
      [product.id],
    );
    const { rows: related } = await query(
      `SELECT id, name, slug, price, thumbnail, avg_rating, review_count
       FROM products
       WHERE category_id = $1 AND id != $2 AND is_active = true LIMIT 4`,
      [product.category_id, product.id],
    );

    res.json({ product: { ...product, variants, reviews, related } });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: Create Product ────────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  requireAdmin,
  upload.array("images", 5),
  async (req, res, next) => {
    try {
      const {
        name,
        description,
        shortDesc,
        price,
        comparePrice,
        costPrice,
        sku,
        categoryId,
        brand,
        tags,
        stock,
        weight,
        dimensions,
        isFeatured,
        metaTitle,
        metaDesc,
      } = req.body;

      const slug =
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
      const images =
        req.files?.map((f) => `/uploads/products/${f.filename}`) || [];
      const thumbnail = images[0] || null;

      const { rows } = await query(
        `
      INSERT INTO products (
        name, slug, description, short_desc, price, compare_price, cost_price,
        sku, category_id, brand, tags, stock, weight, dimensions,
        images, thumbnail, is_featured, meta_title, meta_desc
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *
    `,
        [
          name,
          slug,
          description || null,
          shortDesc || null,
          parseFloat(price),
          parseFloat(comparePrice || 0),
          parseFloat(costPrice || 0),
          sku || null,
          categoryId || null,
          brand || null,
          tags ? tags.split(",").map((t) => t.trim()) : [],
          parseInt(stock || 0),
          parseFloat(weight || 0),
          dimensions ? JSON.parse(dimensions) : null,
          images,
          thumbnail,
          isFeatured === "true",
          metaTitle || null,
          metaDesc || null,
        ],
      );

      res.status(201).json({ product: rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Admin: Update Product ────────────────────────────────────────────────────
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  upload.array("images", 5),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        stock,
        brand,
        categoryId,
        isFeatured,
        comparePrice,
      } = req.body;
      const newImages =
        req.files?.map((f) => `/uploads/products/${f.filename}`) || [];

      const { rows: existing } = await query(
        "SELECT * FROM products WHERE id = $1",
        [id],
      );
      if (!existing.length)
        return res.status(404).json({ error: "Product not found" });

      const existingImages = existing[0].images || [];
      const allImages =
        newImages.length > 0
          ? [...existingImages, ...newImages]
          : existingImages;
      const thumbnail =
        newImages.length > 0 ? newImages[0] : existing[0].thumbnail;

      const { rows } = await query(
        `
      UPDATE products SET
        name=$1, description=$2, price=$3, stock=$4, is_active=true,
        is_featured=$5, images=$6, thumbnail=$7, brand=$8,
        category_id=$9, compare_price=$10, updated_at=NOW()
      WHERE id=$11 RETURNING *
    `,
        [
          name || existing[0].name,
          description || existing[0].description,
          parseFloat(price || existing[0].price),
          parseInt(stock || existing[0].stock),
          isFeatured === "true" || existing[0].is_featured,
          allImages,
          thumbnail,
          brand || existing[0].brand,
          categoryId || existing[0].category_id,
          parseFloat(comparePrice || existing[0].compare_price || 0),
          id,
        ],
      );

      res.json({ product: rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Admin: Delete Product ────────────────────────────────────────────────────
router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    await query("UPDATE products SET is_active = false WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ message: "Product deactivated successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: Toggle Stock ──────────────────────────────────────────────────────
router.patch(
  "/:id/stock",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { stock } = req.body;
      const { rows } = await query(
        "UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, stock",
        [parseInt(stock), req.params.id],
      );
      if (!rows.length)
        return res.status(404).json({ error: "Product not found" });
      res.json({ product: rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
