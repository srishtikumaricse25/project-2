'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function NGORequestsPage() {
  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReq, setNewReq] = useState({
    category_id: '',
    item_type: '',
    quantity_needed: 10,
    priority: 'medium',
    required_before: '',
    description: '',
    beneficiary_category: 'families',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequestsAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, catRes] = await Promise.all([
        fetch('/api/donation-requests'),
        fetch('/api/categories'),
      ]);

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequestsAndCategories();
  }, [fetchRequestsAndCategories]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newReq.item_type || !newReq.quantity_needed) {
      showError('Item type and quantity needed are required');
      return;
    }
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch('/api/donation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReq),
      });

      if (res.ok) {
        showSuccess('New demand request posted to platform!');
        setShowCreateModal(false);
        setNewReq({
          category_id: '',
          item_type: '',
          quantity_needed: 10,
          priority: 'medium',
          required_before: '',
          description: '',
          beneficiary_category: 'families',
        });
        fetchRequestsAndCategories();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to post demand request');
      }
    } catch {
      showError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['ngo']}>
      <div className="dashboard-content-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Publish Item Requirements (FR-NGO-05)</h1>
          <p>Post urgent or ongoing item needs for donors across the platform to see and fulfill.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Post New Need / Request
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon="📣"
          title="No Needs Posted"
          description="Publish your organization's item needs so donors can match with you directly."
          actionLabel="Post New Need"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-3 gap-6">
          {requests.map((req) => (
            <div key={req.id} className="card flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={req.priority} type="priority" />
                  <span className="text-xs text-tertiary">Target: {req.required_before || 'Ongoing'}</span>
                </div>

                <h3 className="text-lg font-bold mt-2">{req.item_type}</h3>
                <p className="text-xs text-secondary mt-1">{req.description || 'No description provided.'}</p>

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-tertiary">Fulfillment Progress</span>
                    <span className="font-semibold text-primary-700">
                      {req.quantity_fulfilled || 0} / {req.quantity_needed} items
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, ((req.quantity_fulfilled || 0) / req.quantity_needed) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-tertiary flex justify-between items-center">
                <span>Beneficiaries: <strong className="capitalize">{req.beneficiary_category || 'General'}</strong></span>
                <span className="badge badge-neutral capitalize">{req.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Post New NGO Item Demand"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateRequest} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Publish Demand'}
            </button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newReq.category_id}
                onChange={(e) => setNewReq({ ...newReq, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Specific Item Type *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Winter Jackets, Textbooks"
                value={newReq.item_type}
                onChange={(e) => setNewReq({ ...newReq, item_type: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity Needed *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={newReq.quantity_needed}
                onChange={(e) => setNewReq({ ...newReq, quantity_needed: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={newReq.priority}
                onChange={(e) => setNewReq({ ...newReq, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Required Before Date</label>
              <input
                type="date"
                className="form-input"
                value={newReq.required_before}
                onChange={(e) => setNewReq({ ...newReq, required_before: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Beneficiary Category</label>
              <select
                className="form-select"
                value={newReq.beneficiary_category}
                onChange={(e) => setNewReq({ ...newReq, beneficiary_category: e.target.value })}
              >
                <option value="children">Children / Students</option>
                <option value="families">Families in Need</option>
                <option value="elderly">Elderly Persons</option>
                <option value="disaster_victims">Disaster Relief</option>
                <option value="general">General Community</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description & Urgency Reason</label>
            <textarea
              className="form-textarea"
              placeholder="Explain why this demand is needed and how items will be distributed..."
              value={newReq.description}
              onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
