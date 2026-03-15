import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

function StatCard({ label, value, sub, icon, color, testId }) {
  return (
    <div className="stat-card" data-testid={testId || 'stat-card'}>
      <div className="stat-icon" style={{ background: color }}>{icon}</div>
      <div className="stat-info">
        <p className="stat-label">{label}</p>
        <p className="stat-value" data-testid={`stat-${testId}`}>{value ?? '—'}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending: '#fbbf24', confirmed: '#60a5fa', processing: '#a78bfa',
  shipped: '#34d399', delivered: '#10b981', cancelled: '#f87171', refunded: '#fb923c',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="admin-layout">
      <div className="admin-page" data-testid="admin-dashboard-loading">
        <div className="stat-grid">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
      </div>
    </div>
  );

  const { stats, recentOrders, salesChart } = data || {};

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar" data-testid="admin-sidebar">
        <div className="sidebar-logo">⚙️ Admin Panel</div>
        <nav className="sidebar-nav">
          <Link to="/admin"          className="sidebar-link active" data-testid="sidebar-dashboard">📊 Dashboard</Link>
          <Link to="/admin/products" className="sidebar-link" data-testid="sidebar-products">📦 Products</Link>
          <Link to="/admin/orders"   className="sidebar-link" data-testid="sidebar-orders">🛍 Orders</Link>
          <Link to="/admin/users"    className="sidebar-link" data-testid="sidebar-users">👥 Users</Link>
          <Link to="/admin/coupons"  className="sidebar-link" data-testid="sidebar-coupons">🎟 Coupons</Link>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <a href="http://localhost:5000/api-docs" target="_blank" rel="noreferrer" className="sidebar-link" data-testid="sidebar-swagger">📚 API Docs</a>
          <Link to="/" className="sidebar-link" data-testid="sidebar-storefront">🛒 Storefront</Link>
        </nav>
      </aside>

      <main className="admin-page" data-testid="admin-dashboard">
        <div className="admin-page-header">
          <h1 className="admin-title">Dashboard</h1>
          <p className="text-muted">Welcome to ShopQA Admin Panel</p>
        </div>

        {/* Stats */}
        <div className="stat-grid" data-testid="stats-grid">
          <StatCard label="Total Revenue"    value={`₹${Number(stats?.total_revenue || 0).toLocaleString('en-IN')}`} sub={`₹${Number(stats?.revenue_month || 0).toLocaleString('en-IN')} this month`} icon="💰" color="#dcfce7" testId="total-revenue" />
          <StatCard label="Total Orders"     value={stats?.total_orders}   sub={`${stats?.pending_orders} pending`}  icon="📦" color="#dbeafe" testId="total-orders" />
          <StatCard label="Total Customers"  value={stats?.total_users}    sub={`${stats?.new_users_week} new this week`} icon="👥" color="#fce7f3" testId="total-users" />
          <StatCard label="Products"         value={stats?.total_products} sub={`${stats?.out_of_stock} out of stock`}   icon="🏷" color="#fff7ed" testId="total-products" />
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ marginTop: 24 }} data-testid="recent-orders">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Recent Orders</h3>
              <Link to="/admin/orders" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div className="table-wrapper">
              <table className="table" data-testid="orders-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders?.map(order => (
                    <tr key={order.order_number} data-testid="order-row">
                      <td><Link to={`/admin/orders?id=${order.order_number}`} className="text-accent" data-testid="order-number">{order.order_number}</Link></td>
                      <td data-testid="order-customer">{order.email}</td>
                      <td>
                        <span className={`badge status-${order.status}`} data-testid="order-status" style={{ background: STATUS_COLORS[order.status] + '22', color: STATUS_COLORS[order.status] }}>
                          {order.status}
                        </span>
                      </td>
                      <td data-testid="order-amount">₹{Number(order.total).toLocaleString('en-IN')}</td>
                      <td className="text-muted text-sm" data-testid="order-date">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sales chart (simple bar chart) */}
        {salesChart?.length > 0 && (
          <div className="card" style={{ marginTop: 24 }} data-testid="sales-chart">
            <div className="card-body">
              <h3 style={{ marginBottom: 16 }}>Revenue (Last 30 Days)</h3>
              <div className="bar-chart" aria-label="Revenue bar chart">
                {salesChart.slice(-14).map((d, i) => {
                  const maxRev = Math.max(...salesChart.map(x => parseFloat(x.revenue)));
                  const pct = maxRev > 0 ? (parseFloat(d.revenue) / maxRev) * 100 : 0;
                  return (
                    <div key={i} className="bar-col" title={`${d.date}: ₹${Number(d.revenue).toLocaleString('en-IN')}`} data-testid="bar-column">
                      <div className="bar" style={{ height: `${Math.max(pct, 4)}%` }} />
                      <span className="bar-label">{new Date(d.date).getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .admin-layout { display: flex; min-height: 100vh; }
        .admin-sidebar { width: 220px; background: var(--primary); color: #fff; padding: 24px 0; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sidebar-logo { font-family: var(--font-display); font-size: 1.1rem; padding: 0 20px 24px; border-bottom: 1px solid #334155; }
        .sidebar-nav { display: flex; flex-direction: column; padding: 16px 0; }
        .sidebar-link { display: flex; align-items: center; gap: 10px; padding: 10px 20px; color: #94a3b8; font-size: 0.875rem; font-weight: 500; transition: all var(--transition); }
        .sidebar-link:hover, .sidebar-link.active { background: #1e293b; color: #fff; }
        .admin-page { flex: 1; padding: 32px; overflow-x: hidden; }
        .admin-page-header { margin-bottom: 24px; }
        .admin-title { font-size: 1.75rem; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; display: flex; gap: 16px; align-items: center; }
        .stat-icon { width: 48px; height: 48px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
        .stat-value { font-size: 1.4rem; font-weight: 700; line-height: 1.2; }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
        .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 160px; padding-bottom: 24px; border-bottom: 2px solid var(--border); }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; }
        .bar { width: 100%; background: var(--accent); border-radius: 4px 4px 0 0; transition: height 0.5s ease; min-height: 4px; }
        .bar-label { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; position: absolute; bottom: -20px; }
        @media (max-width: 1024px) { .stat-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 768px) { .admin-sidebar { display: none; } .admin-page { padding: 16px; } }
      `}</style>
    </div>
  );
}
