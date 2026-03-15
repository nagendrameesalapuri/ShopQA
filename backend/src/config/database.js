const { Pool } = require('pg');

let pool;

const connectDB = async () => {
  pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'shopqa',
    user:     process.env.DB_USER     || 'shopqa_user',
    password: process.env.DB_PASSWORD || 'shopqa_pass',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');
    client.release();
    await initSchema();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    throw err;
  }
};

const getPool = () => {
  if (!pool) throw new Error('Database not connected. Call connectDB() first.');
  return pool;
};

const query = (text, params) => getPool().query(text, params);

// ─── Schema Initialization ────────────────────────────────────────────────────
const initSchema = async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";

    -- ENUMS
    DO $$ BEGIN
      CREATE TYPE user_role    AS ENUM ('customer', 'admin');
      CREATE TYPE user_status  AS ENUM ('active', 'locked', 'pending_verification', 'banned');
      CREATE TYPE order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled','refunded','return_requested','returned');
      CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
      CREATE TYPE payment_method AS ENUM ('credit_card','debit_card','upi','paypal','cod');
      CREATE TYPE delivery_method AS ENUM ('standard','express','overnight','pickup');
      CREATE TYPE review_status AS ENUM ('pending','approved','rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- USERS
    CREATE TABLE IF NOT EXISTS users (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email             VARCHAR(255) UNIQUE NOT NULL,
      password_hash     VARCHAR(255),
      first_name        VARCHAR(100) NOT NULL,
      last_name         VARCHAR(100) NOT NULL,
      phone             VARCHAR(20),
      role              user_role NOT NULL DEFAULT 'customer',
      status            user_status NOT NULL DEFAULT 'pending_verification',
      avatar_url        TEXT,
      email_verified    BOOLEAN DEFAULT FALSE,
      verification_token VARCHAR(255),
      reset_token       VARCHAR(255),
      reset_token_expires TIMESTAMPTZ,
      login_attempts    INTEGER DEFAULT 0,
      locked_until      TIMESTAMPTZ,
      social_provider   VARCHAR(50),
      social_id         VARCHAR(255),
      last_login        TIMESTAMPTZ,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );

    -- CATEGORIES
    CREATE TABLE IF NOT EXISTS categories (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name        VARCHAR(100) UNIQUE NOT NULL,
      slug        VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      image_url   TEXT,
      parent_id   UUID REFERENCES categories(id),
      is_active   BOOLEAN DEFAULT TRUE,
      sort_order  INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    -- PRODUCTS
    CREATE TABLE IF NOT EXISTS products (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name          VARCHAR(255) NOT NULL,
      slug          VARCHAR(255) UNIQUE NOT NULL,
      description   TEXT,
      short_desc    VARCHAR(500),
      price         DECIMAL(10,2) NOT NULL,
      compare_price DECIMAL(10,2),
      cost_price    DECIMAL(10,2),
      sku           VARCHAR(100) UNIQUE,
      barcode       VARCHAR(100),
      category_id   UUID REFERENCES categories(id),
      brand         VARCHAR(100),
      tags          TEXT[],
      stock         INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      weight        DECIMAL(8,3),
      dimensions    JSONB,
      images        TEXT[],
      thumbnail     TEXT,
      is_active     BOOLEAN DEFAULT TRUE,
      is_featured   BOOLEAN DEFAULT FALSE,
      avg_rating    DECIMAL(3,2) DEFAULT 0,
      review_count  INTEGER DEFAULT 0,
      sold_count    INTEGER DEFAULT 0,
      meta_title    VARCHAR(255),
      meta_desc     TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_price    ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_rating   ON products(avg_rating);
    CREATE INDEX IF NOT EXISTS idx_products_search   ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description,'')));

    -- PRODUCT VARIANTS
    CREATE TABLE IF NOT EXISTS product_variants (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name       VARCHAR(100) NOT NULL,
      value      VARCHAR(100) NOT NULL,
      price_adj  DECIMAL(10,2) DEFAULT 0,
      stock      INTEGER DEFAULT 0,
      sku        VARCHAR(100)
    );

    -- ADDRESSES
    CREATE TABLE IF NOT EXISTS addresses (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label        VARCHAR(50) DEFAULT 'Home',
      full_name    VARCHAR(200) NOT NULL,
      phone        VARCHAR(20) NOT NULL,
      line1        VARCHAR(255) NOT NULL,
      line2        VARCHAR(255),
      city         VARCHAR(100) NOT NULL,
      state        VARCHAR(100) NOT NULL,
      postal_code  VARCHAR(20) NOT NULL,
      country      VARCHAR(100) NOT NULL DEFAULT 'India',
      is_default   BOOLEAN DEFAULT FALSE,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    -- COUPONS
    CREATE TABLE IF NOT EXISTS coupons (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code           VARCHAR(50) UNIQUE NOT NULL,
      description    TEXT,
      type           VARCHAR(20) NOT NULL DEFAULT 'percentage',
      value          DECIMAL(10,2) NOT NULL,
      min_order_amt  DECIMAL(10,2) DEFAULT 0,
      max_discount   DECIMAL(10,2),
      usage_limit    INTEGER,
      usage_count    INTEGER DEFAULT 0,
      per_user_limit INTEGER DEFAULT 1,
      applicable_to  VARCHAR(20) DEFAULT 'all',
      category_ids   UUID[],
      product_ids    UUID[],
      is_active      BOOLEAN DEFAULT TRUE,
      starts_at      TIMESTAMPTZ DEFAULT NOW(),
      expires_at     TIMESTAMPTZ,
      created_by     UUID REFERENCES users(id),
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    -- CART
    CREATE TABLE IF NOT EXISTS carts (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
      session_id VARCHAR(255),
      coupon_id  UUID REFERENCES coupons(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id),
      variant_id UUID REFERENCES product_variants(id),
      quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      price      DECIMAL(10,2) NOT NULL,
      added_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(cart_id, product_id, variant_id)
    );

    -- ORDERS
    CREATE TABLE IF NOT EXISTS orders (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_number     VARCHAR(20) UNIQUE NOT NULL,
      user_id          UUID NOT NULL REFERENCES users(id),
      status           order_status NOT NULL DEFAULT 'pending',
      payment_status   payment_status NOT NULL DEFAULT 'pending',
      payment_method   payment_method,
      payment_ref      VARCHAR(255),
      delivery_method  delivery_method DEFAULT 'standard',
      shipping_address JSONB NOT NULL,
      subtotal         DECIMAL(10,2) NOT NULL,
      discount_amt     DECIMAL(10,2) DEFAULT 0,
      shipping_cost    DECIMAL(10,2) DEFAULT 0,
      tax_amt          DECIMAL(10,2) DEFAULT 0,
      total            DECIMAL(10,2) NOT NULL,
      coupon_id        UUID REFERENCES coupons(id),
      coupon_code      VARCHAR(50),
      notes            TEXT,
      tracking_number  VARCHAR(100),
      estimated_delivery TIMESTAMPTZ,
      delivered_at     TIMESTAMPTZ,
      cancelled_at     TIMESTAMPTZ,
      cancel_reason    TEXT,
      return_reason    TEXT,
      invoice_url      TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id  UUID NOT NULL REFERENCES products(id),
      variant_id  UUID REFERENCES product_variants(id),
      product_name VARCHAR(255) NOT NULL,
      quantity    INTEGER NOT NULL,
      unit_price  DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      image_url   TEXT
    );

    -- ORDER STATUS HISTORY (for tracking)
    CREATE TABLE IF NOT EXISTS order_status_history (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status     order_status NOT NULL,
      comment    TEXT,
      updated_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- REVIEWS
    CREATE TABLE IF NOT EXISTS reviews (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id    UUID NOT NULL REFERENCES users(id),
      order_id   UUID REFERENCES orders(id),
      rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title      VARCHAR(200),
      body       TEXT,
      images     TEXT[],
      status     review_status DEFAULT 'approved',
      helpful_count INTEGER DEFAULT 0,
      verified_purchase BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, user_id)
    );

    -- REFRESH TOKENS
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      VARCHAR(500) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked    BOOLEAN DEFAULT FALSE,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- AUDIT LOG
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID REFERENCES users(id),
      action     VARCHAR(100) NOT NULL,
      entity     VARCHAR(50),
      entity_id  UUID,
      old_data   JSONB,
      new_data   JSONB,
      ip_address INET,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- WISHLIST
    CREATE TABLE IF NOT EXISTS wishlists (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      added_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
  `);

  console.log('✅ Database schema initialized');
};

module.exports = { connectDB, query, getPool };
