'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import DonationCard from '@/components/DonationCard';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';

export default function MyDonationsPage() {
  const { getToken } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/api/donations?limit=50';
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Fetch donations error:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const filteredDonations = donations.filter((d) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      d.donation_id?.toLowerCase().includes(term) ||
      d.item_type?.toLowerCase().includes(term) ||
      d.category_name?.toLowerCase().includes(term) ||
      d.org_name?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout allowedRoles={['donor']}>
      <div className="dashboard-content-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>My Donations</h1>
          <p>Track all your submitted, in-progress, and completed item donations.</p>
        </div>
        <Link href="/dashboard/donor/donations/new" className="btn btn-primary">
          🎁 Make New Donation
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card mb-6 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="tabs" style={{ borderBottom: 'none' }}>
          {['all', 'submitted', 'accepted', 'pickup_scheduled', 'received', 'distributed', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              className={`tab ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'all' ? 'All Donations' : tab.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        <div style={{ maxWidth: '300px', width: '100%' }}>
          <input
            type="text"
            className="form-input text-xs"
            placeholder="Search by ID, item name, NGO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner spinner-lg" />
        </div>
      ) : filteredDonations.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No donations found"
          description={
            search
              ? 'No donations matched your search criteria.'
              : 'You have no donations in this category.'
          }
          actionLabel="Make New Donation"
          actionHref="/dashboard/donor/donations/new"
        />
      ) : (
        <div className="grid grid-3 gap-6">
          {filteredDonations.map((donation) => (
            <DonationCard key={donation.id} donation={donation} userRole="donor" />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
