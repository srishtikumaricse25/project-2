'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function NGOIncomingDonationsPage() {
  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/api/donations?limit=50';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Fetch NGO donations error:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const updateStatus = async (id, status) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/donations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showSuccess(`Status updated to ${status.replace(/_/g, ' ')}`);
        fetchDonations();
      } else {
        showError('Failed to update status');
      }
    } catch {
      showError('Network error');
    }
  };

  const filtered = donations.filter((d) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      d.donation_id?.toLowerCase().includes(term) ||
      d.donor_name?.toLowerCase().includes(term) ||
      d.item_type?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout allowedRoles={['ngo']}>
      <div className="dashboard-content-header">
        <h1>Incoming Donations Management</h1>
        <p>Review, accept, schedule, and track distribution of donated items.</p>
      </div>

      {/* Tabs & Filter */}
      <div className="card mb-6 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="tabs" style={{ borderBottom: 'none' }}>
          {['all', 'submitted', 'accepted', 'pickup_scheduled', 'picked_up', 'received', 'distributed', 'completed'].map((st) => (
            <button
              key={st}
              className={`tab ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'all' ? 'All' : st.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        <div style={{ maxWidth: '280px', width: '100%' }}>
          <input
            type="text"
            className="form-input text-xs"
            placeholder="Search by ID, donor name, item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📥"
          title="No Donations Found"
          description="No items match your filter criteria."
        />
      ) : (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>Donor Details</th>
                <th>Item & Qty</th>
                <th>Pickup Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
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
                    <div>📍 {d.pickup_city} ({d.pickup_pin_code})</div>
                    <div className="text-tertiary">📅 {d.pickup_date}</div>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      {['submitted', 'pending_acceptance'].includes(d.status) && (
                        <button className="btn btn-success btn-sm text-xs" onClick={() => updateStatus(d.id, 'accepted')}>
                          Accept
                        </button>
                      )}
                      {d.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm text-xs" onClick={() => updateStatus(d.id, 'pickup_scheduled')}>
                          Schedule Pickup
                        </button>
                      )}
                      {d.status === 'pickup_scheduled' && (
                        <button className="btn btn-primary btn-sm text-xs" onClick={() => updateStatus(d.id, 'picked_up')}>
                          Mark Picked Up
                        </button>
                      )}
                      {d.status === 'picked_up' && (
                        <button className="btn btn-primary btn-sm text-xs" onClick={() => updateStatus(d.id, 'received')}>
                          Mark Received
                        </button>
                      )}
                      {d.status === 'received' && (
                        <button className="btn btn-success btn-sm text-xs" onClick={() => updateStatus(d.id, 'distributed')}>
                          Mark Distributed
                        </button>
                      )}
                      {d.status === 'distributed' && (
                        <button className="btn btn-success btn-sm text-xs" onClick={() => updateStatus(d.id, 'completed')}>
                          Complete
                        </button>
                      )}
                      <Link href={`/dashboard/ngo/donations/${d.id}`} className="btn btn-ghost btn-sm text-xs">
                        Details →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
