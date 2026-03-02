import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Analytics Dashboard Component
 * Visualizes registration data across multiple dimensions
 */

const AnalyticsDashboard = ({ token, stats }) => {
  const [collegeStats, setCollegeStats] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all analytics
        const [colleges, departments, events, timeline, perf] = await Promise.all([
          fetch('http://localhost:5000/api/admin/analytics/colleges', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()),
          fetch('http://localhost:5000/api/admin/analytics/departments', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()),
          fetch('http://localhost:5000/api/admin/analytics/events', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()),
          fetch('http://localhost:5000/api/admin/analytics/timeline?startDate=2024-01-01&endDate=2026-12-31', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()),
          fetch('http://localhost:5000/api/admin/analytics/performance', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json())
        ]);

        setCollegeStats(colleges.data || []);
        setDepartmentStats(departments.data || []);
        setEventStats(events.data || []);
        setTimeline(timeline.data || []);
        setMetrics(perf.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }
    };

    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="analytics-dashboard">
      {/* Key Metrics */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <h3>Total Registrations</h3>
              <p className="metric-value">{metrics.totalRegistrations}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <h3>Approval Rate</h3>
              <p className="metric-value">{metrics.approvalRate}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">💵</div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <p className="metric-value">₹{metrics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">✔️</div>
            <div className="metric-content">
              <h3>Verification Rate</h3>
              <p className="metric-value">{metrics.verificationRate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Timeline Chart */}
        <div className="chart-container">
          <h2>Registration Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Total" />
              <Line type="monotone" dataKey="approved" stroke="#10b981" name="Approved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* College Distribution */}
        <div className="chart-container">
          <h2>Top Colleges</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collegeStats.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalRegistrations" fill="#3b82f6" name="Total" />
              <Bar dataKey="approvedRegistrations" fill="#10b981" name="Approved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Distribution */}
        <div className="chart-container">
          <h2>Event Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventStats}
                dataKey="totalRegistrations"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {eventStats.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Stats */}
        <div className="chart-container">
          <h2>Department Distribution</h2>
          <div className="department-list">
            {departmentStats.map((dept, idx) => (
              <div key={idx} className="dept-item">
                <div className="dept-name">{dept._id}</div>
                <div className="dept-stats">
                  <span>Total: {dept.totalRegistrations}</span>
                  <span>Approved: {dept.approvedCount}</span>
                  <span>Avg Fee: ₹{dept.averageAmount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      {stats && stats.revenueStats && (
        <div className="revenue-summary">
          <h2>Revenue by Status</h2>
          <div className="revenue-breakdown">
            {stats.revenueStats.map((item, idx) => (
              <div key={idx} className="revenue-item">
                <h3>{item._id || 'Unknown'}</h3>
                <p className="revenue-amount">₹{item.total?.toLocaleString() || 0}</p>
                <p className="revenue-avg">Avg: ₹{Math.round(item.avg || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="analytics-actions">
        <button className="btn btn-primary" onClick={() => window.location.href = 'http://localhost:5000/api/monitor/export?format=json'}>
          📥 Download Report
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
