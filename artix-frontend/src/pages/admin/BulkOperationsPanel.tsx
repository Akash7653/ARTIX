import React, { useState, useEffect } from 'react';

/**
 * Bulk Operations Panel Component
 * Manage multiple registrations simultaneously
 */

const BulkOperationsPanel = ({ token }) => {
  const [registrations, setRegistrations] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch registrations for bulk operations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/admin/search?page=${page}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setRegistrations(data.results || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch (err) {
        console.error('Failed to fetch registrations:', err);
      }
    };

    if (token) {
      fetchRegistrations();
    }
  }, [token, page]);

  // Toggle selection
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all on current page
  const selectAll = () => {
    if (selectedIds.size === registrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(registrations.map(r => r._id)));
    }
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (selectedIds.size === 0) {
      setFeedback({ type: 'error', message: '⚠️ Please select at least one registration' });
      return;
    }

    try {
      setLoading(true);
      const registrationIds = Array.from(selectedIds);

      let endpoint = '';
      let body = { registration_ids: registrationIds };

      switch (action) {
        case 'approve':
          endpoint = '/api/admin/bulk-approve';
          break;
        case 'reject':
          endpoint = '/api/admin/bulk-reject';
          body.reason = reason || 'Not selected';
          break;
        case 'verify':
          endpoint = '/api/admin/bulk-verify';
          break;
        case 'select':
          endpoint = '/api/admin/bulk-select';
          body.selected = true;
          break;
        default:
          return;
      }

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: 'success',
          message: `✅ ${data.message}`
        });
        setSelectedIds(new Set());
        setReason('');
        // Refresh list
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setFeedback({
          type: 'error',
          message: `❌ ${data.error || 'Operation failed'}`
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `❌ Error: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-operations-panel">
      <h2>⚙️ Bulk Operations</h2>

      {/* Feedback Message */}
      {feedback && (
        <div className={`feedback feedback-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Controls */}
      <div className="bulk-controls">
        <div className="control-group">
          <label htmlFor="bulkAction">Action:</label>
          <select id="bulkAction" value={action} onChange={(e) => setAction(e.target.value)} disabled={loading}>
            <option value="approve">✅ Approve</option>
            <option value="reject">❌ Reject</option>
            <option value="verify">✔️ Verify Entry</option>
            <option value="select">📌 Mark Selected</option>
          </select>
        </div>

        {action === 'reject' && (
          <div className="control-group">
            <label htmlFor="rejectionReason">Rejection Reason:</label>
            <input
              id="rejectionReason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Not meeting criteria"
              disabled={loading}
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={executeBulkAction}
          disabled={loading || selectedIds.size === 0}
        >
          {loading ? '⏳ Processing...' : `Execute (${selectedIds.size} selected)`}
        </button>
      </div>

      {/* Registration List */}
      <div className="registrations-list">
        <div className="list-header">
          <div className="list-col checkbox">
            <input
              type="checkbox"
              aria-label="Select all registrations"
              checked={selectedIds.size === registrations.length && registrations.length > 0}
              onChange={selectAll}
            />
            {selectedIds.size > 0 && <span>{selectedIds.size} selected</span>}
          </div>
          <div className="list-col">Name</div>
          <div className="list-col">Email</div>
          <div className="list-col">Event</div>
          <div className="list-col">Status</div>
          <div className="list-col">Amount</div>
        </div>

        {registrations.map((reg) => (
          <div key={reg._id} className={`list-row ${selectedIds.has(reg._id) ? 'selected' : ''}`}>
            <div className="list-col checkbox">
              <input
                type="checkbox"
                aria-label={`Select registration for ${reg.participant_name || reg.full_name}`}
                checked={selectedIds.has(reg._id)}
                onChange={() => toggleSelection(reg._id)}
              />
            </div>
            <div className="list-col">{reg.participant_name || reg.full_name}</div>
            <div className="list-col">{reg.email}</div>
            <div className="list-col">{reg.event_name}</div>
            <div className="list-col">
              <span className={`badge badge-${reg.approval_status}`}>
                {reg.approval_status}
              </span>
            </div>
            <div className="list-col">₹{reg.total_amount}</div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>

      {/* Summary */}
      {selectedIds.size > 0 && (
        <div className="summary">
          <h3>Summary</h3>
          <p>Selected Registrations: <strong>{selectedIds.size}</strong></p>
          <p>Action: <strong>{action.toUpperCase()}</strong></p>
          {action === 'reject' && <p>Reason: <strong>{reason || 'Not specified'}</strong></p>}
        </div>
      )}
    </div>
  );
};

export default BulkOperationsPanel;
