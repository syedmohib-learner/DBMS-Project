import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserCog, Plus, ShieldCheck, User, X, Check, Lock } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role_id: 2, // Cashier by default
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', formData);
      alert('User account created successfully!');
      setModalOpen(false);
      setFormData({ name: '', username: '', password: '', role_id: 2 });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user account.');
    }
  };

  const handleToggleActive = async (user) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;

    try {
      await api.put(`/auth/users/${user.user_id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Accounts & Roles</h1>
          <p className="text-sm text-gray-500">Manage cashier and owner logins with role-based permissions</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Staff Account</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
            <tr>
              <th className="py-3 px-4">Staff Name</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    {u.role === 'owner' ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <User className="w-4 h-4 text-sky-600" />}
                  </div>
                  <span>{u.name}</span>
                </td>
                <td className="py-3 px-4 font-mono">{u.username}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      u.role === 'owner'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                      u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      u.is_active
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Create Staff Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Khan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Username (Login ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cashier2"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Assigned Role *</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value={2}>Cashier (Billing, receipts, payments)</option>
                  <option value={1}>Owner (Full access, profits, purchases, users)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
