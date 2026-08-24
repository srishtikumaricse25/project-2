'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import DonationCard from '@/components/DonationCard';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';

export default function DonorDashboard() {
  const { user, getToken } = useAuth();
  const [donations, setDonations] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const token = getToken();
        const [donRes, reqRes] = await Promise.all([
          fetch('/api/donations?limit=6', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/donation-requests?status=active'),
        ]);

        if (donRes.ok) {
          const donData = await donRes.json();
          setDonations(donData.donations || []);
        }

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setUrgentRequests(reqData.requests || []);
        }
      } catch (err) {
        console.error('Failed to load donor dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [getToken]);

  const activeDonations = donations.filter(
    (d) => !['completed', 'cancelled', 'rejected', 'expired'].includes(d.status)
  );

  return (
    <DashboardLayout allowedRoles={['donor']}>
      <div className="dashboard-content-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Here's an overview of your donation activity and real-world impact.</p>
        </div>
        <Link href="/dashboard/donor/donations/new" className="btn btn-primary btn-lg">
          🎁 Make New Donation
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4 gap-6 mb-6">
        <StatsCard
          icon="📦"
          value={donations.length}
          label="Total Donations"
          color="green"
        />
        <StatsCard
          icon="✅"
          value={donations.filter(d => d.status === 'completed').length}
          label="Completed & Delivered"
          color="teal"
        />
        <StatsCard
          icon="⏳"
          value={activeDonations.length}
          label="In Progress"
          color="blue"
        />
        <StatsCard
          icon="🌟"
          value={(() => {
            // Calculate Karma points dynamically based on rule:
            // clothing/wear/footwear = 5 pts/item
            // book/stationery = 3 pts/item
            // household/kitchen/furniture/electronics = 10 pts/item
            // completed donation = +20 pts
            // repeat donation = +10 pts (every donation after the first)
            let score = 0;
            const completedCount = donations.filter(d => d.status === 'completed').length;
            
            donations.forEach(d => {
              const qty = Number(d.quantity) || 1;
              const cat = (d.category_slug || '').toLowerCase();
              if (['clothing', 'winter-wear', 'childrens-clothing', 'footwear'].some(c => cat.includes(c))) {
                score += qty * 5;
              } else if (['books-stationery', 'toys-games'].some(c => cat.includes(c))) {
                score += qty * 3;
              } else {
                score += qty * 10;
              }
            });

            score += completedCount * 20;
            if (donations.length > 1) {
              score += (donations.length - 1) * 10;
            }
            return score;
          })()}
          label="Impact Karma Score"
          color="orange"
        />
      </div>

      {/* Your Impact Details Section */}
      <div className="card p-6 mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
        <h3 className="mb-4 text-orange-950 font-bold flex items-center gap-2">
          <span>🌱</span> Your Real-World Impact Breakdown
        </h3>
        <div className="grid grid-5 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {(() => {
                let score = 0;
                const completedCount = donations.filter(d => d.status === 'completed').length;
                donations.forEach(d => {
                  const qty = Number(d.quantity) || 1;
                  const cat = (d.category_slug || '').toLowerCase();
                  if (['clothing', 'winter-wear', 'childrens-clothing', 'footwear'].some(c => cat.includes(c))) {
                    score += qty * 5;
                  } else if (['books-stationery', 'toys-games'].some(c => cat.includes(c))) {
                    score += qty * 3;
                  } else {
                    score += qty * 10;
                  }
                });
                score += completedCount * 20;
                if (donations.length > 1) {
                  score += (donations.length - 1) * 10;
                }
                return score;
              })()} Karma
            </div>
            <div className="text-[11px] text-tertiary font-medium mt-1">Earned Score</div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 text-center">
            <div className="text-2xl font-bold text-orange-700">
              👕 {donations
                .filter(d => ['clothing', 'winter-wear', 'childrens-clothing'].some(c => (d.category_slug || '').includes(c)))
                .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)}
            </div>
            <div className="text-[11px] text-tertiary font-medium mt-1">Clothes</div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 text-center">
            <div className="text-2xl font-bold text-orange-700">
              📚 {donations
                .filter(d => (d.category_slug || '').includes('books-stationery'))
                .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)}
            </div>
            <div className="text-[11px] text-tertiary font-medium mt-1">Books</div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 text-center">
            <div className="text-2xl font-bold text-orange-700">
              🏠 {donations
                .filter(d => !['clothing', 'winter-wear', 'childrens-clothing', 'books-stationery'].some(c => (d.category_slug || '').includes(c)))
                .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)}
            </div>
            <div className="text-[11px] text-tertiary font-medium mt-1">Household Items</div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 text-center">
            <div className="text-2xl font-bold text-orange-700">
              🌱 {donations.reduce((sum, d) => {
                // Estimate weight: clothes = 0.3kg/item, books = 0.5kg/item, other = 2kg/item
                const qty = Number(d.quantity) || 0;
                const cat = (d.category_slug || '').toLowerCase();
                if (['clothing', 'winter-wear', 'childrens-clothing'].some(c => cat.includes(c))) {
                  return sum + (qty * 0.3);
                } else if (cat.includes('books-stationery')) {
                  return sum + (qty * 0.5);
                } else {
                  return sum + (qty * 2.0);
                }
              }, 0).toFixed(1)} kg
            </div>
            <div className="text-[11px] text-tertiary font-medium mt-1">Est. Reused Weight</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-3 gap-8">
        {/* Left Column: Recent Donations */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.25rem' }}>Your Recent Donations</h3>
            <Link href="/dashboard/donor/donations" className="text-sm font-semibold text-primary-600">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : donations.length === 0 ? (
            <EmptyState
              icon="🎁"
              title="You haven't made your first donation yet"
              description="Start your journey by giving your pre-loved items a second life."
              actionLabel="🎁 Donate Your First Item"
              actionHref="/dashboard/donor/donations/new"
            />
          ) : (
            <div className="grid grid-2 gap-4">
              {donations.map((donation) => (
                <DonationCard key={donation.id} donation={donation} userRole="donor" />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: NGO Urgent Needs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.25rem' }}>NGO Urgent Needs</h3>
            <Link href="/dashboard/donor/ngos" className="text-xs text-primary-600 font-semibold">
              Browse NGOs
            </Link>
          </div>

          <div className="card flex flex-col gap-4">
            {urgentRequests.length === 0 ? (
              <EmptyState
                icon="📣"
                title="No urgent needs in your selected city right now"
                description="NGOs haven't published any requests. Try browsing NGOs in other locations."
                actionLabel="Browse All NGOs"
                actionHref="/dashboard/donor/ngos"
              />
            ) : (
              urgentRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-primary-800">{req.org_name}</span>
                    <span className="badge badge-warning text-xs capitalize">{req.priority}</span>
                  </div>
                  <div className="text-xs font-medium text-primary-600 mt-1">
                    Needed: {req.quantity_needed} {req.item_type}
                  </div>
                  {req.description && (
                    <div className="text-xs text-tertiary mt-1 truncate">{req.description}</div>
                  )}
                  <Link
                    href={`/dashboard/donor/donations/new?category_id=${req.category_id}&item_type=${encodeURIComponent(req.item_type)}&org_id=${req.organization_id}`}
                    className="btn btn-outline btn-sm w-full mt-2 text-xs"
                  >
                    Fulfill This Need
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
