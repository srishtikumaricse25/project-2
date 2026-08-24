'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function NGODashboard() {
  const { user, getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('pending'); // 'pending', 'scheduled', 'received', 'all'

  const orgStatus = user?.organization?.verification_status || 'pending';

  const loadNGOData = useCallback(async () => {
    try {
      const token = getToken();
      const [donRes, reqRes] = await Promise.all([
        fetch('/api/donations?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/donation-requests'),
      ]);

      if (donRes.ok) {
        const donData = await donRes.json();
        setDonations(donData.donations || []);
      }
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
    } catch (err) {
      console.error('Failed to load NGO dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadNGOData();
  }, [loadNGOData]);

  const handleQuickAction = async (donationId, status) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/donations/${donationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showSuccess(`Donation status updated to: ${status.replace(/_/g, ' ').toUpperCase()}`);
        loadNGOData();
      } else {
        showError('Failed to update status.');
      }
    } catch {
      showError('Network error');
    }
  };

  const pendingDonations = donations.filter((d) => ['submitted', 'pending_acceptance'].includes(d.status));
  const scheduledDonations = donations.filter((d) => ['accepted', 'pickup_scheduled', 'picked_up'].includes(d.status));
  const receivedDonations = donations.filter((d) => ['received', 'distributed', 'completed'].includes(d.status));

  let displayedDonations = donations;
  if (filterTab === 'pending') displayedDonations = pendingDonations;
  if (filterTab === 'scheduled') displayedDonations = scheduledDonations;
  if (filterTab === 'received') displayedDonations = receivedDonations;

  return (
    <DashboardLayout allowedRoles={['ngo']}>
      {/* Verification Status Banner */}
      <div className={`verification-banner ${orgStatus}`}>
        {orgStatus === 'verified' && (
          <>✅ <span><strong>Verified Organization:</strong> Your NGO is verified & active to accept item donations.</span></>
        )}
        {orgStatus === 'pending' && (
          <>⏳ <span><strong>Verification Pending:</strong> Your legal documents are currently under admin review.</span></>
        )}
        {orgStatus === 'rejected' && (
          <>❌ <span><strong>Verification Declined:</strong> Contact support to re-verify registration documents.</span></>
        )}
      </div>

      <div className="dashboard-content-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>{user?.organization?.org_name || user?.name} — Portal Control</h1>
          <p>Review new donation offers, accept requests, schedule doorstep collection, & record beneficiary distributions.</p>
        </div>
        <Link href="/dashboard/ngo/requests" className="btn btn-primary btn-lg">
          📣 Post Beneficiary Item Demand
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4 gap-6 mb-8">
        <StatsCard icon="📥" value={pendingDonations.length} label="New Donation Requests" color="orange" />
        <StatsCard icon="📅" value={scheduledDonations.length} label="Pickup Scheduled" color="blue" />
        <StatsCard icon="🏢" value={receivedDonations.length} label="Received & Distributed" color="green" />
        <StatsCard icon="📣" value={requests.length} label="Beneficiary Demand Posts" color="teal" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-3 gap-8">
        {/* Left Column: Incoming Donations */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
            <h3 style={{ fontSize: '1.15rem' }}>Donation Requests & Operations</h3>
            <div className="tabs" style={{ borderBottom: 'none', margin: 0 }}>
              <button
                className={`tab ${filterTab === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterTab('pending')}
              >
                New Requests ({pendingDonations.length})
              </button>
              <button
                className={`tab ${filterTab === 'scheduled' ? 'active' : ''}`}
                onClick={() => setFilterTab('scheduled')}
              >
                Pickup Scheduled ({scheduledDonations.length})
              </button>
              <button
                className={`tab ${filterTab === 'received' ? 'active' : ''}`}
                onClick={() => setFilterTab('received')}
              >
                Received ({receivedDonations.length})
              </button>
              <button
                className={`tab ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All ({donations.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner spinner-lg" /></div>
          ) : displayedDonations.length === 0 ? (
            <EmptyState
              icon="📥"
              title="No Donations in this View"
              description="New item offers and collection tasks assigned to your organization will appear here."
            />
          ) : (
            <div className="table-container bg-white">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Donor</th>
                    <th>Item & Qty</th>
                    <th>Pickup Date / City</th>
                    <th>Status</th>
                    <th>Live Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDonations.map((d) => (
                    <tr key={d.id}>
                      <td className="font-semibold text-xs">{d.donation_id}</td>
                      <td>
                        <div className="font-medium text-xs">{d.donor_name || 'Donor'}</div>
                        <div className="text-xs text-tertiary">{d.donor_phone}</div>
                      </td>
                      <td>
                        <div className="font-medium text-xs">{d.quantity} × {d.item_type}</div>
                        <div className="text-xs text-tertiary capitalize">Condition: {d.condition}</div>
                      </td>
                      <td className="text-xs">
                        <div>📅 {d.pickup_date}</div>
                        <div className="text-tertiary">📍 {d.pickup_city}</div>
                      </td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {['submitted', 'pending_acceptance'].includes(d.status) && (
                            <>
                              <button
                                className="btn btn-success btn-sm text-xs"
                                onClick={() => handleQuickAction(d.id, 'accepted')}
                              >
                                Accept
                              </button>
                              <button
                                className="btn btn-danger btn-sm text-xs"
                                onClick={() => handleQuickAction(d.id, 'rejected')}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {d.status === 'accepted' && (
                            <button
                              className="btn btn-primary btn-sm text-xs"
                              onClick={() => handleQuickAction(d.id, 'pickup_scheduled')}
                            >
                              Schedule Pickup
                            </button>
                          )}
                          {d.status === 'pickup_scheduled' && (
                            <button
                              className="btn btn-primary btn-sm text-xs"
                              onClick={() => handleQuickAction(d.id, 'picked_up')}
                            >
                              Mark Picked Up
                            </button>
                          )}
                          {d.status === 'picked_up' && (
                            <button
                              className="btn btn-primary btn-sm text-xs"
                              onClick={() => handleQuickAction(d.id, 'received')}
                            >
                              Mark Received
                            </button>
                          )}
                          {['received', 'sorted'].includes(d.status) && (
                            <Link href={`/dashboard/ngo/donations/${d.id}`} className="btn btn-success btn-sm text-xs">
                              Distribute →
                            </Link>
                          )}
                          {d.status === 'distributed' && (
                            <button
                              className="btn btn-success btn-sm text-xs"
                              onClick={() => handleQuickAction(d.id, 'completed')}
                            >
                              Complete 🌟
                            </button>
                          )}
                          <Link href={`/dashboard/ngo/donations/${d.id}`} className="btn btn-ghost btn-sm text-xs">
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Published Beneficiary Needs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.15rem' }}>Beneficiary Needs</h3>
            <Link href="/dashboard/ngo/requests" className="text-xs text-primary-600 font-semibold">
              Manage All
            </Link>
          </div>

          <div className="card flex flex-col gap-4">
            {requests.length === 0 ? (
              <p className="text-xs text-tertiary">No beneficiary demand posts active.</p>
            ) : (
              requests.slice(0, 4).map((req) => (
                <div key={req.id} className="p-3 bg-gray-50 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-primary-800">{req.item_type}</span>
                    <span className="badge badge-warning text-xs capitalize">{req.priority}</span>
                  </div>
                  <div className="text-tertiary mb-2">Needed: {req.quantity_needed} items</div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, ((req.quantity_fulfilled || 0) / req.quantity_needed) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}

            <Link href="/dashboard/ngo/requests" className="btn btn-outline btn-sm w-full text-center">
              ➕ Post New Need
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
