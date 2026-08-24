'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function AdminCategoriesPage() {
  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [prohibitedItems, setProhibitedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '', icon: '📦', item_types_str: '' });
  const [catSubmitting, setCatSubmitting] = useState(false);

  // New Prohibited Item Modal
  const [showProModal, setShowProModal] = useState(false);
  const [newPro, setNewPro] = useState({ name: '', description: '' });
  const [proSubmitting, setProSubmitting] = useState(false);

  const fetchCategoriesAndProhibited = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, proRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/prohibited-items'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (proRes.ok) {
        const proData = await proRes.json();
        setProhibitedItems(proData.items || []);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesAndProhibited();
  }, [fetchCategoriesAndProhibited]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    setCatSubmitting(true);

    try {
      const token = getToken();
      const itemTypesArray = newCat.item_types_str.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newCat,
          item_types: itemTypesArray,
        }),
      });

      if (res.ok) {
        showSuccess('Category created successfully!');
        setShowCatModal(false);
        setNewCat({ name: '', description: '', icon: '📦', item_types_str: '' });
        fetchCategoriesAndProhibited();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to create category');
      }
    } catch {
      showError('Network error');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleCreateProhibited = async (e) => {
    e.preventDefault();
    if (!newPro.name) return;
    setProSubmitting(true);

    try {
      const token = getToken();
      const res = await fetch('/api/prohibited-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPro),
      });

      if (res.ok) {
        showSuccess('Prohibited item rule added.');
        setShowProModal(false);
        setNewPro({ name: '', description: '' });
        fetchCategoriesAndProhibited();
      } else {
        showError('Failed to add prohibited rule.');
      }
    } catch {
      showError('Network error');
    } finally {
      setProSubmitting(false);
    }
  };

  const handleDeleteProhibited = async (id) => {
    try {
      const token = getToken();
      const res = await fetch('/api/prohibited-items', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        showSuccess('Prohibited rule removed.');
        fetchCategoriesAndProhibited();
      } else {
        showError('Failed to remove rule.');
      }
    } catch {
      showError('Network error');
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="dashboard-content-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Category & Item Rules Management (FR-ADM-03)</h1>
          <p>Manage accepted item categories, sub-item types, and prohibited item lists dynamically.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setShowProModal(true)}>
            🚫 Add Prohibited Item Rule
          </button>
          <button className="btn btn-primary" onClick={() => setShowCatModal(true)}>
            ➕ Create New Category
          </button>
        </div>
      </div>

      <div className="grid grid-3 gap-8">
        {/* Left Column: Categories Grid */}
        <div style={{ gridColumn: 'span 2' }}>
          <h3 className="mb-4">Active Categories ({categories.length})</h3>

          {loading ? (
            <div className="loading-center"><div className="spinner spinner-lg" /></div>
          ) : (
            <div className="grid grid-2 gap-4">
              {categories.map((c) => (
                <div key={c.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <h4 className="font-bold">{c.name}</h4>
                      <span className="text-xs text-tertiary">Slug: {c.slug}</span>
                    </div>
                  </div>
                  <p className="text-xs text-secondary mb-3">{c.description}</p>

                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-xs font-semibold text-primary-700 mb-1 display-block">Sub-Item Types:</span>
                    <div className="flex flex-wrap gap-1">
                      {c.item_types?.map((it) => (
                        <span key={it.id} className="badge badge-neutral text-xs">{it.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Prohibited Items */}
        <div>
          <h3 className="mb-4">Prohibited Items List</h3>
          <div className="card flex flex-col gap-3">
            {prohibitedItems.map((p) => (
              <div key={p.id} className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-start">
                <div>
                  <div className="font-semibold text-xs text-error">🚫 {p.name}</div>
                  <div className="text-xs text-secondary mt-1">{p.description}</div>
                </div>
                <button
                  className="text-xs text-tertiary hover:text-error border-none bg-none cursor-pointer"
                  onClick={() => handleDeleteProhibited(p.id)}
                  title="Remove Rule"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Category Modal */}
      <Modal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        title="Create New Item Category"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateCategory} disabled={catSubmitting}>
              {catSubmitting ? <span className="spinner" /> : 'Create Category'}
            </button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sports Equipment"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emoji Icon</label>
              <input
                type="text"
                className="form-input"
                placeholder="⚽"
                value={newCat.icon}
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Describe what items fit into this category..."
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Item Types (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Footballs, Cricket Bats, Badmintons, Helmets"
              value={newCat.item_types_str}
              onChange={(e) => setNewCat({ ...newCat, item_types_str: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* New Prohibited Modal */}
      <Modal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        title="Add Prohibited Item Rule"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowProModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateProhibited} disabled={proSubmitting}>
              {proSubmitting ? <span className="spinner" /> : 'Add Rule'}
            </button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Prohibited Item Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Perishable Fresh Food"
              value={newPro.name}
              onChange={(e) => setNewPro({ ...newPro, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Rationale</label>
            <textarea
              className="form-textarea"
              placeholder="Reason for prohibition (safety, hygiene, legal)..."
              value={newPro.description}
              onChange={(e) => setNewPro({ ...newPro, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
