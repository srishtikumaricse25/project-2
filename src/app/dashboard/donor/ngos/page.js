'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';

export default function BrowseNGOsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    async function fetchNGOs() {
      setLoading(true);
      try {
        let url = '/api/organizations?status=verified';
        if (cityFilter) url += `&city=${encodeURIComponent(cityFilter)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setOrganizations(data.organizations || []);
        }
      } catch (err) {
        console.error('Fetch NGOs error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNGOs();
  }, [cityFilter]);

  const filteredNGOs = organizations.filter((org) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      org.org_name?.toLowerCase().includes(term) ||
      org.city?.toLowerCase().includes(term) ||
      org.org_type?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout allowedRoles={['donor']}>
      <div className="dashboard-content-header">
        <h1>Verified NGO Partners</h1>
        <p>Explore verified charities, orphanages, and community trusts across cities.</p>
      </div>

      {/* Filter Bar */}
      <div className="card mb-6 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <input
            type="text"
            className="form-input text-xs"
            placeholder="Search by NGO name, type..."
            style={{ minWidth: '240px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-select text-xs"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Patna">Patna</option>
          </select>
        </div>

        <div className="text-xs text-tertiary">
          Showing <strong>{filteredNGOs.length}</strong> verified organizations
        </div>
      </div>

      {/* NGO Card Grid */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner spinner-lg" />
        </div>
      ) : filteredNGOs.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No Organizations Found"
          description="Try broadening your city or search filters."
        />
      ) : (
        <div className="grid grid-3 gap-6">
          {filteredNGOs.map((org) => (
            <div key={org.id} className="card flex flex-col justify-between p-6 hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-success text-xs font-semibold flex items-center gap-1">
                    ✓ Verified
                  </span>
                  <span className="text-xs text-tertiary capitalize font-mono">
                    ID: {org.registration_number || 'REG-PENDING'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  {org.org_name}
                </h3>
                
                <div className="text-xs text-secondary mt-1.5 flex items-center gap-1">
                  <span>📍</span>
                  <span>{org.address}, {org.city}</span>
                </div>

                <div className="text-[11px] text-tertiary mt-2">
                  👤 Contact: <strong>{org.contact_person}</strong> ({org.phone || org.email})
                </div>

                {org.website && (
                  <a
                    href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary-600 font-semibold mt-1 display-block"
                  >
                    🔗 Visit Website
                  </a>
                )}

                {/* Accepted Categories */}
                <div className="mt-3">
                  <div className="text-[10px] text-tertiary font-bold uppercase mb-1">Target Categories</div>
                  <div className="flex flex-wrap gap-1">
                    {org.accepted_categories && org.accepted_categories.length > 0 ? (
                      org.accepted_categories.map((cat, i) => (
                        <span key={i} className="badge badge-info text-[9px] px-1.5 py-0.5">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-tertiary">All clean household items</span>
                    )}
                  </div>
                </div>

                {/* Verification Date & Donations Count */}
                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-2 gap-2 text-center text-xs">
                  <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="text-[10px] text-tertiary uppercase">Received</div>
                    <div className="font-bold text-gray-800 mt-0.5">📦 {org.total_donations_received || 0} donations</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="text-[10px] text-tertiary uppercase">Verified On</div>
                    <div className="font-bold text-gray-800 mt-0.5">
                      {org.verified_at ? new Date(org.verified_at).toLocaleDateString('en-US', {
                        month: 'short', year: 'numeric'
                      }) : 'June 2026'}
                    </div>
                  </div>
                </div>

                {/* Current Urgent Needs */}
                {org.active_needs && org.active_needs.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[10px] text-red-600 font-bold uppercase mb-1.5 flex items-center gap-1">
                      <span>🔥</span> Urgent Needs
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {org.active_needs.map((need, index) => (
                        <div key={index} className="bg-red-50/50 border border-red-100 p-2 rounded text-[11px]">
                          <div className="flex justify-between font-semibold text-red-950">
                            <span>{need.item_type}</span>
                            <span className="text-[9px] uppercase font-bold text-red-700">{need.priority}</span>
                          </div>
                          <div className="text-tertiary mt-0.5">
                            Progress: {need.quantity_fulfilled || 0} / {need.quantity_needed} items
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  href={`/dashboard/donor/donations/new?org_id=${org.id}`}
                  className="btn btn-primary btn-sm w-full text-center"
                >
                  🎁 Donate to NGO
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
