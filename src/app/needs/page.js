'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NeedsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/donation-requests');
        if (res.ok) {
          const data = await res.json();
          // Optionally filter out completely fulfilled requests if you want to focus on active needs
          // For now we'll show all and sort by priority, maybe filter active only
          const activeRequests = (data.requests || []).filter(r => r.status !== 'fulfilled' && r.status !== 'cancelled' && r.status !== 'expired');
          setRequests(activeRequests);
        }
      } catch (error) {
        console.error('Failed to load donation requests:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return <span className="badge badge-error">🔥 Urgent Need</span>;
      case 'high': return <span className="badge badge-warning">⚡ High Priority</span>;
      case 'medium': return <span className="badge badge-info">Medium Priority</span>;
      default: return <span className="badge badge-success">Low Priority</span>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ paddingTop: 'var(--navbar-height)', flex: 1, backgroundColor: 'var(--bg-secondary)' }}>
        <section className="section">
          <div className="container">
            <div className="section-header text-center mb-12">
              <span className="section-label">Direct Community Need</span>
              <h2>Help Fulfill Urgent Requests</h2>
              <p className="mt-4 text-secondary max-w-2xl mx-auto">
                Verified NGOs in your community have posted specific needs for the people they support. 
                Browse active requests below and donate exactly what is needed right now.
              </p>
            </div>

            {loading ? (
              <div className="loading-center" style={{ minHeight: '400px' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : requests.length === 0 ? (
              <div className="card text-center p-12">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h3>No Active Requests</h3>
                <p className="text-secondary mt-2">All community needs have been fulfilled right now! Check back later.</p>
                <Link href="/register?role=donor" className="btn btn-outline mt-6">
                  Donate General Items
                </Link>
              </div>
            ) : (
              <div className="grid grid-3 gap-6">
                {requests.map((req) => {
                  const required = req.quantity_needed;
                  const received = req.quantity_fulfilled || 0;
                  const remaining = Math.max(0, required - received);
                  const progress = Math.min(100, (received / required) * 100);

                  return (
                    <div key={req.id} className="card flex flex-col hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <div className="font-semibold text-primary-800">{req.org_name || 'Community NGO'}</div>
                        {getPriorityBadge(req.priority)}
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-4">
                        <div>
                          <div className="text-2xl font-bold text-gray-900 mb-1">{req.item_type}</div>
                          {req.description && (
                            <p className="text-sm text-secondary line-clamp-2">{req.description}</p>
                          )}
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                          <div className="flex justify-between mb-2">
                            <span className="text-tertiary">Required: <strong>{required}</strong></span>
                            <span className="text-tertiary">Received: <strong className="text-emerald-600">{received}</strong></span>
                          </div>
                          <div className="flex justify-between font-medium text-gray-900 mb-2">
                            <span>Remaining Need:</span>
                            <span className="text-primary-700">{remaining} items</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill bg-primary-600" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <Link 
                          href={`/dashboard/donor/donations/new?category_id=${req.category_id || ''}&item_type=${encodeURIComponent(req.item_type)}&org_id=${req.organization_id}`}
                          className="btn btn-primary w-full text-center"
                        >
                          🎁 Donate Now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
