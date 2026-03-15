import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setCart(null); return; }
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data.cart);
    } catch {} finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1, variantId) => {
    try {
      await api.post('/cart/items', { productId, quantity, variantId });
      toast.success('Added to cart!', { toastId: 'cart-add' });
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
      throw err;
    }
  }, [fetchCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
      throw err;
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      toast.info('Item removed from cart');
      await fetchCart();
    } catch {}
  }, [fetchCart]);

  const applyCoupon = useCallback(async (code) => {
    const { data } = await api.post('/cart/coupon', { code });
    await fetchCart();
    return data;
  }, [fetchCart]);

  const removeCoupon = useCallback(async () => {
    await api.delete('/cart/coupon');
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await api.delete('/cart');
    await fetchCart();
  }, [fetchCart]);

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
