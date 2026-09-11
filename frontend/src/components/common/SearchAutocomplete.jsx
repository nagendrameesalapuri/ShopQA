import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { productImageUrl } from '../../utils/productImage';

// Custom ARIA-combobox search box (not a native <select>/<input list>) with
// debounced, cancelable suggestion fetches — a realistic target for advanced
// Playwright practice: keyboard-driven listbox navigation, race-condition-safe
// network requests (AbortController), and non-trivial locator strategy.
const DEBOUNCE_MS = 300;

export default function SearchAutocomplete() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const fetchSuggestions = useCallback((q) => {
    if (abortRef.current) abortRef.current.abort();
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    api
      .get('/products/search/suggestions', { params: { q }, signal: controller.signal })
      .then(({ data }) => {
        setSuggestions(data.suggestions || []);
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          setSuggestions([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToProduct = (product) => {
    setOpen(false);
    setQuery('');
    setSuggestions([]);
    navigate(`/products/${product.slug}`);
  };

  const submitFullSearch = () => {
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1 >= suggestions.length ? 0 : i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 < 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goToProduct(suggestions[activeIndex]);
      } else {
        submitFullSearch();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const listboxId = 'search-suggestions-listbox';
  const activeId = activeIndex >= 0 ? `search-option-${activeIndex}` : undefined;

  return (
    <div className="search-autocomplete" ref={wrapRef} role="search">
      <div
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-haspopup="listbox"
        aria-owns={listboxId}
        aria-controls={listboxId}
        style={{ display: 'flex', flex: 1, gap: 8 }}
      >
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          className="form-input nav-search-input"
          placeholder="Search products..."
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          data-testid="nav-search-input"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn btn-accent nav-search-btn"
          data-testid="nav-search-btn"
          aria-label="Search"
          onClick={submitFullSearch}
        >
          🔍
        </button>
      </div>

      {open && (loading || suggestions.length > 0) && (
        <ul
          id={listboxId}
          role="listbox"
          className="search-suggestions"
          data-testid="search-suggestions"
          aria-label="Search suggestions"
        >
          {loading && (
            <li className="search-suggestion-loading" data-testid="search-suggestions-loading">
              <span className="spinner spinner-sm" /> Searching…
            </li>
          )}
          {!loading &&
            suggestions.map((s, i) => (
              <li
                key={s.slug}
                id={`search-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`search-suggestion-item ${i === activeIndex ? 'active' : ''}`}
                data-testid="search-suggestion-item"
                onMouseDown={(e) => { e.preventDefault(); goToProduct(s); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <img src={productImageUrl(s.thumbnail, s, 60)} alt="" className="search-suggestion-thumb" />
                <span className="search-suggestion-name">{s.name}</span>
                <span className="search-suggestion-price">₹{Number(s.price).toLocaleString('en-IN')}</span>
              </li>
            ))}
        </ul>
      )}

      <style>{`
        .search-autocomplete { position: relative; flex: 1; display: flex; max-width: 480px; }
        .search-suggestions {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
          list-style: none; max-height: 360px; overflow-y: auto; z-index: 300;
          padding: 6px;
        }
        .search-suggestion-loading { display: flex; align-items: center; gap: 8px; padding: 12px; font-size: 0.85rem; color: var(--text-muted); }
        .search-suggestion-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-sm); cursor: pointer; }
        .search-suggestion-item:hover, .search-suggestion-item.active { background: var(--bg-muted); }
        .search-suggestion-thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .search-suggestion-name { flex: 1; font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .search-suggestion-price { font-size: 0.8rem; font-weight: 700; color: var(--accent-dark); }
      `}</style>
    </div>
  );
}
