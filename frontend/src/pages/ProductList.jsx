import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import StarRating from '../components/common/StarRating';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc',label: 'Highest Rated' },
  { value: 'name_asc',   label: 'A to Z' },
];

const PRICE_RANGES = [
  { label: 'Under ₹500',         min: 0,     max: 500 },
  { label: '₹500 – ₹2,000',     min: 500,   max: 2000 },
  { label: '₹2,000 – ₹10,000',  min: 2000,  max: 10000 },
  { label: '₹10,000 – ₹50,000', min: 10000, max: 50000 },
  { label: 'Above ₹50,000',      min: 50000, max: 999999 },
];

// ── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    setAdding(true);
    try { await addToCart(product.id); }
    finally { setAdding(false); }
  };

  return (
    <div className="product-card" data-testid="product-card" data-product-id={product.id}>
      <Link to={`/products/${product.slug || product.id}`} className="product-card-link">
        <div className="product-image-wrap">
          <img
            src={product.thumbnail || `https://picsum.photos/seed/${product.id}/300/300`}
            alt={product.name}
            className="product-image"
            loading="lazy"
            data-testid="product-image"
          />
          {isOutOfStock && <div className="out-of-stock-overlay" data-testid="out-of-stock-badge">Out of Stock</div>}
          {product.compare_price > product.price && (
            <div className="discount-badge" data-testid="discount-badge">
              {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
            </div>
          )}
          {product.is_featured && <div className="featured-badge">⭐ Featured</div>}
        </div>

        <div className="product-info">
          <p className="product-category text-xs text-muted" data-testid="product-category">{product.category_name}</p>
          <h3 className="product-name" data-testid="product-name">{product.name}</h3>
          <p className="product-brand text-sm text-muted">{product.brand}</p>

          <div className="product-rating" data-testid="product-rating">
            <StarRating rating={product.avg_rating} size="sm" />
            <span className="text-xs text-muted">({product.review_count})</span>
          </div>

          <div className="product-price-row">
            <span className="product-price" data-testid="product-price">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.compare_price > product.price && (
              <span className="product-compare-price">
                ₹{Number(product.compare_price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="product-stock text-xs" data-testid="product-stock">
            {product.stock > 0
              ? product.stock <= 5
                ? <span className="text-warning">Only {product.stock} left!</span>
                : <span className="text-success">In Stock</span>
              : <span className="text-danger">Out of Stock</span>
            }
          </div>
        </div>
      </Link>

      <button
        className={`btn ${isOutOfStock ? 'btn-outline' : 'btn-accent'} btn-full add-to-cart-btn`}
        onClick={handleAddToCart}
        disabled={isOutOfStock || adding}
        data-testid="add-to-cart-btn"
        aria-label={`Add ${product.name} to cart`}
      >
        {adding ? <span className="spinner spinner-sm" /> : isOutOfStock ? '🚫 Out of Stock' : '🛒 Add to Cart'}
      </button>

      <style>{`
        .product-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
          transition: all var(--transition-slow);
          display: flex; flex-direction: column;
        }
        .product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--border-dark); }
        .product-card-link { text-decoration: none; color: inherit; flex: 1; }
        .product-image-wrap { position: relative; padding-top: 100%; background: var(--bg-muted); overflow: hidden; }
        .product-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-slow); }
        .product-card:hover .product-image { transform: scale(1.05); }
        .out-of-stock-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
        .discount-badge { position: absolute; top: 8px; left: 8px; background: var(--danger); color: #fff; padding: 2px 8px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; }
        .featured-badge { position: absolute; top: 8px; right: 8px; background: var(--warning); color: #fff; padding: 2px 8px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; }
        .product-info { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .product-name { font-size: 0.95rem; font-weight: 700; line-height: 1.3; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .product-rating { display: flex; align-items: center; gap: 6px; }
        .product-price-row { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
        .product-price { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
        .product-compare-price { font-size: 0.85rem; color: var(--text-muted); text-decoration: line-through; }
        .add-to-cart-btn { border-radius: 0 0 var(--radius-lg) var(--radius-lg); }
        .text-success { color: var(--success); }
        .text-warning { color: var(--warning); }
        .text-danger { color: var(--danger); }
      `}</style>
    </div>
  );
}

// ── Skeleton Card ────────────────────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div className="product-card" data-testid="product-skeleton">
      <div className="skeleton" style={{ paddingTop: '100%', borderRadius: 0 }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
        <div className="skeleton" style={{ height: 16, width: '90%' }} />
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 20, width: '50%', marginTop: 8 }} />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [filterOpen, setFilterOpen] = useState(false);

  // Infinite scroll state
  const [infiniteMode, setInfiniteMode] = useState(false);
  const loaderRef = useRef(null);

  // Filter state from URL
  const page     = parseInt(searchParams.get('page')    || '1');
  const search   = searchParams.get('search')   || '';
  const category = searchParams.get('category') || '';
  const sort     = searchParams.get('sort')     || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock  = searchParams.get('inStock')  || '';
  const rating   = searchParams.get('rating')   || '';

  const fetchProducts = useCallback(async (append = false) => {
    setLoading(!append);
    try {
      const params = { page, limit: 12, sort };
      if (search)   params.search   = search;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (inStock)  params.inStock  = inStock;
      if (rating)   params.rating   = rating;

      const { data } = await api.get('/products', { params });
      setProducts(prev => append ? [...prev, ...data.products] : data.products);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sort, minPrice, maxPrice, inStock, rating]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Fetch categories once
  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!infiniteMode || !loaderRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && page < pages) {
          setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('page', page + 1); return p; });
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [infiniteMode, page, pages, setSearchParams]);

  const updateFilter = (key, value) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (value) p.set(key, value); else p.delete(key);
      p.set('page', '1');
      return p;
    });
    setProducts([]);
  };

  const clearFilters = () => {
    setSearchParams({});
    setProducts([]);
  };

  const hasFilters = !!(search || category || minPrice || maxPrice || inStock || rating);

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb" data-testid="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Products</span>
          {search && <><span className="breadcrumb-sep">›</span><span>Search: "{search}"</span></>}
          {category && <><span className="breadcrumb-sep">›</span><span style={{ textTransform: 'capitalize' }}>{category.replace(/-/g, ' & ')}</span></>}
        </div>

        {/* Header + Controls */}
        <div className="list-header" data-testid="list-header">
          <div>
            <h1 className="list-title">
              {search ? `Results for "${search}"` : category ? category.replace(/-/g, ' & ') : 'All Products'}
            </h1>
            <p className="list-count text-muted" data-testid="product-count">
              {loading ? 'Loading…' : `${total.toLocaleString()} products`}
            </p>
          </div>

          <div className="list-controls">
            {/* Sort */}
            <select
              className="form-input"
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              data-testid="sort-select"
              aria-label="Sort products"
              style={{ width: 'auto' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* View toggle */}
            <div className="view-toggle" role="group" aria-label="View mode">
              <button className={`btn btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('grid')} title="Grid view" data-testid="view-grid">⊞</button>
              <button className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('list')} title="List view" data-testid="view-list">☰</button>
            </div>

            {/* Infinite scroll toggle */}
            <label className="toggle-label" title="Switch to infinite scroll">
              <input type="checkbox" checked={infiniteMode} onChange={e => setInfiniteMode(e.target.checked)} data-testid="infinite-scroll-toggle" />
              <span>Infinite Scroll</span>
            </label>

            {/* Filter button (mobile) */}
            <button className="btn btn-outline btn-sm" onClick={() => setFilterOpen(true)} data-testid="filter-btn">
              🔧 Filters {hasFilters && <span className="badge badge-info" style={{ padding: '0 6px' }}>ON</span>}
            </button>
          </div>
        </div>

        <div className="list-layout">
          {/* ── Sidebar Filters ── */}
          <aside className={`filters-panel ${filterOpen ? 'open' : ''}`} data-testid="filters-panel">
            <div className="filter-header">
              <h3>Filters</h3>
              {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters} data-testid="clear-filters">Clear All</button>}
              <button className="btn btn-ghost btn-sm filters-close" onClick={() => setFilterOpen(false)}>✕</button>
            </div>

            {/* Category filter */}
            <div className="filter-section" data-testid="filter-category">
              <p className="filter-label">Category</p>
              <div className="filter-options">
                <label className="filter-option">
                  <input type="radio" name="category" value="" checked={!category} onChange={() => updateFilter('category', '')} data-testid="filter-cat-all" />
                  <span>All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="filter-option">
                    <input type="radio" name="category" value={cat.slug} checked={category === cat.slug} onChange={() => updateFilter('category', cat.slug)} data-testid={`filter-cat-${cat.slug}`} />
                    <span>{cat.name} <em className="text-muted text-xs">({cat.product_count})</em></span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="filter-section" data-testid="filter-price">
              <p className="filter-label">Price Range</p>
              <div className="filter-options">
                {PRICE_RANGES.map(r => (
                  <label key={r.label} className="filter-option">
                    <input
                      type="radio" name="price"
                      checked={minPrice === String(r.min) && maxPrice === String(r.max)}
                      onChange={() => { updateFilter('minPrice', String(r.min)); updateFilter('maxPrice', String(r.max)); }}
                      data-testid={`filter-price-${r.min}`}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="form-input" type="number" placeholder="Min ₹" value={minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} data-testid="filter-min-price" />
                <input className="form-input" type="number" placeholder="Max ₹" value={maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} data-testid="filter-max-price" />
              </div>
            </div>

            {/* Minimum rating */}
            <div className="filter-section" data-testid="filter-rating">
              <p className="filter-label">Minimum Rating</p>
              <div className="filter-options">
                {[4, 3, 2, 1].map(r => (
                  <label key={r} className="filter-option">
                    <input type="radio" name="rating" value={r} checked={rating === String(r)} onChange={() => updateFilter('rating', String(r))} data-testid={`filter-rating-${r}`} />
                    <span>{'★'.repeat(r)}{'☆'.repeat(5 - r)} & above</span>
                  </label>
                ))}
              </div>
            </div>

            {/* In stock */}
            <div className="filter-section" data-testid="filter-stock">
              <label className="filter-option">
                <input type="checkbox" checked={inStock === 'true'} onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : '')} data-testid="filter-in-stock" />
                <span>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* ── Product Grid ── */}
          <div className="products-area">
            {loading && products.length === 0 ? (
              <div className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state" data-testid="empty-state">
                <p style={{ fontSize: '3rem' }}>🔍</p>
                <h3>No products found</h3>
                <p className="text-muted">Try adjusting your filters or search query.</p>
                <button className="btn btn-accent" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`} data-testid="product-grid">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Pagination or infinite scroll loader */}
                {infiniteMode ? (
                  <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
                    {page < pages && <span className="spinner spinner-lg" />}
                  </div>
                ) : (
                  <div className="pagination" data-testid="pagination">
                    <button className="page-btn" onClick={() => updateFilter('page', String(page - 1))} disabled={page === 1} data-testid="prev-page">← Prev</button>
                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                      const p = i + 1;
                      return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => updateFilter('page', String(p))} data-testid={`page-${p}`}>{p}</button>;
                    })}
                    <button className="page-btn" onClick={() => updateFilter('page', String(page + 1))} disabled={page === pages} data-testid="next-page">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .list-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .list-title { font-size: 1.75rem; text-transform: capitalize; }
        .list-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; }
        .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer; white-space: nowrap; }
        .list-layout { display: grid; grid-template-columns: 240px 1fr; gap: 32px; align-items: start; }
        .filters-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; position: sticky; top: 100px; }
        .filter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .filter-header h3 { font-size: 1rem; }
        .filters-close { display: none; }
        .filter-section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .filter-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .filter-label { font-weight: 700; font-size: 0.85rem; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .filter-options { display: flex; flex-direction: column; gap: 8px; }
        .filter-option { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; cursor: pointer; }
        .filter-option input { cursor: pointer; accent-color: var(--accent); }
        .products-area { min-width: 0; }
        .empty-state { text-align: center; padding: 80px 0; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .list-view { grid-template-columns: 1fr !important; }
        @media (max-width: 900px) {
          .list-layout { grid-template-columns: 1fr; }
          .filters-panel { position: fixed; inset-y: 0; left: 0; width: 280px; z-index: 200; transform: translateX(-100%); transition: transform var(--transition-slow); border-radius: 0 var(--radius-xl) var(--radius-xl) 0; overflow-y: auto; top: 0; }
          .filters-panel.open { transform: translateX(0); }
          .filters-close { display: block; }
        }
      `}</style>
    </div>
  );
}
