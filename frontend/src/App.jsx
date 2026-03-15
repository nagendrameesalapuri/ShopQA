import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Lazy loaded pages (for testing lazy loading scenarios)
const Home           = lazy(() => import('./pages/Home'));
const ProductList    = lazy(() => import('./pages/ProductList'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail'));
const Cart           = lazy(() => import('./pages/Cart'));
const Checkout       = lazy(() => import('./pages/Checkout'));
const OrderConfirm   = lazy(() => import('./pages/OrderConfirmation'));
const Orders         = lazy(() => import('./pages/Orders'));
const OrderDetail    = lazy(() => import('./pages/OrderDetail'));
const Profile        = lazy(() => import('./pages/Profile'));
const Wishlist       = lazy(() => import('./pages/Wishlist'));
const Login          = lazy(() => import('./pages/auth/Login'));
const Register       = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail    = lazy(() => import('./pages/auth/VerifyEmail'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts  = lazy(() => import('./pages/admin/Products'));
const AdminOrders    = lazy(() => import('./pages/admin/Orders'));
const AdminUsers     = lazy(() => import('./pages/admin/Users'));
const AdminCoupons   = lazy(() => import('./pages/admin/Coupons'));
const NotFound       = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<LoadingSpinner fullPage />}>
            <Routes>
              {/* Public routes */}
              <Route element={<Layout />}>
                <Route path="/"                  element={<Home />} />
                <Route path="/products"          element={<ProductList />} />
                <Route path="/products/:id"      element={<ProductDetail />} />
                <Route path="/login"             element={<Login />} />
                <Route path="/register"          element={<Register />} />
                <Route path="/forgot-password"   element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email/:token"   element={<VerifyEmail />} />

                {/* Protected user routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/cart"             element={<Cart />} />
                  <Route path="/checkout"         element={<Checkout />} />
                  <Route path="/order-confirmation/:id" element={<OrderConfirm />} />
                  <Route path="/orders"           element={<Orders />} />
                  <Route path="/orders/:id"       element={<OrderDetail />} />
                  <Route path="/profile"          element={<Profile />} />
                  <Route path="/wishlist"         element={<Wishlist />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin"             element={<AdminDashboard />} />
                <Route path="/admin/products"    element={<AdminProducts />} />
                <Route path="/admin/orders"      element={<AdminOrders />} />
                <Route path="/admin/users"       element={<AdminUsers />} />
                <Route path="/admin/coupons"     element={<AdminCoupons />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            data-testid="toast-container"
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
