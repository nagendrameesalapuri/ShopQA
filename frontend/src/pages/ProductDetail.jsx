import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/common/StarRating';
import { toast } from 'react-toastify';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setSelectedImg(0);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (quantity > product.stock) { toast.error(`Only ${product.stock} in stock`); return; }
    setAdding(true);
    try { await addToCart(product.id, quantity); }
    finally { setAdding(false); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (wishlisted) {
        await api.delete(`/users/wishlist/${product.id}`);
        toast.info('Removed from wishlist');
      } else {
        await api.post('/users/wishlist', { productId: product.id });
        toast.success('Added to wishlist ❤️');
      }
      setWishlisted(w => !w);
    } catch {}
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { productId: product.id, ...reviewForm });
      toast.success('Review submitted!');
      setShowReviewForm(false);
      // Refresh product to show new review
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '48px 0' }}>
        <div className="product-detail-layout">
          <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 40, width: '80%' }} />
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
            <div className="skeleton" style={{ height: 60 }} />
            <div className="skeleton" style={{ height: 48, width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }} data-testid="product-not-found">
        <p style={{ fontSize: '3rem' }}>🔍</p>
        <h2>Product Not Found</h2>
        <Link to="/products" className="btn btn-accent" style={{ marginTop: 16 }}>Browse Products</Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [`https://picsum.photos/seed/${product.id}/500/500`];
  const isOOS = product.stock === 0;
  const discount = product.compare_price > product.price
    ? Math.round((1 - product.price / product.compare_price) * 100) : 0;

  return (
    <div style={{ padding: '32px 0' }} data-testid="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb" data-testid="breadcrumb">
          <Link to="/">Home</Link><span className="breadcrumb-sep">›</span>
          <Link to="/products">Products</Link><span className="breadcrumb-sep">›</span>
          {product.category_name && <><Link to={`/products?category=${product.category_slug}`}>{product.category_name}</Link><span className="breadcrumb-sep">›</span></>}
          <span>{product.name}</span>
        </div>

        <div className="product-detail-layout" data-testid="product-detail-layout">
          {/* ── Image Gallery ── */}
          <div className="gallery" data-testid="product-gallery">
            <div className="main-image-wrap" data-testid="main-image-wrap">
              <img
                src={images[selectedImg]}
                alt={`${product.name} - Image ${selectedImg + 1}`}
                className="main-image"
                data-testid="main-product-image"
              />
              {isOOS && <div className="oos-overlay" data-testid="oos-overlay">Out of Stock</div>}
              {discount > 0 && <div className="img-discount-badge" data-testid="discount-badge">{discount}% OFF</div>}
            </div>
            {images.length > 1 && (
              <div className="thumbnails" data-testid="thumbnails" role="list">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`thumb ${selectedImg === i ? 'active' : ''}`}
                    onClick={() => setSelectedImg(i)}
                    data-testid={`thumbnail-${i}`}
                    aria-label={`View image ${i + 1}`}
                    aria-selected={selectedImg === i}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="product-info-panel" data-testid="product-info-panel">
            <p className="product-cat-label" data-testid="product-category-label">{product.category_name}</p>
            <h1 className="product-detail-name" data-testid="product-detail-name">{product.name}</h1>
            {product.brand && <p className="product-brand-label" data-testid="product-brand">by {product.brand}</p>}

            {/* Rating */}
            <div className="rating-row" data-testid="product-rating-row">
              <StarRating rating={parseFloat(product.avg_rating) || 0} />
              <span className="rating-number">{Number(product.avg_rating || 0).toFixed(1)}</span>
              <a href="#reviews" className="rating-count-link" data-testid="review-count-link">({product.review_count || 0} reviews)</a>
            </div>

            {/* Price */}
            <div className="price-section" data-testid="price-section">
              <span className="detail-price" data-testid="product-detail-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
              {product.compare_price > product.price && (
                <>
                  <span className="detail-compare">₹{Number(product.compare_price).toLocaleString('en-IN')}</span>
                  <span className="detail-savings">Save {discount}%</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="stock-indicator" data-testid="product-detail-stock">
              {product.stock > 10
                ? <span className="stock-in">✅ In Stock ({product.stock} available)</span>
                : product.stock > 0
                  ? <span className="stock-low">⚠️ Only {product.stock} left!</span>
                  : <span className="stock-out">❌ Out of Stock</span>
              }
            </div>

            {/* Short description */}
            {product.short_desc && <p className="short-desc" data-testid="product-short-desc">{product.short_desc}</p>}

            {/* Quantity + Add to Cart */}
            {!isOOS && (
              <div className="add-to-cart-section" data-testid="add-to-cart-section">
                <div className="qty-input" data-testid="quantity-control" style={{ width: 'fit-content' }}>
                  <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} data-testid="qty-btn-minus" aria-label="Decrease quantity">−</button>
                  <span className="qty-num" data-testid="quantity-value">{quantity}</span>
                  <button className="qty-btn" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} data-testid="qty-btn-plus" aria-label="Increase quantity">+</button>
                </div>
                <button
                  className="btn btn-accent btn-lg"
                  onClick={handleAddToCart}
                  disabled={adding}
                  data-testid="detail-add-to-cart"
                  style={{ flex: 1 }}
                >
                  {adding ? <><span className="spinner spinner-sm" /> Adding…</> : '🛒 Add to Cart'}
                </button>
                <button
                  className="btn btn-outline btn-icon"
                  onClick={handleWishlist}
                  data-testid="wishlist-btn"
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={wishlisted}
                  style={{ color: wishlisted ? 'var(--danger)' : 'var(--text-muted)', fontSize: '1.2rem', padding: '10px 14px' }}
                >
                  {wishlisted ? '♥' : '♡'}
                </button>
              </div>
            )}
            {isOOS && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={handleWishlist} data-testid="notify-btn">
                  🔔 Notify When Available
                </button>
              </div>
            )}

            {/* Buy Now */}
            {!isOOS && (
              <button
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: 12 }}
                onClick={async () => { await handleAddToCart(); if (!adding) navigate('/checkout'); }}
                data-testid="buy-now-btn"
              >
                ⚡ Buy Now
              </button>
            )}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="tags-row" data-testid="product-tags">
                {product.tags.map(tag => (
                  <Link key={tag} to={`/products?tags=${tag}`} className="tag-chip" data-testid="product-tag">{tag}</Link>
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="product-meta" data-testid="product-meta">
              <div className="meta-row"><span>SKU:</span><span data-testid="product-sku">{product.sku || 'N/A'}</span></div>
              <div className="meta-row"><span>Category:</span><Link to={`/products?category=${product.category_slug}`} data-testid="product-category-link">{product.category_name}</Link></div>
              {product.brand && <div className="meta-row"><span>Brand:</span><span data-testid="product-brand-meta">{product.brand}</span></div>}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ marginTop: 48 }} id="reviews">
          <div className="tabs" data-testid="product-tabs">
            <button className={`tab ${tab === 'description' ? 'active' : ''}`} onClick={() => setTab('description')} data-testid="tab-description">Description</button>
            <button className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')} data-testid="tab-reviews">
              Reviews ({product.review_count || 0})
            </button>
            <button className={`tab ${tab === 'specs' ? 'active' : ''}`} onClick={() => setTab('specs')} data-testid="tab-specs">Specifications</button>
          </div>

          {tab === 'description' && (
            <div className="tab-content" data-testid="description-content">
              <p style={{ lineHeight: 1.8, color: 'var(--text-muted)' }}>{product.description || 'No description available.'}</p>
            </div>
          )}

          {tab === 'specs' && (
            <div className="tab-content" data-testid="specs-content">
              <table className="table">
                <tbody>
                  {product.brand    && <tr><td style={{ fontWeight: 700 }}>Brand</td><td>{product.brand}</td></tr>}
                  {product.sku      && <tr><td style={{ fontWeight: 700 }}>SKU</td><td>{product.sku}</td></tr>}
                  {product.weight   && <tr><td style={{ fontWeight: 700 }}>Weight</td><td>{product.weight} kg</td></tr>}
                  <tr><td style={{ fontWeight: 700 }}>Category</td><td>{product.category_name}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>Stock</td><td>{product.stock} units</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="tab-content" data-testid="reviews-content">
              {/* Rating Summary */}
              <div className="reviews-header" data-testid="reviews-summary">
                <div className="avg-rating-block">
                  <span className="avg-rating-num" data-testid="avg-rating">{Number(product.avg_rating || 0).toFixed(1)}</span>
                  <StarRating rating={parseFloat(product.avg_rating) || 0} size="lg" />
                  <span className="text-muted text-sm">Based on {product.review_count || 0} reviews</span>
                </div>
                {isAuthenticated && (
                  <button className="btn btn-accent" onClick={() => setShowReviewForm(s => !s)} data-testid="write-review-btn">
                    {showReviewForm ? '✕ Cancel' : '✏️ Write a Review'}
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="review-form-card" data-testid="review-form">
                  <h4 style={{ marginBottom: 16 }}>Your Review</h4>
                  <form onSubmit={handleSubmitReview}>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Rating *</label>
                      <StarRating rating={reviewForm.rating} size="lg" interactive onChange={r => setReviewForm(p => ({ ...p, rating: r }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Review Title</label>
                      <input className="form-input" value={reviewForm.title} onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))} placeholder="Summarize your experience" data-testid="review-title" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Review</label>
                      <textarea className="form-input" rows={4} value={reviewForm.body} onChange={e => setReviewForm(p => ({ ...p, body: e.target.value }))} placeholder="Share your experience with this product…" data-testid="review-body" style={{ resize: 'vertical' }} />
                    </div>
                    <button type="submit" className="btn btn-accent" disabled={submittingReview} data-testid="submit-review-btn">
                      {submittingReview ? <><span className="spinner spinner-sm" /> Submitting…</> : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              <div className="reviews-list" data-testid="reviews-list">
                {(product.reviews || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }} data-testid="no-reviews">
                    <p style={{ fontSize: '2rem' }}>💬</p>
                    <p className="text-muted">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  product.reviews.map(review => (
                    <div key={review.id} className="review-card" data-testid="review-card">
                      <div className="review-header">
                        <div className="reviewer-avatar">{review.first_name?.[0]}{review.last_name?.[0]}</div>
                        <div>
                          <p style={{ fontWeight: 700 }} data-testid="reviewer-name">{review.first_name} {review.last_name}</p>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <StarRating rating={review.rating} size="sm" />
                            {review.verified_purchase && <span className="verified-badge" data-testid="verified-badge">✅ Verified Purchase</span>}
                          </div>
                        </div>
                        <span className="review-date text-muted text-xs">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      {review.title && <p style={{ fontWeight: 700, marginBottom: 6 }} data-testid="review-title-display">{review.title}</p>}
                      <p className="text-muted" style={{ lineHeight: 1.6 }} data-testid="review-body-display">{review.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Related Products ── */}
        {product.related?.length > 0 && (
          <div style={{ marginTop: 48 }} data-testid="related-products">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 24 }}>Related Products</h3>
            <div className="product-grid" data-testid="related-products-grid">
              {product.related.map(r => (
                <Link key={r.id} to={`/products/${r.slug || r.id}`} className="related-card" data-testid="related-card">
                  <img src={r.thumbnail || `https://picsum.photos/seed/${r.id}/200/200`} alt={r.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                  <div style={{ padding: 12 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>{r.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <StarRating rating={parseFloat(r.avg_rating) || 0} size="sm" />
                      <span className="text-xs text-muted">({r.review_count})</span>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{Number(r.price).toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .product-detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
        .gallery { display: flex; flex-direction: column; gap: 12px; }
        .main-image-wrap { position: relative; border-radius: var(--radius-xl); overflow: hidden; background: var(--bg-muted); aspect-ratio: 1; }
        .main-image { width: 100%; height: 100%; object-fit: cover; }
        .oos-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem; font-weight: 700; }
        .img-discount-badge { position: absolute; top: 16px; left: 16px; background: var(--danger); color: #fff; padding: 4px 12px; border-radius: 100px; font-weight: 700; }
        .thumbnails { display: flex; gap: 8px; overflow-x: auto; }
        .thumb { width: 64px; height: 64px; border-radius: var(--radius); overflow: hidden; border: 2px solid var(--border); cursor: pointer; flex-shrink: 0; transition: border-color var(--transition); }
        .thumb.active { border-color: var(--accent); }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .product-info-panel { display: flex; flex-direction: column; gap: 16px; }
        .product-cat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 600; }
        .product-detail-name { font-size: 1.75rem; font-family: var(--font-display); line-height: 1.2; }
        .product-brand-label { color: var(--text-muted); font-size: 0.875rem; }
        .rating-row { display: flex; align-items: center; gap: 10px; }
        .rating-number { font-weight: 700; font-size: 1rem; }
        .rating-count-link { color: var(--text-muted); font-size: 0.875rem; }
        .price-section { display: flex; align-items: baseline; gap: 12px; }
        .detail-price { font-size: 2rem; font-weight: 700; color: var(--primary); }
        .detail-compare { font-size: 1rem; color: var(--text-muted); text-decoration: line-through; }
        .detail-savings { background: #dcfce7; color: #15803d; padding: 2px 10px; border-radius: 100px; font-size: 0.8rem; font-weight: 700; }
        .stock-indicator { font-size: 0.9rem; }
        .stock-in { color: var(--success); }
        .stock-low { color: var(--warning); }
        .stock-out { color: var(--danger); }
        .short-desc { color: var(--text-muted); line-height: 1.6; font-size: 0.9rem; }
        .add-to-cart-section { display: flex; gap: 12px; align-items: center; }
        .tags-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag-chip { background: var(--bg-muted); border: 1px solid var(--border); border-radius: 100px; padding: 4px 12px; font-size: 0.8rem; color: var(--text-muted); transition: all var(--transition); }
        .tag-chip:hover { border-color: var(--accent); color: var(--accent); }
        .product-meta { border-top: 1px solid var(--border); padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
        .meta-row { display: flex; gap: 12px; font-size: 0.875rem; }
        .meta-row span:first-child { color: var(--text-muted); min-width: 80px; }
        .tab-content { padding: 24px 0; }
        .reviews-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 16px; }
        .avg-rating-block { display: flex; flex-direction: column; gap: 6px; }
        .avg-rating-num { font-size: 3rem; font-weight: 700; line-height: 1; }
        .review-form-card { background: var(--bg-muted); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px; }
        .reviews-list { display: flex; flex-direction: column; gap: 0; }
        .review-card { padding: 20px 0; border-bottom: 1px solid var(--border); }
        .review-card:last-child { border-bottom: none; }
        .review-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
        .reviewer-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
        .review-date { margin-left: auto; white-space: nowrap; }
        .verified-badge { font-size: 0.75rem; color: var(--success); }
        .related-card { display: block; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; transition: all var(--transition-slow); }
        .related-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        @media (max-width: 900px) { .product-detail-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
