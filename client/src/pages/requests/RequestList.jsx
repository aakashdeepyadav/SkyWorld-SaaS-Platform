import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const getStatusBadge = (status) => {
  const map = {
    pending: 'badge-warning',
    approved: 'badge-primary',
    'in-progress': 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-danger',
  };
  return map[status] || 'badge-primary';
};

const RequestList = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    ['requests', statusFilter, page],
    async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/requests?${params}`);
      return res.data;
    },
    { keepPreviousData: true }
  );

  const isClient = user?.role === 'client';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isClient
              ? 'Requests created for your account.'
              : 'Manage and review service requests.'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/requests/new" className="btn-primary inline-flex items-center self-start">
            <PlusIcon className="w-4 h-4 mr-1.5" /> New Request
          </Link>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              statusFilter === tab.key
                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-surface-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-surface-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-50 dark:bg-surface-600 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : data?.requests?.length === 0 ? (
        <div className="card text-center py-16">
          <ClockIcon className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No requests found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {isClient ? 'No service requests on your account yet.' : 'No matching requests.'}
          </p>
          {user?.role === 'admin' && (
            <Link to="/requests/new" className="btn-primary inline-block mt-4">
              <PlusIcon className="w-4 h-4 mr-1 inline" /> Create Request
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {data.requests.map((req) => (
            <Link
              key={req._id}
              to={`/requests/${req._id}`}
              className="card flex items-center justify-between hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                    {req.title}
                  </h3>
                  <span className={`${getStatusBadge(req.status)} capitalize flex-shrink-0`}>
                    {req.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                  <span>{req.serviceId?.name || 'Service'}</span>
                  <span>•</span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  {req.assignedDeveloperId && (
                    <>
                      <span>•</span>
                      <span>Dev: {req.assignedDeveloperId.name}</span>
                    </>
                  )}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 flex-shrink-0 ml-4 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
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

export default RequestList;
