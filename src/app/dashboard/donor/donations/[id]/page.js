'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import DonationTimeline from '@/components/DonationTimeline';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function DonorDonationDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [donation, setDonation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintType, setComplaintType] = useState('pickup_not_completed');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDonation = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDonation(data.donation);
        setHistory(data.history || []);
      } else {
        showError('Donation not found');
      }
    } catch (err) {
      showError('Failed to load donation details');
    } finally {
      setLoading(false);
    }
  }, [id, getToken, showError]);

  useEffect(() => {
    fetchDonation();
  }, [fetchDonation]);

  const handleCancelDonation = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/donations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: cancelReason,
        }),
      });

      if (res.ok) {
        showSuccess('Donation cancelled successfully.');
        setShowCancelModal(false);
        fetchDonation();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to cancel donation');
      }
    } catch (err) {
      showError('Network error while cancelling');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileComplaint = async () => {
    if (!complaintDesc) {
      showError('Please describe your complaint');
      return;
    }
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          donation_id: donation.id,
          type: complaintType,
          description: complaintDesc,
        }),
      });

      if (res.ok) {
        showSuccess('Complaint submitted. Support will investigate soon.');
        setShowComplaintModal(false);
        setComplaintDesc('');
      } else {
        showError('Failed to submit complaint');
      }
    } catch (err) {
      showError('Network error submitting complaint');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['donor']}>
        <div className="loading-center">
          <div className="spinner spinner-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!donation) {
    return (
      <DashboardLayout allowedRoles={['donor']}>
        <div className="card text-center p-8">
          <h3>Donation Not Found</h3>
          <p className="text-sm text-tertiary mt-2">The requested donation record does not exist.</p>
          <Link href="/dashboard/donor/donations" className="btn btn-primary mt-4">
            Back to My Donations
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const canCancel = ['submitted', 'pending_acceptance', 'accepted'].includes(donation.status);

  return (
    <DashboardLayout allowedRoles={['donor']}>
      <div className="dashboard-content-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/donor/donations" className="btn btn-ghost btn-sm">
              ← Back
            </Link>
            <h1>{donation.donation_id}</h1>
            <StatusBadge status={donation.status} />
          </div>
          <p className="mt-1">Created on {new Date(donation.created_at).toLocaleString()}</p>
        </div>

        <div className="flex gap-2">
          {canCancel && (
            <button className="btn btn-danger btn-sm" onClick={() => setShowCancelModal(true)}>
              Cancel Donation
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => setShowComplaintModal(true)}>
            ⚠️ File Issue / Complaint
          </button>
        </div>
      </div>

      <div className="grid grid-3 gap-8">
        {/* Left Column: Details */}
        <div style={{ gridColumn: 'span 2' }} className="flex flex-col gap-6">
          <div className="card">
            <h3 className="mb-4">Item Details</h3>
            <div className="grid grid-2 gap-4 text-sm">
              <div>
                <span className="text-tertiary text-xs display-block">Category & Icon</span>
                <div className="font-semibold mt-1">
                  {donation.category_icon} {donation.category_name}
                </div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Item Type & Qty</span>
                <div className="font-semibold mt-1">
                  {donation.quantity} × {donation.item_type}
                </div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Condition</span>
                <div className="font-semibold mt-1 capitalize">{donation.condition?.replace(/_/g, ' ')}</div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Size / Weight</span>
                <div className="font-semibold mt-1">{donation.size_weight || 'Not specified'}</div>
              </div>
            </div>

            {donation.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-tertiary text-xs display-block mb-1">Donor Notes</span>
                <p className="text-sm">{donation.description}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-4">Pickup Information</h3>
            <div className="grid grid-2 gap-4 text-sm">
              <div>
                <span className="text-tertiary text-xs display-block">Pickup Address</span>
                <div className="font-semibold mt-1">
                  {donation.pickup_address}, {donation.pickup_city} ({donation.pickup_pin_code})
                </div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Scheduled Slot</span>
                <div className="font-semibold mt-1">
                  📅 {donation.pickup_date || 'TBD'} @ {donation.pickup_time_slot || 'TBD'}
                </div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Landmark</span>
                <div className="font-semibold mt-1">{donation.landmark || 'None specified'}</div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Number of Packages / weight</span>
                <div className="font-semibold mt-1">📦 {donation.num_packages || 1} ({donation.size_weight || 'Not specified'})</div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Contact Phone</span>
                <div className="font-semibold mt-1">{donation.pickup_contact_phone || 'N/A'}</div>
              </div>

              <div>
                <span className="text-tertiary text-xs display-block">Instructions</span>
                <div className="font-semibold mt-1">{donation.pickup_instructions || 'None'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Timeline & Recipient */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="mb-4">Status Timeline</h3>
            <DonationTimeline history={history} />
          </div>

          <div className="card">
            <h3 className="mb-2">Assigned Organization</h3>
            {donation.org_name ? (
              <div>
                <div className="font-semibold text-primary-700">{donation.org_name}</div>
                <span className="badge badge-success text-xs mt-1">Verified Organization</span>
              </div>
            ) : (
              <p className="text-xs text-tertiary">Platform auto-matching in progress...</p>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Donation"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
              Keep Donation
            </button>
            <button className="btn btn-danger" onClick={handleCancelDonation} disabled={actionLoading}>
              {actionLoading ? <span className="spinner" /> : 'Confirm Cancellation'}
            </button>
          </>
        }
      >
        <p className="text-sm text-secondary mb-4">
          Are you sure you want to cancel donation <strong>{donation.donation_id}</strong>?
        </p>
        <div className="form-group">
          <label className="form-label">Reason for cancellation</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Plans changed, items no longer available..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Complaint Modal */}
      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title="Report an Issue / File Complaint"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowComplaintModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleFileComplaint} disabled={actionLoading}>
              {actionLoading ? <span className="spinner" /> : 'Submit Complaint'}
            </button>
          </>
        }
      >
        <div className="form-group mb-4">
          <label className="form-label">Issue Type</label>
          <select
            className="form-select"
            value={complaintType}
            onChange={(e) => setComplaintType(e.target.value)}
          >
            <option value="pickup_not_completed">Pickup Not Completed / Partner Didn't Arrive</option>
            <option value="wrong_status">Incorrect Status Update</option>
            <option value="damaged_items">Damaged Items Issue</option>
            <option value="ngo_misconduct">NGO Unresponsive / Misconduct</option>
            <option value="other">Other Issue</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Detailed Description *</label>
          <textarea
            className="form-textarea"
            placeholder="Explain what went wrong in detail..."
            value={complaintDesc}
            onChange={(e) => setComplaintDesc(e.target.value)}
            required
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
