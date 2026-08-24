'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function AdminComplaintsPage() {
  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/api/complaints';
      if (statusFilter !== 'all') url += `?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Fetch complaints error:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleResolveComplaint = async (newStatus) => {
    if (!selectedComplaint) return;
    setActionLoading(true);

    try {
      const token = getToken();
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedComplaint.id,
          status: newStatus,
          resolution: resolutionNotes,
        }),
      });

      if (res.ok) {
        showSuccess(`Complaint marked as ${newStatus}!`);
        setSelectedComplaint(null);
        setResolutionNotes('');
        fetchComplaints();
      } else {
        showError('Failed to update complaint');
      }
    } catch {
      showError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="dashboard-content-header">
        <h1>Complaints & Disputes Resolution (FR-ADM-04)</h1>
        <p>Investigate and resolve user-reported issues linked to donations or accounts.</p>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-6 p-4">
        <div className="tabs" style={{ borderBottom: 'none' }}>
          {['open', 'under_review', 'resolved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              className={`tab ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'open' ? 'Open Issues 🔥' : tab.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No Complaints Found"
          description={`No complaints in '${statusFilter}' status right now.`}
        />
      ) : (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Reporter</th>
                <th>Donation Ref</th>
                <th>Issue Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-xs">#CMP-{c.id}</td>
                  <td>
                    <div className="font-medium text-xs">{c.reporter_name}</div>
                    <div className="text-xs text-tertiary">{c.reporter_email}</div>
                  </td>
                  <td className="text-xs font-semibold">{c.donation_ref || 'N/A'}</td>
                  <td>
                    <span className="badge badge-warning text-xs capitalize">{c.type?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="text-xs truncate" style={{ maxWidth: '240px' }}>{c.description}</td>
                  <td><StatusBadge status={c.status} type="complaint" /></td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm text-xs"
                      onClick={() => {
                        setSelectedComplaint(c);
                        setResolutionNotes(c.resolution || '');
                      }}
                    >
                      Resolve Issue →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Resolve Complaint #CMP-${selectedComplaint.id}`}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setSelectedComplaint(null)}>
                Cancel
              </button>
              <button
                className="btn btn-ghost text-error"
                onClick={() => handleResolveComplaint('rejected')}
                disabled={actionLoading}
              >
                Reject Complaint
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleResolveComplaint('resolved')}
                disabled={actionLoading}
              >
                {actionLoading ? <span className="spinner" /> : 'Mark Resolved'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div><strong>Reporter:</strong> {selectedComplaint.reporter_name} ({selectedComplaint.reporter_email})</div>
              <div className="mt-1"><strong>Issue Type:</strong> {selectedComplaint.type?.replace(/_/g, ' ')}</div>
              <div className="mt-2 text-xs text-secondary">
                <strong>Description:</strong> "{selectedComplaint.description}"
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Resolution Notes & Findings</label>
              <textarea
                className="form-textarea"
                placeholder="Detail resolution steps taken, partner warning issued, or refund/reschedule outcome..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
