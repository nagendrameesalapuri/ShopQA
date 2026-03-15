import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQ, setSearchQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <div className="app-layout">
      {/* ── Navbar ── */}
      <header className="navbar" data-testid="navbar">
        <div className="container">
          <nav className="nav-inner">
            {/* Logo */}
            <Link to="/" className="nav-logo" data-testid="nav-logo">
              <span className="logo-icon">🛍</span>
              <span className="logo-text">ShopQA</span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="nav-search" role="search">
              <input
                type="search"
                className="form-input nav-search-input"
                placeholder="Search products..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                data-testid="nav-search-input"
                aria-label="Search products"
              />
              <button type="submit" className="btn btn-accent nav-search-btn" data-testid="nav-search-btn" aria-label="Search">
                🔍
              </button>
            </form>

            {/* Nav Actions */}
            <div className="nav-actions">
              <Link to="/products" className="nav-link" data-testid="nav-products">Products</Link>

              {isAuthenticated ? (
                <>
                  {/* Cart */}
                  <Link to="/cart" className="nav-link cart-link" data-testid="nav-cart">
                    🛒
                    {itemCount > 0 && (
                      <span className="cart-badge" data-testid="cart-count">{itemCount}</span>
                    )}
                  </Link>

                  {/* Wishlist */}
                  <Link to="/wishlist" className="nav-link" data-testid="nav-wishlist" title="Wishlist">❤️</Link>

                  {/* User Menu */}
                  <div className="user-menu-wrap" ref={userMenuRef}>
                    <button
                      className="user-avatar-btn"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      data-testid="user-menu-btn"
                      aria-expanded={userMenuOpen}
                      aria-label="User menu"
                    >
                      <div className="avatar-circle">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                      <span className="user-name">{user?.firstName}</span>
                      <span className={`chevron ${userMenuOpen ? 'open' : ''}`}>▾</span>
                    </button>

                    {userMenuOpen && (
                      <div className="dropdown-menu" data-testid="user-dropdown">
                        <div className="dropdown-header">
                          <p className="dropdown-name">{user?.firstName} {user?.lastName}</p>
                          <p className="dropdown-email">{user?.email}</p>
                        </div>
                        <div className="dropdown-divider" />
                        <Link to="/profile"  className="dropdown-item" data-testid="menu-profile"  onClick={() => setUserMenuOpen(false)}>👤 My Profile</Link>
                        <Link to="/orders"   className="dropdown-item" data-testid="menu-orders"   onClick={() => setUserMenuOpen(false)}>📦 My Orders</Link>
                        <Link to="/wishlist" className="dropdown-item" data-testid="menu-wishlist" onClick={() => setUserMenuOpen(false)}>❤️ Wishlist</Link>
                        {user?.role === 'admin' && (
                          <>
                            <div className="dropdown-divider" />
                            <Link to="/admin" className="dropdown-item dropdown-item-admin" data-testid="menu-admin" onClick={() => setUserMenuOpen(false)}>⚙️ Admin Panel</Link>
                          </>
                        )}
                        <div className="dropdown-divider" />
                        <button className="dropdown-item dropdown-item-danger" onClick={handleLogout} data-testid="menu-logout">
                          🚪 Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="auth-links">
                  <Link to="/login"    className="btn btn-outline btn-sm" data-testid="nav-login">Login</Link>
                  <Link to="/register" className="btn btn-accent  btn-sm" data-testid="nav-register">Register</Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" data-testid="mobile-menu-btn">
                ☰
              </button>
            </div>
          </nav>
        </div>

        {/* Category bar */}
        <div className="category-bar">
          <div className="container">
            <div className="category-links">
              {['electronics', 'clothing', 'books', 'home-kitchen', 'sports-fitness', 'beauty', 'toys-games', 'automotive'].map(cat => (
                <Link key={cat} to={`/products?category=${cat}`} className="category-link" data-testid={`cat-${cat}`}>
                  {cat.replace(/-/g, ' & ')}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="main-content" data-testid="main-content">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <p className="footer-logo">🛍 ShopQA</p>
              <p className="footer-desc">A complete e-commerce platform built for QA automation practice.</p>
            </div>
            <div>
              <p className="footer-heading">Shop</p>
              <Link to="/products" className="footer-link">All Products</Link>
              <Link to="/products?featured=true" className="footer-link">Featured</Link>
              <Link to="/products?inStock=true" className="footer-link">In Stock</Link>
            </div>
            <div>
              <p className="footer-heading">Account</p>
              <Link to="/profile"  className="footer-link">My Profile</Link>
              <Link to="/orders"   className="footer-link">My Orders</Link>
              <Link to="/wishlist" className="footer-link">Wishlist</Link>
            </div>
            <div>
              <p className="footer-heading">QA Resources</p>
              <a href="http://localhost:5000/api-docs" target="_blank" rel="noreferrer" className="footer-link">Swagger Docs</a>
              <a href="/api-test-guide.md" className="footer-link">Test Guide</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 ShopQA. Built for QA Automation Practice.</p>
            <p className="text-muted text-sm">v1.0.0 | {process.env.NODE_ENV}</p>
          </div>
        </div>
      </footer>

      <style>{`
        .navbar {
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 100;
          box-shadow: var(--shadow-sm);
        }
        .nav-inner {
          display: flex; align-items: center; gap: 16px;
          height: 64px;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-size: 1.4rem;
          text-decoration: none; color: var(--primary);
          white-space: nowrap;
        }
        .logo-icon { font-size: 1.6rem; }
        .nav-search {
          flex: 1; display: flex; gap: 8px;
          max-width: 480px;
        }
        .nav-search-input { border-radius: 8px; }
        .nav-search-btn { padding: 10px 14px; }
        .nav-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .nav-link { color: var(--text-muted); font-weight: 500; padding: 6px 10px; border-radius: var(--radius-sm); transition: all var(--transition); }
        .nav-link:hover { color: var(--primary); background: var(--bg-muted); }
        .cart-link { position: relative; font-size: 1.2rem; }
        .cart-badge {
          position: absolute; top: -6px; right: -6px;
          background: var(--accent); color: #fff;
          width: 18px; height: 18px;
          border-radius: 50%; font-size: 0.7rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .user-menu-wrap { position: relative; }
        .user-avatar-btn {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-muted); border: none;
          padding: 6px 12px; border-radius: 100px;
          cursor: pointer; transition: background var(--transition);
        }
        .user-avatar-btn:hover { background: var(--border); }
        .avatar-circle {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--accent); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700;
        }
        .user-name { font-weight: 600; font-size: 0.85rem; }
        .chevron { font-size: 0.7rem; color: var(--text-muted); transition: transform var(--transition); }
        .chevron.open { transform: rotate(180deg); }
        .dropdown-menu {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
          width: 220px; z-index: 200; overflow: hidden;
          animation: slideUp 150ms ease;
        }
        .dropdown-header { padding: 14px 16px; }
        .dropdown-name { font-weight: 700; font-size: 0.9rem; }
        .dropdown-email { font-size: 0.8rem; color: var(--text-muted); }
        .dropdown-divider { height: 1px; background: var(--border); }
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; font-size: 0.875rem; font-weight: 500;
          color: var(--text-primary); cursor: pointer; background: none;
          border: none; width: 100%; text-align: left;
          transition: background var(--transition);
        }
        .dropdown-item:hover { background: var(--bg-muted); }
        .dropdown-item-admin { color: var(--info); }
        .dropdown-item-danger { color: var(--danger); }
        .auth-links { display: flex; gap: 8px; }
        .hamburger { display: none; background: none; border: none; font-size: 1.4rem; color: var(--text-primary); }
        .category-bar { border-top: 1px solid var(--border); background: var(--bg-muted); }
        .category-links { display: flex; gap: 4px; overflow-x: auto; padding: 8px 0; scrollbar-width: none; }
        .category-links::-webkit-scrollbar { display: none; }
        .category-link {
          padding: 4px 14px; border-radius: 100px; font-size: 0.8rem; font-weight: 600;
          color: var(--text-muted); white-space: nowrap;
          transition: all var(--transition); text-transform: capitalize;
        }
        .category-link:hover { background: var(--primary); color: #fff; }
        .main-content { min-height: calc(100vh - 200px); }
        .footer { background: var(--primary); color: #fff; padding: 48px 0 24px; margin-top: 64px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; }
        .footer-logo { font-family: var(--font-display); font-size: 1.4rem; margin-bottom: 8px; }
        .footer-desc { color: #94a3b8; font-size: 0.875rem; }
        .footer-heading { font-weight: 700; margin-bottom: 12px; color: #e2e8f0; }
        .footer-link { display: block; color: #94a3b8; font-size: 0.875rem; padding: 3px 0; }
        .footer-link:hover { color: var(--accent); }
        .footer-bottom { border-top: 1px solid #334155; margin-top: 32px; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; color: #64748b; font-size: 0.875rem; }
        @media (max-width: 768px) {
          .nav-search { display: none; }
          .hamburger { display: block; }
          .category-bar { display: none; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
