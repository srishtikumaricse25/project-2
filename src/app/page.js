'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [publicStats, setPublicStats] = useState({
    totalItemsDonated: 0,
    verifiedNGOs: 0,
    totalDonations: 0,
    completedDonations: 0,
    totalDonors: 0,
    activeCities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, reqRes, statsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/donation-requests'),
          fetch('/api/public-stats'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setUrgentRequests(reqData.requests || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setPublicStats(statsData);
        }
      } catch (err) {
        console.error('Error loading landing page data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ paddingTop: 'var(--navbar-height)', flex: 1 }}>
        {/* Hero Section */}
        <section className="hero-gradient section" style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
          <div className="container">
            <div className="grid grid-2 items-center gap-12">
              <div>
                <span className="section-label">🌱 Zero-Waste Giving Platform</span>
                <h1 style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1.15, marginBottom: 'var(--space-6)' }}>
                  Give Your Unused Items a <span style={{ color: 'var(--primary-600)' }}>Second Life</span>.
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                  Connect directly with verified NGOs, orphanages, and community trusts. Enjoy doorstep pickup, full transparency, and real impact tracking.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/register?role=donor" className="btn btn-primary btn-lg">
                    🎁 Donate Items Now
                  </Link>
                  <Link href="/register?role=ngo" className="btn btn-secondary btn-lg">
                    🏢 Register as an NGO
                  </Link>
                </div>

                {/* Dynamic Real-Time Statistics from Database */}
                <div className="flex flex-wrap items-center gap-8 mt-12 pt-8" style={{ borderTop: '1px solid var(--gray-200)' }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                      {publicStats.totalItemsDonated > 0 ? `${publicStats.totalItemsDonated}+` : 'Active'}
                    </div>
                    <div className="text-xs text-tertiary">Items Reused</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-700)' }}>
                      {publicStats.verifiedNGOs > 0 ? publicStats.verifiedNGOs : 'Verified'}
                    </div>
                    <div className="text-xs text-tertiary">NGO Partners</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                      {publicStats.totalDonors > 0 ? publicStats.totalDonors : 'Growing'}
                    </div>
                    <div className="text-xs text-tertiary">Active Donors</div>
                  </div>
                </div>

                {/* Credibility & Transparency Badges */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <span className="badge badge-success text-xs">🌱 100% Transparent Giving</span>
                  <span className="badge badge-info text-xs">🛡️ Verified Non-Profits Only</span>
                  <span className="badge badge-warning text-xs">🚚 Doorstep Pickup</span>
                </div>
              </div>

              {/* Graphic Card */}
              <div className="card animate-fade-in" style={{ padding: 'var(--space-8)', background: 'white', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-xl)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 style={{ fontSize: '1.25rem' }}>Direct Community Need</h3>
                  <span className="badge badge-error animate-pulse">🔥 High Demand</span>
                </div>

                <div className="flex flex-col gap-4">
                  {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                  ) : urgentRequests.length === 0 ? (
                    <p className="text-xs text-tertiary">No active requests posted right now.</p>
                  ) : (
                    urgentRequests.slice(0, 3).map((req) => (
                      <div key={req.id} className="p-4" style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{req.org_name}</span>
                          <span className="text-xs badge badge-warning capitalize">{req.priority}</span>
                        </div>
                        <div className="text-xs text-secondary mb-2">{req.description}</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-primary-600">Needs: {req.quantity_needed} {req.item_type}</span>
                          <span className="text-tertiary">Progress: {req.quantity_fulfilled || 0}/{req.quantity_needed}</span>
                        </div>
                        <div className="progress-bar mt-2">
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(100, ((req.quantity_fulfilled || 0) / req.quantity_needed) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 text-center">
                  <Link href="/needs" className="btn btn-outline w-full">
                    View All NGO Needs & Donate
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="section" style={{ background: 'white' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-label">Simple & Transparent</span>
              <h2>How DonateEase Works</h2>
              <p>Three effortless steps to transform your surplus items into social good.</p>
            </div>

            <div className="grid grid-3 gap-8">
              <div className="card text-center p-8">
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📱</div>
                <h3>1. List Your Items</h3>
                <p className="mt-2 text-sm">
                  Snap a quick photo, select item condition, quantity, and pick a convenient pickup date & time slot.
                </p>
              </div>

              <div className="card text-center p-8">
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🤝</div>
                <h3>2. NGO Match & Pickup</h3>
                <p className="mt-2 text-sm">
                  Match with verified NGOs in your city. Our verified pickup partners collect items right from your doorstep.
                </p>
              </div>

              <div className="card text-center p-8">
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🌟</div>
                <h3>3. Track Your Impact</h3>
                <p className="mt-2 text-sm">
                  Receive status notifications from collection to distribution. See your impact score grow!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="section" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-label">What You Can Give</span>
              <h2>Accepted Item Categories</h2>
              <p>We accept a wide range of clean, usable household items and apparel.</p>
            </div>

            <div className="grid grid-4 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="category-card">
                  <div className="category-icon">{cat.icon}</div>
                  <h4>{cat.name}</h4>
                  <p>{cat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="section" style={{ background: 'linear-gradient(135deg, var(--primary-700), var(--primary-900))', color: 'white' }}>
          <div className="container text-center">
            <h2 style={{ color: 'white', fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>
              Ready to make a real difference today?
            </h2>
            <p style={{ color: 'var(--primary-100)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto var(--space-8)' }}>
              Join donors and NGOs building a cleaner, kinder world.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register?role=donor" className="btn btn-primary btn-lg" style={{ background: 'white', color: 'var(--primary-800)' }}>
                Start Donating Now
              </Link>
              <Link href="/login" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'white' }}>
                Sign In to Your Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
