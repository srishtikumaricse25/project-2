'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Call forgot-password API
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="text-center mb-6">
          <Link href="/" className="navbar-brand justify-center mb-2" style={{ fontSize: '1.5rem' }}>
            🎁 <span>DonateEase</span>
          </Link>
          <h1 className="mt-2">Reset Password</h1>
          <p className="auth-subtitle">Enter your registered email to receive reset instructions</p>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <h3>Check Your Email</h3>
            <p className="text-sm text-secondary mt-2 mb-6">
              If an account exists for <strong>{email}</strong>, password reset instructions have been sent.
            </p>
            <Link href="/login" className="btn btn-primary w-full">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer mt-6">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-primary-600">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
