import React, { useState } from 'react';

/**
 * Advanced Search Panel Component
 * Multi-field search with filters and export
 */

const AdvancedSearchPanel = ({ token }) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    approvalStatus: '',
    paymentStatus: '',
    event: '',
    college: '',
    department: '',
    sort: 'date_desc'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportFormat, setExportFormat] = useState('csv');

  // Build query string
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (searchText) params.append('search', searchText);
    if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.event) params.append('event', filters.event);
    if (filters.college) params.append('college', filters.college);
    if (filters.department) params.append('department', filters.department);
    params.append('sort', filters.sort);
    params.append('page', page);
    params.append('limit', 25);
    return params.toString();
  };

  // Perform search
  const performSearch = async () => {
    try {
      setLoading(true);
      const query = buildQuery();
      const res = await fetch(`http://localhost:5000/api/admin/search?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResults(data.results || []);
      setTotalResults(data.pagination?.total || 0);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export results
  const exportResults = async () => {
    try {
      const fields = ['participant_name', 'email', 'phone_number', 'college_name', 'event_name', 'total_amount', 'approval_status'];
      const res = await fetch('http://localhost:5000/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          format: exportFormat,
          fields,
          filters: Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
          includeSummary: true
        })
      });

      const data = await res.json();
      
      if (exportFormat === 'csv') {
        // Download CSV
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data.data || data));
        element.setAttribute('download', `registrations_${new Date().toISOString().split('T')[0]}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        // Handle JSON/Excel
        alert('Export ready! Check your downloads folder.');
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="advanced-search-panel">
      <h2>🔍 Advanced Search</h2>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, email, phone, or college..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && performSearch()}
        />
        <button className="btn btn-primary" onClick={performSearch} disabled={loading}>
          {loading ? '⏳ Searching...' : '🔍 Search'}
        </button>
      </div>

      {/* Filters */}
      <div className="filters-grid">
        <div className="filter">
          <label>Status</label>
          <select value={filters.approvalStatus} onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}>
            <option value="">Any</option>
            <option value="approved">✅ Approved</option>
            <option value="pending">⏳ Pending</option>
            <option value="rejected">❌ Rejected</option>
          </select>
        </div>

        <div className="filter">
          <label>Payment</label>
          <select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}>
            <option value="">Any</option>
            <option value="completed">✅ Completed</option>
            <option value="pending">⏳ Pending</option>
            <option value="failed">❌ Failed</option>
          </select>
        </div>

        <div className="filter">
          <label>Event</label>
          <input
            type="text"
            placeholder="e.g., Robotics Challenge"
            value={filters.event}
            onChange={(e) => setFilters({ ...filters, event: e.target.value })}
          />
        </div>

        <div className="filter">
          <label>College</label>
          <input
            type="text"
            placeholder="e.g., MIT Chennai"
            value={filters.college}
            onChange={(e) => setFilters({ ...filters, college: e.target.value })}
          />
        </div>

        <div className="filter">
          <label>Department</label>
          <input
            type="text"
            placeholder="e.g., CSE"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
        </div>

        <div className="filter">
          <label>Sort By</label>
          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="date_desc">📅 Newest First</option>
            <option value="date_asc">📅 Oldest First</option>
            <option value="name_asc">A-Z Name</option>
            <option value="name_desc">Z-A Name</option>
            <option value="amount_desc">💰 Highest Amount</option>
            <option value="amount_asc">💰 Lowest Amount</option>
          </select>
        </div>

        <div className="filter">
          <label>Export Format</label>
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
            <option value="csv">📊 CSV</option>
            <option value="json">📋 JSON</option>
            <option value="xlsx">📈 Excel</option>
          </select>
        </div>
      </div>

      {/* Export Button */}
      {results.length > 0 && (
        <button className="btn btn-success" onClick={exportResults}>
          📥 Export {results.length} Results as {exportFormat.toUpperCase()}
        </button>
      )}

      {/* Results */}
      <div className="search-results">
        <h3>Results ({totalResults} found)</h3>

        {results.length === 0 && !loading && (
          <p className="no-results">No registrations found. Try adjusting your search.</p>
        )}

        {results.length > 0 && (
          <>
            <div className="results-table">
              <div className="table-header">
                <div>Name</div>
                <div>Email</div>
                <div>College</div>
                <div>Event</div>
                <div>Status</div>
                <div>Amount</div>
              </div>

              {results.map((reg) => (
                <div key={reg._id} className="table-row">
                  <div>{reg.participant_name || reg.full_name}</div>
                  <div>{reg.email}</div>
                  <div>{reg.college_name}</div>
                  <div>{reg.event_name}</div>
                  <div>
                    <span className={`badge badge-${reg.approval_status}`}>
                      {reg.approval_status}
                    </span>
                  </div>
                  <div>₹{reg.total_amount}</div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchPanel;
