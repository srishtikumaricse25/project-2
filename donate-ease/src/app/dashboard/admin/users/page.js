'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/api/admin/users?limit=50';
      if (roleFilter) url += `&role=${roleFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: userId,
          is_active: currentActive ? 0 : 1,
        }),
      });

      if (res.ok) {
        showSuccess(currentActive ? 'User account suspended.' : 'User account reactivated.');
        fetchUsers();
      } else {
        showError('Failed to update user status.');
      }
    } catch {
      showError('Network error');
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="dashboard-content-header">
        <h1>User Management & Moderation (FR-ADM-02)</h1>
        <p>View registered donors, NGOs, and admins. Suspend or reactivate user accounts.</p>
      </div>

      {/* Filter Bar */}
      <div className="card mb-6 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <input
            type="text"
            className="form-input text-xs"
            placeholder="Search by name, email, city..."
            style={{ minWidth: '240px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-select text-xs"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="donor">Donors</option>
            <option value="ngo">NGOs</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="text-xs text-tertiary">
          Total user accounts: <strong>{users.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No Users Found" description="Try clearing search filters." />
      ) : (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name & Email</th>
                <th>Role</th>
                <th>City</th>
                <th>Verified</th>
                <th>Donation Count</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold text-xs">#{u.id}</td>
                  <td>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-tertiary">{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'ngo' ? 'badge-info' : 'badge-neutral'} capitalize`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-xs">{u.city || 'N/A'}</td>
                  <td>
                    {u.is_verified ? (
                      <span className="badge badge-success text-xs">Verified</span>
                    ) : (
                      <span className="badge badge-neutral text-xs">Unverified</span>
                    )}
                  </td>
                  <td className="font-bold text-center">{u.donation_count || 0}</td>
                  <td>
                    {u.is_active ? (
                      <span className="badge badge-success text-xs">Active</span>
                    ) : (
                      <span className="badge badge-error text-xs">Suspended</span>
                    )}
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                      >
                        {u.is_active ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
