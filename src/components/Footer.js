'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-dark)', color: 'white', padding: 'var(--space-16) 0 var(--space-8)' }}>
      <div className="container">
        <div className="grid grid-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              🎁 <span style={{ color: 'white' }}>DonateEase</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
              Connecting generous donors with verified NGOs to maximize item reuse, eliminate waste, and transform communities.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: 'var(--space-4)' }}>For Donors</h4>
            <ul style={{ listStyle: 'none', padding: 0 }} className="flex flex-col gap-2 text-sm">
              <li><Link href="/register?role=donor" style={{ color: 'var(--gray-300)' }}>Donate Items</Link></li>
              <li><Link href="/#how-it-works" style={{ color: 'var(--gray-300)' }}>How It Works</Link></li>
              <li><Link href="/#categories" style={{ color: 'var(--gray-300)' }}>Accepted Categories</Link></li>
              <li><Link href="/#ngos" style={{ color: 'var(--gray-300)' }}>Verified Partners</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: 'var(--space-4)' }}>For NGOs</h4>
            <ul style={{ listStyle: 'none', padding: 0 }} className="flex flex-col gap-2 text-sm">
              <li><Link href="/register?role=ngo" style={{ color: 'var(--gray-300)' }}>Register Organization</Link></li>
              <li><Link href="/login" style={{ color: 'var(--gray-300)' }}>NGO Portal</Link></li>
              <li><Link href="/#guidelines" style={{ color: 'var(--gray-300)' }}>Verification Process</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: 'var(--space-4)' }}>Platform</h4>
            <ul style={{ listStyle: 'none', padding: 0 }} className="flex flex-col gap-2 text-sm">
              <li><span style={{ color: 'var(--gray-400)' }}>📍 Serving 100+ Cities</span></li>
              <li><span style={{ color: 'var(--gray-400)' }}>🔒 Safe & Verified</span></li>
              <li><span style={{ color: 'var(--gray-400)' }}>⚡ Real-time Tracking</span></li>
            </ul>
          </div>
        </div>

        <div className="divider" style={{ background: 'var(--gray-800)', margin: 'var(--space-8) 0' }} />

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: 'var(--gray-400)' }}>
          <div>© {new Date().getFullYear()} DonateEase Platform. All rights reserved. IEEE 830 compliant SRS design.</div>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
