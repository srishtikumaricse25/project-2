'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showSuccess } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        showSuccess(`Welcome back, ${res.user.name}!`);
        if (res.user.role === 'admin') router.push('/dashboard/admin');
        else if (res.user.role === 'ngo') router.push('/dashboard/ngo');
        else router.push('/dashboard/donor');
      } else {
        setError(res.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="text-center mb-6">
          <Link href="/" className="navbar-brand justify-center mb-2" style={{ fontSize: '1.5rem' }}>
            🎁 <span>DonateEase</span>
          </Link>
          <h1 className="mt-2">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to manage your donations & impact</p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-lg text-sm bg-red-50 border border-red-200 text-error flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

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

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary-600 font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="divider" />

        <div className="text-center text-xs text-tertiary mb-4">
          Demo Accounts (password: <code>password123</code> / <code>admin123</code>):
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm text-xs justify-start"
            onClick={() => { setEmail('priya@example.com'); setPassword('password123'); }}
          >
            👤 Demo Donor: priya@example.com
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-xs justify-start"
            onClick={() => { setEmail('hope@example.com'); setPassword('password123'); }}
          >
            🏢 Demo NGO: hope@example.com
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-xs justify-start"
            onClick={() => { setEmail('admin@donateease.org'); setPassword('admin123'); }}
          >
            🛡️ Demo Admin: admin@donateease.org
          </button>
        </div>

        <div className="auth-footer mt-6">
          Don't have an account yet?{' '}
          <Link href="/register" className="font-semibold text-primary-600">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
