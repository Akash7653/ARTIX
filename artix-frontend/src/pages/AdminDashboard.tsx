import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

/**
 * Admin Dashboard - Complete Admin Panel for ARTIX
 * Week 4 Phase 2: Frontend Admin Dashboard
 */

// Import sub-components
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import BulkOperationsPanel from './admin/BulkOperationsPanel';
import AdvancedSearchPanel from './admin/AdvancedSearchPanel';
import PerformanceDashboard from './admin/PerformanceDashboard';

const AdminDashboard = ({ token, adminEmail }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch alerts
        const alertsRes = await fetch('http://localhost:5000/api/monitor/alerts');
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);

        // Fetch stats
        const statsRes = await fetch('http://localhost:5000/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        setStats(statsData.data);

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
      // Refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title">
          <h1>📊 ARTIX Admin Dashboard</h1>
          <p>Complete event management and analytics</p>
        </div>
        <div className="admin-user-info">
          <span className="admin-email">{adminEmail}</span>
          <span className="login-time">Logged in</span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-banner">
          <div className="alerts-content">
            <h3>⚠️ Active Alerts ({alerts.length})</h3>
            <div className="alerts-list">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`alert alert-${alert.severity}`}>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-type">{alert.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button
          className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          ⚙️ Bulk Operations
        </button>
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Advanced Search
        </button>
        <button
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          ⚡ Performance
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'analytics' && <AnalyticsDashboard token={token} stats={stats} />}
            {activeTab === 'bulk' && <BulkOperationsPanel token={token} />}
            {activeTab === 'search' && <AdvancedSearchPanel token={token} />}
            {activeTab === 'performance' && <PerformanceDashboard />}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="admin-footer">
        <p>ARTIX 2026 Admin Panel | Version 1.0 | Week 4 Complete</p>
        <span className="update-time">Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
