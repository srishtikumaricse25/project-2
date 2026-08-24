'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import DonationTimeline from '@/components/DonationTimeline';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function NGODonationDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [donation, setDonation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for distribution & receiving record
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [receivedQty, setReceivedQty] = useState('');
  const [acceptedQty, setAcceptedQty] = useState('');
  const [rejectedQty, setRejectedQty] = useState('0');
  const [distributedQty, setDistributedQty] = useState('');
  const [distributionNotes, setDistributionNotes] = useState('');
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
        setReceivedQty(data.donation.received_qty || data.donation.quantity);
        setAcceptedQty(data.donation.accepted_qty || data.donation.quantity);
        setDistributedQty(data.donation.distributed_qty || data.donation.quantity);
      }
    } catch {
      showError('Failed to fetch donation details');
    } finally {
      setLoading(false);
    }
  }, [id, getToken, showError]);

  useEffect(() => {
    fetchDonation();
  }, [fetchDonation]);

  const handleUpdateStatus = async (status, extraData = {}) => {
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
          status,
          ...extraData,
        }),
      });

      if (res.ok) {
        showSuccess(`Donation updated to ${status.replace(/_/g, ' ')}`);
        setShowRecordModal(false);
        fetchDonation();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update donation');
      }
    } catch {
      showError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['ngo']}>
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      </DashboardLayout>
    );
  }

  if (!donation) {
    return (
      <DashboardLayout allowedRoles={['ngo']}>
        <div className="card text-center p-8">
          <h3>Donation Record Not Found</h3>
          <Link href="/dashboard/ngo/donations" className="btn btn-primary mt-4">
            Back to Incoming List
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['ngo']}>
      <div className="dashboard-content-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/ngo/donations" className="btn btn-ghost btn-sm">
              ← Back
            </Link>
            <h1>{donation.donation_id}</h1>
            <StatusBadge status={donation.status} />
          </div>
          <p className="mt-1">Donor: {donation.donor_name} ({donation.donor_phone})</p>
        </div>

        {/* Status Transition Control Bar */}
        <div className="flex flex-wrap gap-2">
          {['submitted', 'pending_acceptance'].includes(donation.status) && (
            <>
              <button
                className="btn btn-success"
                onClick={() => handleUpdateStatus('accepted', { notes: 'Accepted by NGO' })}
                disabled={actionLoading}
              >
                Accept Donation
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleUpdateStatus('rejected', { rejection_reason: 'Does not meet current guidelines' })}
                disabled={actionLoading}
              >
                Decline
              </button>
            </>
          )}

          {donation.status === 'accepted' && (
            <button
              className="btn btn-primary"
              onClick={() => handleUpdateStatus('pickup_scheduled', { notes: 'Pickup scheduled with partner' })}
              disabled={actionLoading}
            >
              📅 Schedule Pickup
            </button>
          )}

          {donation.status === 'pickup_scheduled' && (
            <button
              className="btn btn-primary"
              onClick={() => handleUpdateStatus('picked_up', { notes: 'Items collected from donor' })}
              disabled={actionLoading}
            >
              📦 Mark Picked Up
            </button>
          )}

          {donation.status === 'picked_up' && (
            <button
              className="btn btn-primary"
              onClick={() => handleUpdateStatus('received', { notes: 'Items received at NGO warehouse' })}
              disabled={actionLoading}
            >
              🏢 Mark Received
            </button>
          )}

          {['received', 'sorted'].includes(donation.status) && (
            <button className="btn btn-success" onClick={() => setShowRecordModal(true)}>
              🤝 Record Distribution & Quantities
            </button>
          )}

          {donation.status === 'distributed' && (
            <button
              className="btn btn-success"
              onClick={() => handleUpdateStatus('completed', { notes: 'Donation lifecycle completed' })}
              disabled={actionLoading}
            >
              🌟 Mark Completed
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-3 gap-8">
        {/* Left Column */}
        <div style={{ gridColumn: 'span 2' }} className="flex flex-col gap-6">
          <div className="card">
            <h3 className="mb-4">Item & Donor Specifications</h3>
            <div className="grid grid-2 gap-4 text-sm">
              <div>
                <span className="text-tertiary text-xs">Item & Category</span>
                <div className="font-semibold mt-1">
                  {donation.category_icon} {donation.quantity} × {donation.item_type} ({donation.category_name})
                </div>
              </div>

              <div>
                <span className="text-tertiary text-xs">Reported Condition</span>
                <div className="font-semibold mt-1 capitalize">{donation.condition}</div>
              </div>

              <div>
                <span className="text-tertiary text-xs">Donor Name</span>
                <div className="font-semibold mt-1">{donation.donor_name}</div>
              </div>

              <div>
                <span className="text-tertiary text-xs">Donor Phone & Email</span>
                <div className="font-semibold mt-1">{donation.donor_phone} • {donation.donor_email}</div>
              </div>
            </div>

            {donation.description && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                <span className="text-tertiary text-xs">Description / Notes</span>
                <p className="mt-1">{donation.description}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-4">Received & Distribution Records (FR-NGO-06)</h3>
            <div className="grid grid-4 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-xs text-tertiary">Offered Qty</span>
                <div className="text-lg font-bold mt-1">{donation.quantity}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-xs text-tertiary">Received Qty</span>
                <div className="text-lg font-bold text-primary-600 mt-1">{donation.received_qty || 'Pending'}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-xs text-tertiary">Accepted Qty</span>
                <div className="text-lg font-bold text-success mt-1">{donation.accepted_qty || 'Pending'}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-xs text-tertiary">Distributed Qty</span>
                <div className="text-lg font-bold text-teal-700 mt-1">{donation.distributed_qty || 'Pending'}</div>
              </div>
            </div>

            {donation.distribution_notes && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs">
                <span className="text-tertiary">Distribution Notes:</span> {donation.distribution_notes}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-4">Pickup Location Details</h3>
            <p className="text-sm">📍 {donation.pickup_address}, {donation.pickup_city} ({donation.pickup_pin_code})</p>
            {donation.landmark && (
              <p className="text-xs text-secondary mt-1">Landmark: <strong>{donation.landmark}</strong></p>
            )}
            <p className="text-xs text-secondary mt-1">Packages: <strong>{donation.num_packages || 1} package(s)</strong> • Est. Weight: <strong>{donation.size_weight || 'Not specified'}</strong></p>
            <p className="text-xs text-tertiary mt-2">📅 Scheduled: {donation.pickup_date} @ {donation.pickup_time_slot}</p>
            {donation.pickup_instructions && (
              <p className="text-xs text-secondary mt-1">Instructions: {donation.pickup_instructions}</p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div>
          <div className="card">
            <h3 className="mb-4">Lifecycle Audit Log</h3>
            <DonationTimeline history={history} />
          </div>
        </div>
      </div>

      {/* Record Distribution Quantities Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Received & Distributed Quantities"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowRecordModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={() =>
                handleUpdateStatus('distributed', {
                  received_qty: parseInt(receivedQty) || 0,
                  accepted_qty: parseInt(acceptedQty) || 0,
                  rejected_qty: parseInt(rejectedQty) || 0,
                  distributed_qty: parseInt(distributedQty) || 0,
                  distribution_notes: distributionNotes,
                  distribution_date: new Date().toISOString().split('T')[0],
                })
              }
              disabled={actionLoading}
            >
              {actionLoading ? <span className="spinner" /> : 'Save & Mark Distributed'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Received Quantity</label>
              <input
                type="number"
                className="form-input"
                value={receivedQty}
                onChange={(e) => setReceivedQty(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Accepted Quantity</label>
              <input
                type="number"
                className="form-input"
                value={acceptedQty}
                onChange={(e) => setAcceptedQty(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rejected / Damaged Qty</label>
              <input
                type="number"
                className="form-input"
                value={rejectedQty}
                onChange={(e) => setRejectedQty(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Distributed Quantity</label>
              <input
                type="number"
                className="form-input"
                value={distributedQty}
                onChange={(e) => setDistributedQty(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Beneficiary & Distribution Notes</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Distributed to 15 families in Ward 4 settlement area..."
              value={distributionNotes}
              onChange={(e) => setDistributionNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
