'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function AdminOrganizationsPage() {
  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('pending');

  // Review Modal
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/organizations?status=${statusTab}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Fetch organizations error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleVerifyOrg = async (verificationStatus) => {
    if (!selectedOrg) return;
    setActionLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`/api/admin/organizations/${selectedOrg.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verification_status: verificationStatus,
          verification_notes: verificationNotes,
        }),
      });

      if (res.ok) {
        showSuccess(`Organization status set to ${verificationStatus}!`);
        setSelectedOrg(null);
        setVerificationNotes('');
        fetchOrganizations();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update organization status');
      }
    } catch {
      showError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="dashboard-content-header">
        <h1>NGO Verification & Compliance Queue (FR-ADM-01)</h1>
        <p>Review legal registration documents, conduct background checks, and grant verified status.</p>
      </div>

      {/* Tabs */}
      <div className="card mb-6 p-4">
        <div className="tabs" style={{ borderBottom: 'none' }}>
          {['pending', 'verified', 'rejected', 'suspended'].map((tab) => (
            <button
              key={tab}
              className={`tab ${statusTab === tab ? 'active' : ''}`}
              onClick={() => setStatusTab(tab)}
            >
              {tab === 'pending' ? 'Pending Review ⏳' : tab.replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : organizations.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="No Organizations Found"
          description={`There are currently no organizations in '${statusTab}' status.`}
        />
      ) : (
        <div className="grid grid-3 gap-6">
          {organizations.map((org) => (
            <div key={org.id} className="card flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={org.verification_status} type="org" />
                  <span className="text-xs text-tertiary capitalize">{org.org_type}</span>
                </div>

                <h3 className="text-lg font-bold text-primary-800">{org.org_name}</h3>
                <p className="text-xs text-secondary mt-1">📍 {org.address}, {org.city}</p>

                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs flex flex-col gap-1">
                  <div>Contact: <strong>{org.contact_person}</strong></div>
                  <div>Phone: <strong>{org.phone || 'N/A'}</strong></div>
                  <div>Email: <strong>{org.user_email}</strong></div>
                  <div>Reg No: <code>{org.registration_number || 'Not provided'}</code></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedOrg(org);
                    setVerificationNotes(org.verification_notes || '');
                  }}
                >
                  Review Documents & Verify →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedOrg && (
        <Modal
          isOpen={!!selectedOrg}
          onClose={() => setSelectedOrg(null)}
          title={`Review Verification: ${selectedOrg.org_name}`}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setSelectedOrg(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleVerifyOrg('rejected')}
                disabled={actionLoading}
              >
                Decline Verification
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleVerifyOrg('verified')}
                disabled={actionLoading}
              >
                {actionLoading ? <span className="spinner" /> : 'Approve & Verify NGO'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-xl flex flex-col gap-2">
              <div><strong>Registration No:</strong> {selectedOrg.registration_number || 'N/A'}</div>
              <div><strong>Type:</strong> {selectedOrg.org_type}</div>
              <div><strong>Official Address:</strong> {selectedOrg.address}, {selectedOrg.city}</div>
              <div><strong>Website:</strong> {selectedOrg.website ? <a href={selectedOrg.website} target="_blank" rel="noreferrer" className="text-primary-600">{selectedOrg.website}</a> : 'None'}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Verification Notes & Compliance Assessment</label>
              <textarea
                className="form-textarea"
                placeholder="Enter audit comments or rationale for approval/rejection..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
