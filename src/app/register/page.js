'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'ngo' ? 'ngo' : 'donor';

  const [role, setRole] = useState(initialRole);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    pin_code: '',
    // NGO specific
    org_name: '',
    registration_number: '',
    contact_person: '',
    org_address: '',
    org_city: '',
    org_type: 'ngo',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { showSuccess } = useToast();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (role === 'ngo' && !formData.org_name.trim()) {
      setError('Organization name is required for NGO registration.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        name: trimmedName,
        email: trimmedEmail,
        role
      };
      const res = await register(payload);

      if (res.success) {
        showSuccess('Account created successfully!');
        if (role === 'ngo') {
          router.push('/dashboard/ngo');
        } else {
          router.push('/dashboard/donor');
        }
      } else {
        setError(res.error || 'Registration failed. Please check your inputs.');
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card animate-slide-up" style={{ maxWidth: '580px' }}>
      <div className="text-center mb-6">
        <Link href="/" className="navbar-brand justify-center mb-2" style={{ fontSize: '1.5rem' }}>
          🎁 <span>DonateEase</span>
        </Link>
        <h1 className="mt-2">Create Your Account</h1>
        <p className="auth-subtitle">Join the zero-waste donation movement</p>
      </div>

      {/* Role Selector */}
      <div className="role-selector">
        <div
          className={`role-card ${role === 'donor' ? 'selected' : ''}`}
          onClick={() => setRole('donor')}
        >
          <div className="role-card-icon">🎁</div>
          <h3>Individual Donor</h3>
          <p>I want to donate items to verified organizations</p>
        </div>

        <div
          className={`role-card ${role === 'ngo' ? 'selected' : ''}`}
          onClick={() => setRole('ngo')}
        >
          <div className="role-card-icon">🏢</div>
          <h3>NGO / Organization</h3>
          <p>We receive and distribute items to beneficiaries</p>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-lg text-sm bg-red-50 border border-red-200 text-error flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Priya Sharma"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password *</label>
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City *</label>
            <input
              type="text"
              name="city"
              className="form-input"
              placeholder="Mumbai"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">PIN Code *</label>
            <input
              type="text"
              name="pin_code"
              className="form-input"
              placeholder="400001"
              value={formData.pin_code}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* NGO Specific Fields */}
        {role === 'ngo' && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-primary-700">Organization Details</h4>

            <div className="form-group">
              <label className="form-label">Organization Name *</label>
              <input
                type="text"
                name="org_name"
                className="form-input"
                placeholder="Hope Foundation Trust"
                value={formData.org_name}
                onChange={handleChange}
                required={role === 'ngo'}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input
                  type="text"
                  name="registration_number"
                  className="form-input"
                  placeholder="NGO-MH-2022-XXXX"
                  value={formData.registration_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Organization Type</label>
                <select
                  name="org_type"
                  className="form-select"
                  value={formData.org_type}
                  onChange={handleChange}
                >
                  <option value="ngo">NGO / Non-Profit</option>
                  <option value="orphanage">Orphanage</option>
                  <option value="old_age_home">Old Age Home</option>
                  <option value="shelter">Shelter</option>
                  <option value="community_org">Community Trust</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Office Address</label>
              <input
                type="text"
                name="org_address"
                className="form-input"
                placeholder="45 Relief Road, Andheri West"
                value={formData.org_address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website (Optional)</label>
              <input
                type="url"
                name="website"
                className="form-input"
                placeholder="https://example.org"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
          {loading ? <span className="spinner" /> : `Register as ${role === 'ngo' ? 'NGO' : 'Donor'}`}
        </button>
      </form>

      <div className="auth-footer mt-6">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary-600">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="auth-page py-12">
      <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
