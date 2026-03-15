import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/common/StarRating";
import { toast } from "react-toastify";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);
  const isOOS = product.stock === 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="home-product-card" data-testid="featured-product-card">
      <Link to={`/products/${product.slug || product.id}`}>
        <div className="home-product-img-wrap">
          <img
            src={
              product.thumbnail
                ? `https://shopqa-backend.onrender.com${product.thumbnail}`
                : `https://picsum.photos/seed/${product.id}/300/300`
            }
            alt={product.name}
            loading="lazy"
            data-testid="featured-product-image"
          />
          {isOOS && <div className="oos-tag">Out of Stock</div>}
          {product.compare_price > product.price && (
            <div className="sale-tag">
              {Math.round((1 - product.price / product.compare_price) * 100)}%
              OFF
            </div>
          )}
        </div>
        <div className="home-product-info">
          <p className="home-product-cat">{product.category_name}</p>
          <h4 className="home-product-name" data-testid="featured-product-name">
            {product.name}
          </h4>
          <div className="home-product-rating">
            <StarRating
              rating={parseFloat(product.avg_rating) || 0}
              size="sm"
            />
            <span className="rating-count">({product.review_count || 0})</span>
          </div>
          <div className="home-product-prices">
            <span className="home-price" data-testid="featured-product-price">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
            {product.compare_price > product.price && (
              <span className="home-compare">
                ₹{Number(product.compare_price).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>
      <button
        className={`btn ${isOOS ? "btn-outline" : "btn-accent"} btn-full home-add-btn`}
        onClick={handleAdd}
        disabled={isOOS || adding}
        data-testid="featured-add-to-cart"
      >
        {adding ? (
          <span className="spinner spinner-sm" />
        ) : isOOS ? (
          "🚫 Out of Stock"
        ) : (
          "🛒 Add to Cart"
        )}
      </button>
    </div>
  );
}

function CategoryCard({ category }) {
  const icons = {
    electronics: "📱",
    clothing: "👗",
    books: "📚",
    "home-kitchen": "🏠",
    "sports-fitness": "🏋️",
    beauty: "💄",
    "toys-games": "🎮",
    automotive: "🚗",
  };
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="cat-card"
      data-testid="category-card"
    >
      <div className="cat-icon">{icons[category.slug] || "🛍"}</div>
      <p className="cat-name">{category.name}</p>
      <p className="cat-count">{category.product_count} items</p>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 50,
    users: "1K+",
    orders: "5K+",
    rating: "4.8",
  });

  useEffect(() => {
    Promise.all([
      api.get("/products/featured"),
      api.get("/products/categories"),
    ])
      .then(([featRes, catRes]) => {
        setFeatured(featRes.data.products || []);
        setCategories(catRes.data.categories || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim())
      navigate(`/products?search=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <div className="home-page" data-testid="home-page">
      {/* ── Hero ── */}
      <section className="hero" data-testid="hero-section">
        <div className="hero-bg" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge" data-testid="hero-badge">
              🎉 Built for QA Engineers
            </div>
            <h1 className="hero-title" data-testid="hero-title">
              Practice
              <br />
              <span className="hero-accent">Real Automation</span>
              <br />
              on Real E-Commerce
            </h1>
            <p className="hero-desc" data-testid="hero-desc">
              50+ products, full checkout flow, payment simulation, admin panel,
              and dedicated QA helper APIs. Everything you need to master test
              automation.
            </p>

            <form
              onSubmit={handleSearch}
              className="hero-search"
              role="search"
              data-testid="hero-search-form"
            >
              <input
                type="search"
                className="hero-search-input"
                placeholder="Search products, brands, categories…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                data-testid="hero-search-input"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="btn btn-accent hero-search-btn"
                data-testid="hero-search-btn"
              >
                Search
              </button>
            </form>

            <div className="hero-tags" data-testid="hero-tags">
              {[
                "iPhone 15",
                "MacBook Air",
                "Nike Shoes",
                "Atomic Habits",
                "Instant Pot",
              ].map((tag) => (
                <button
                  key={tag}
                  className="hero-tag"
                  onClick={() => navigate(`/products?search=${tag}`)}
                  data-testid={`hero-tag-${tag.replace(/\s/g, "-").toLowerCase()}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div
            className="hero-illustration"
            data-testid="hero-illustration"
            aria-hidden="true"
          >
            <div className="hero-card hero-card-1">
              <div className="hc-icon">📱</div>
              <div>
                <p className="hc-name">iPhone 15 Pro</p>
                <p className="hc-price">₹1,34,900</p>
              </div>
              <div className="hc-badge">⭐ 4.8</div>
            </div>
            <div className="hero-card hero-card-2">
              <div className="hc-icon">💻</div>
              <div>
                <p className="hc-name">MacBook Air M3</p>
                <p className="hc-price">₹1,14,900</p>
              </div>
              <div className="hc-badge success">✓ In Stock</div>
            </div>
            <div className="hero-card hero-card-3">
              <div className="hc-icon">🎧</div>
              <div>
                <p className="hc-name">Sony WH-1000XM5</p>
                <p className="hc-price">₹29,990</p>
              </div>
              <div className="hc-badge">🛒 Added</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="stats-bar" data-testid="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {[
              { label: "Products", value: "50+", icon: "📦" },
              { label: "Test Scenarios", value: "100+", icon: "🧪" },
              { label: "API Endpoints", value: "40+", icon: "🔌" },
              { label: "Avg Rating", value: "4.8★", icon: "⭐" },
            ].map((s) => (
              <div key={s.label} className="stat-item" data-testid="stat-item">
                <span className="stat-icon-sm">{s.icon}</span>
                <span className="stat-value-sm" data-testid="stat-value">
                  {s.value}
                </span>
                <span className="stat-label-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section" data-testid="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <Link
              to="/products"
              className="section-link"
              data-testid="view-all-categories"
            >
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="cat-grid">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="skeleton cat-skeleton" />
                ))}
            </div>
          ) : (
            <div className="cat-grid" data-testid="category-grid">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="section section-alt" data-testid="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">⭐ Featured Products</h2>
            <Link
              to="/products?featured=true"
              className="section-link"
              data-testid="view-all-featured"
            >
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="home-products-grid">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 380, borderRadius: 12 }}
                  />
                ))}
            </div>
          ) : (
            <div
              className="home-products-grid"
              data-testid="featured-products-grid"
            >
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── QA Features Banner ── */}
      <section className="qa-banner" data-testid="qa-banner">
        <div className="container">
          <h2 className="qa-banner-title">Built for Automation Practice</h2>
          <p className="qa-banner-sub">
            Every element has data-testid attributes. Every scenario is
            reproducible.
          </p>
          <div className="qa-features-grid" data-testid="qa-features-grid">
            {[
              {
                icon: "🎭",
                title: "Playwright E2E",
                desc: "40+ tests across auth, catalog, cart, checkout, admin",
              },
              {
                icon: "🔌",
                title: "API Testing",
                desc: "50+ API test cases with positive, negative & edge scenarios",
              },
              {
                icon: "🧪",
                title: "QA Helper APIs",
                desc: "Reset data, mock payments, toggle stock, expire tokens",
              },
              {
                icon: "🐳",
                title: "Docker Ready",
                desc: "One command to start full stack: DB + Backend + Frontend",
              },
              {
                icon: "⚙️",
                title: "CI/CD Pipeline",
                desc: "7-job GitHub Actions: lint, test, E2E, security, deploy",
              },
              {
                icon: "📚",
                title: "Swagger Docs",
                desc: "Full OpenAPI 3.0 docs at /api-docs with try-it-out",
              },
              {
                icon: "💳",
                title: "Payment Simulation",
                desc: "Success/failure cards, UPI, PayPal, COD — all testable",
              },
              {
                icon: "🔒",
                title: "Auth Scenarios",
                desc: "Lockout, token expiry, social login, role-based access",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="qa-feature-card"
                data-testid="qa-feature-card"
              >
                <div className="qa-feature-icon">{f.icon}</div>
                <h4 className="qa-feature-title">{f.title}</h4>
                <p className="qa-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="qa-banner-cta">
            <a
              href="http://localhost:5000/api-docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-accent btn-lg"
              data-testid="cta-swagger"
            >
              View API Docs
            </a>
            <Link
              to="/products"
              className="btn btn-outline btn-lg"
              data-testid="cta-products"
              style={{ color: "#fff", borderColor: "#fff" }}
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── Deals of the Day ── */}
      <section className="section" data-testid="deals-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🔥 Deals of the Day</h2>
            <Link to="/products?sort=price_asc" className="section-link">
              Shop All Deals →
            </Link>
          </div>
          <div className="deals-grid" data-testid="deals-grid">
            <div
              className="deal-card deal-card-main"
              data-testid="deal-card-main"
            >
              <div className="deal-badge">LIMITED OFFER</div>
              <p className="deal-category">Electronics</p>
              <h3 className="deal-title">iPhone 15 Pro</h3>
              <p className="deal-desc">
                A17 Pro chip, titanium design, and USB-C. The most advanced
                iPhone ever.
              </p>
              <div className="deal-price">
                <span className="deal-current">₹1,34,900</span>
                <span className="deal-original">₹1,49,900</span>
              </div>
              <Link to="/products?search=iphone" className="btn btn-accent">
                Shop Now
              </Link>
            </div>
            <div className="deals-secondary" data-testid="deals-secondary">
              {[
                {
                  icon: "📚",
                  cat: "Books",
                  name: "Atomic Habits",
                  price: "₹499",
                  orig: "₹699",
                  link: "?search=atomic",
                },
                {
                  icon: "🎧",
                  cat: "Electronics",
                  name: "Sony WH-1000XM5",
                  price: "₹29,990",
                  orig: "₹34,990",
                  link: "?search=sony",
                },
                {
                  icon: "👟",
                  cat: "Clothing",
                  name: "Nike Air Force 1",
                  price: "₹8,495",
                  orig: "₹9,995",
                  link: "?search=nike",
                },
              ].map((d) => (
                <Link
                  key={d.name}
                  to={`/products${d.link}`}
                  className="deal-small"
                  data-testid="deal-small-card"
                >
                  <div className="deal-small-icon">{d.icon}</div>
                  <div className="deal-small-info">
                    <p className="deal-small-cat">{d.cat}</p>
                    <p className="deal-small-name">{d.name}</p>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "baseline",
                      }}
                    >
                      <span className="deal-small-price">{d.price}</span>
                      <span className="deal-small-orig">{d.orig}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .home-page { overflow-x: hidden; }

        /* Hero */
        .hero { position: relative; padding: 80px 0; min-height: 560px; display: flex; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1a3c5e 100%); color: #fff; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
        .hero .container { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; position: relative; z-index: 1; }
        .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(249,115,22,0.2); color: var(--accent); border: 1px solid rgba(249,115,22,0.3); padding: 6px 14px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; margin-bottom: 20px; }
        .hero-title { font-size: clamp(2rem, 4vw, 3rem); line-height: 1.1; margin-bottom: 16px; }
        .hero-accent { color: var(--accent); }
        .hero-desc { color: #94a3b8; font-size: 1rem; line-height: 1.7; margin-bottom: 28px; max-width: 440px; }
        .hero-search { display: flex; gap: 8px; max-width: 480px; margin-bottom: 20px; }
        .hero-search-input { flex: 1; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.15); border-radius: var(--radius-lg); background: rgba(255,255,255,0.08); color: #fff; font-size: 0.9rem; outline: none; }
        .hero-search-input::placeholder { color: #64748b; }
        .hero-search-input:focus { border-color: var(--accent); }
        .hero-search-btn { padding: 12px 24px; border-radius: var(--radius-lg); white-space: nowrap; }
        .hero-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .hero-tag { background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; cursor: pointer; transition: all var(--transition); }
        .hero-tag:hover { background: rgba(249,115,22,0.2); color: var(--accent); border-color: rgba(249,115,22,0.3); }

        /* Hero Cards */
        .hero-illustration { display: flex; flex-direction: column; gap: 16px; }
        .hero-card { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-lg); padding: 16px 20px; backdrop-filter: blur(10px); }
        .hero-card-1 { transform: translateX(20px); animation: floatCard1 4s ease-in-out infinite; }
        .hero-card-2 { transform: translateX(-10px); animation: floatCard2 4s ease-in-out infinite 0.5s; }
        .hero-card-3 { transform: translateX(10px); animation: floatCard1 4s ease-in-out infinite 1s; }
        @keyframes floatCard1 { 0%,100% { transform: translateX(20px) translateY(0); } 50% { transform: translateX(20px) translateY(-6px); } }
        @keyframes floatCard2 { 0%,100% { transform: translateX(-10px) translateY(0); } 50% { transform: translateX(-10px) translateY(-6px); } }
        .hc-icon { font-size: 2rem; flex-shrink: 0; }
        .hc-name { font-weight: 700; color: #e2e8f0; font-size: 0.9rem; }
        .hc-price { color: var(--accent); font-weight: 600; font-size: 0.85rem; }
        .hc-badge { margin-left: auto; font-size: 0.75rem; padding: 3px 10px; border-radius: 100px; background: rgba(249,115,22,0.2); color: var(--accent); white-space: nowrap; font-weight: 700; }
        .hc-badge.success { background: rgba(22,163,74,0.2); color: #4ade80; }

        /* Stats Bar */
        .stats-bar { background: var(--accent); color: #fff; padding: 20px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat-item { display: flex; align-items: center; gap: 10px; justify-content: center; padding: 8px; border-right: 1px solid rgba(255,255,255,0.2); }
        .stat-item:last-child { border-right: none; }
        .stat-icon-sm { font-size: 1.4rem; }
        .stat-value-sm { font-size: 1.3rem; font-weight: 700; }
        .stat-label-sm { font-size: 0.8rem; opacity: 0.85; }

        /* Sections */
        .section { padding: 64px 0; }
        .section-alt { background: var(--bg-muted); }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .section-title { font-size: 1.75rem; }
        .section-link { color: var(--accent); font-weight: 600; font-size: 0.9rem; }

        /* Category Grid */
        .cat-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 16px; }
        .cat-skeleton { height: 120px; border-radius: 12px; }
        .cat-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); text-align: center; transition: all var(--transition-slow); }
        .cat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
        .cat-icon { font-size: 2rem; }
        .cat-name { font-weight: 700; font-size: 0.8rem; color: var(--text-primary); }
        .cat-count { font-size: 0.7rem; color: var(--text-muted); }

        /* Product Grid */
        .home-products-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .home-product-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; transition: all var(--transition-slow); }
        .home-product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .home-product-img-wrap { position: relative; padding-top: 75%; overflow: hidden; background: var(--bg-muted); }
        .home-product-img-wrap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-slow); }
        .home-product-card:hover img { transform: scale(1.05); }
        .oos-tag { position: absolute; inset: 0; background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .sale-tag { position: absolute; top: 8px; left: 8px; background: var(--danger); color: #fff; padding: 2px 8px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; }
        .home-product-info { padding: 14px; flex: 1; }
        .home-product-cat { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .home-product-name { font-weight: 700; font-size: 0.9rem; line-height: 1.3; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .home-product-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .rating-count { font-size: 0.75rem; color: var(--text-muted); }
        .home-product-prices { display: flex; align-items: baseline; gap: 8px; }
        .home-price { font-size: 1.05rem; font-weight: 700; color: var(--primary); }
        .home-compare { font-size: 0.8rem; color: var(--text-muted); text-decoration: line-through; }
        .home-add-btn { border-radius: 0 0 var(--radius-lg) var(--radius-lg); }

        /* QA Banner */
        .qa-banner { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #fff; padding: 80px 0; text-align: center; }
        .qa-banner-title { font-size: 2rem; margin-bottom: 12px; }
        .qa-banner-sub { color: #94a3b8; margin-bottom: 48px; }
        .qa-features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; text-align: left; }
        .qa-feature-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-lg); padding: 20px; transition: all var(--transition); }
        .qa-feature-card:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .qa-feature-icon { font-size: 1.8rem; margin-bottom: 10px; }
        .qa-feature-title { font-weight: 700; margin-bottom: 6px; font-size: 0.9rem; color: #e2e8f0; }
        .qa-feature-desc { font-size: 0.8rem; color: #64748b; line-height: 1.5; }
        .qa-banner-cta { display: flex; gap: 16px; justify-content: center; }

        /* Deals */
        .deals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .deal-card-main { background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; border-radius: var(--radius-xl); padding: 32px; position: relative; overflow: hidden; }
        .deal-badge { display: inline-block; background: var(--accent); color: #fff; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 12px; }
        .deal-category { color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 6px; }
        .deal-title { font-size: 1.6rem; font-family: var(--font-display); margin-bottom: 10px; }
        .deal-desc { color: #94a3b8; font-size: 0.85rem; line-height: 1.6; margin-bottom: 20px; }
        .deal-price { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
        .deal-current { font-size: 1.6rem; font-weight: 700; }
        .deal-original { color: #64748b; text-decoration: line-through; font-size: 1rem; }
        .deals-secondary { display: flex; flex-direction: column; gap: 14px; }
        .deal-small { display: flex; align-items: center; gap: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; transition: all var(--transition); }
        .deal-small:hover { border-color: var(--accent); box-shadow: var(--shadow); }
        .deal-small-icon { font-size: 2rem; flex-shrink: 0; }
        .deal-small-cat { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
        .deal-small-name { font-weight: 700; font-size: 0.9rem; margin: 2px 0; }
        .deal-small-price { font-weight: 700; color: var(--primary); }
        .deal-small-orig { font-size: 0.8rem; color: var(--text-muted); text-decoration: line-through; }

        @media (max-width: 1024px) {
          .hero .container { grid-template-columns: 1fr; }
          .hero-illustration { display: none; }
          .home-products-grid { grid-template-columns: repeat(2, 1fr); }
          .cat-grid { grid-template-columns: repeat(4, 1fr); }
          .qa-features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero { padding: 48px 0; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .cat-grid { grid-template-columns: repeat(4, 1fr); }
          .deals-grid { grid-template-columns: 1fr; }
          .qa-features-grid { grid-template-columns: 1fr; }
          .qa-banner-cta { flex-direction: column; align-items: center; }
        }
      `}</style>
    </div>
  );
}
