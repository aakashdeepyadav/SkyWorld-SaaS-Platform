import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';

const ROLE_OPTIONS = ['client', 'developer', 'admin'];

const getRoleBadge = (role) => {
  const map = { admin: 'badge-danger', developer: 'badge-primary', client: 'badge-success' };
  return map[role] || 'badge-primary';
};

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    ['admin-users', search, roleFilter, page],
    async () => {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      return res.data;
    },
    { keepPreviousData: true, debounce: 300 }
  );

  const updateRoleMutation = useMutation(
    async ({ userId, role }) => api.put(`/users/${userId}/role`, { role }),
    {
      onSuccess: () => {
        toast.success('Role updated');
        queryClient.invalidateQueries('admin-users');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role'),
    }
  );

  const toggleStatusMutation = useMutation(
    async ({ userId, isActive }) => api.put(`/users/${userId}/status`, { isActive }),
    {
      onSuccess: () => {
        toast.success('Status updated');
        queryClient.invalidateQueries('admin-users');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
    }
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage platform users, roles, and access.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users by name or email..."
            className="input-field !pl-10 !py-2.5"
            maxLength={100}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="input-field !w-auto !py-2.5"
        >
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="card animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="w-9 h-9 bg-gray-100 dark:bg-surface-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 dark:bg-surface-700 rounded w-1/4" />
                <div className="h-3 bg-gray-50 dark:bg-surface-600 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.users?.length === 0 ? (
        <div className="card text-center py-16">
          <UsersIcon className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-surface-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                    Joined
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-surface-700">
                {data.users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => {
                          if (window.confirm(`Change ${u.name}'s role to "${e.target.value}"?`)) {
                            updateRoleMutation.mutate({ userId: u._id, role: e.target.value });
                          }
                        }}
                        className="text-xs font-medium border border-gray-200 dark:border-surface-600 rounded-lg px-2 py-1.5 bg-white dark:bg-surface-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none cursor-pointer"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(`${u.isActive ? 'Deactivate' : 'Activate'} ${u.name}?`)
                          ) {
                            toggleStatusMutation.mutate({ userId: u._id, isActive: !u.isActive });
                          }
                        }}
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          u.isActive !== false
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`${getRoleBadge(u.role)} capitalize`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
