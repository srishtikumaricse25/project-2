'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function NGOProfilePage() {
  const { user, getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [org, setOrg] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    org_name: '',
    registration_number: '',
    contact_person: '',
    phone: '',
    address: '',
    city: '',
    org_type: 'ngo',
    website: '',
    service_area_str: '',
    accepted_categories: [],
  });

  useEffect(() => {
    async function loadOrgData() {
      if (!user?.organization?.id) return;
      try {
        const token = getToken();
        const [orgRes, catRes] = await Promise.all([
          fetch(`/api/organizations/${user.organization.id}`),
          fetch('/api/categories'),
        ]);

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          const o = orgData.organization;
          setOrg(o);
          setFormData({
            org_name: o.org_name || '',
            registration_number: o.registration_number || '',
            contact_person: o.contact_person || '',
            phone: o.phone || '',
            address: o.address || '',
            city: o.city || '',
            org_type: o.org_type || 'ngo',
            website: o.website || '',
            service_area_str: Array.isArray(o.service_area) ? o.service_area.join(', ') : '',
            accepted_categories: Array.isArray(o.accepted_categories) ? o.accepted_categories : [],
          });
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
      } catch (err) {
        console.error('Error loading NGO profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrgData();
  }, [user, getToken]);

  const handleCategoryToggle = (catId) => {
    setFormData((prev) => {
      const exists = prev.accepted_categories.includes(catId);
      if (exists) {
        return { ...prev, accepted_categories: prev.accepted_categories.filter((id) => id !== catId) };
      } else {
        return { ...prev, accepted_categories: [...prev.accepted_categories, catId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!org?.id) return;
    setSaving(true);

    try {
      const token = getToken();
      const serviceAreaArray = formData.service_area_str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/organizations/${org.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          service_area: serviceAreaArray,
        }),
      });

      if (res.ok) {
        showSuccess('Organization profile updated successfully!');
      } else {
        showError('Failed to update profile.');
      }
    } catch {
      showError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['ngo']}>
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['ngo']}>
      <div className="dashboard-content-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Organization Profile</h1>
            <p>Maintain your official registration info, service area, and accepted donation categories.</p>
          </div>
          {org && <StatusBadge status={org.verification_status} type="org" />}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 container-narrow">
        <div className="card flex flex-col gap-4">
          <h3 className="text-lg">Basic Identification</h3>

          <div className="form-group">
            <label className="form-label">Organization Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.org_name}
              onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Registration Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Type</label>
              <select
                className="form-select"
                value={formData.org_type}
                onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
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
        </div>

        <div className="card flex flex-col gap-4">
          <h3 className="text-lg">Contact & Location</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input
                type="text"
                className="form-input"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Office Address</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="url"
                className="form-input"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Service Area (PIN codes separated by comma)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 400001, 400002, 400003"
              value={formData.service_area_str}
              onChange={(e) => setFormData({ ...formData, service_area_str: e.target.value })}
            />
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <h3 className="text-lg">Accepted Donation Categories</h3>
          <p className="text-xs text-secondary mb-2">Select the categories your organization has capacity to store and distribute:</p>

          <div className="grid grid-3 gap-3">
            {categories.map((c) => {
              const isSelected = formData.accepted_categories.includes(c.id);
              return (
                <div
                  key={c.id}
                  className={`p-3 border rounded-xl cursor-pointer flex items-center gap-2 ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                  onClick={() => handleCategoryToggle(c.id)}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-xs font-semibold">{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save Profile Updates'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
