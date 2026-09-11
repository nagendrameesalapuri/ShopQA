import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

// Cross-tab cart sync: the cart is server-persisted with no push channel of
// its own, so "add to cart in tab A" doesn't reach tab B without this. A
// BroadcastChannel message tells every other same-origin tab to refetch —
// a clean target for multi-context Playwright tests (mutate in one
// browser context/page, assert the other page's UI updates without reload).
const CHANNEL_NAME = 'shopqa-cart-sync';

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setCart(null); return; }
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data.cart);
    } catch {} finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      if (event.data === 'cart-updated') fetchCart();
    };
    return () => channel.close();
  }, [fetchCart]);

  const notifyOtherTabs = useCallback(() => {
    channelRef.current?.postMessage('cart-updated');
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1, variantId) => {
    try {
      await api.post('/cart/items', { productId, quantity, variantId });
      toast.success('Added to cart!', { toastId: 'cart-add' });
      await fetchCart();
      notifyOtherTabs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
      throw err;
    }
  }, [fetchCart, notifyOtherTabs]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      await fetchCart();
      notifyOtherTabs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
      throw err;
    }
  }, [fetchCart, notifyOtherTabs]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      toast.info('Item removed from cart');
      await fetchCart();
      notifyOtherTabs();
    } catch {}
  }, [fetchCart, notifyOtherTabs]);

  const applyCoupon = useCallback(async (code) => {
    const { data } = await api.post('/cart/coupon', { code });
    await fetchCart();
    notifyOtherTabs();
    return data;
  }, [fetchCart, notifyOtherTabs]);

  const removeCoupon = useCallback(async () => {
    await api.delete('/cart/coupon');
    await fetchCart();
    notifyOtherTabs();
  }, [fetchCart, notifyOtherTabs]);

  const clearCart = useCallback(async () => {
    await api.delete('/cart');
    await fetchCart();
    notifyOtherTabs();
  }, [fetchCart, notifyOtherTabs]);

  const itemCount = cart?.itemCount || 0;

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, fetchCart, addToCart, updateQuantity, removeItem, applyCoupon, removeCoupon, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
