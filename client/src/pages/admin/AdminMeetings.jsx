import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  ClockIcon,
  VideoCameraIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/* ── helpers ── */
const formatTime12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const statusStyles = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  completed: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
};

const AdminMeetings = () => {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch bookings
  const { data, isLoading, isError } = useQuery(
    ['adminBookings', dateFilter, statusFilter, page],
    async () => {
      const params = new URLSearchParams({ page, limit });
      if (dateFilter) params.set('date', dateFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/meetings/admin/bookings?${params}`);
      return res.data;
    },
    { keepPreviousData: true }
  );

  // Cancel mutation
  const cancelMutation = useMutation((id) => api.patch(`/meetings/admin/bookings/${id}/cancel`), {
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries('adminBookings');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    },
  });

  const handleCancel = useCallback(
    (id, name) => {
      if (window.confirm(`Cancel the meeting with ${name}?`)) {
        cancelMutation.mutate(id);
      }
    },
    [cancelMutation]
  );

  const bookings = data?.bookings || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-500/10">
            <CalendarDaysIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting Bookings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data?.total ?? '—'} total bookings
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="input !py-2 !text-sm w-44"
              placeholder="Filter by date"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input !py-2 !text-sm w-40"
          >
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          {(dateFilter || statusFilter) && (
            <button
              onClick={() => {
                setDateFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
            Loading bookings...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-red-400 gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Failed to load bookings
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDaysIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No bookings found</p>
            <p className="text-xs mt-1">
              {dateFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'Bookings will appear here when clients schedule meetings'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Meet Link
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {bookings.map((b) => (
                    <tr
                      key={b._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">{b.clientName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{b.clientEmail}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900 dark:text-white">{formatDate(b.date)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime12(b.startTime)} – {formatTime12(b.endTime)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {b.meetLink ? (
                          <a
                            href={b.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline text-xs font-medium"
                          >
                            <VideoCameraIcon className="h-3.5 w-3.5" />
                            Join Meet
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[b.status] || ''}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(b._id, b.clientName)}
                            disabled={cancelMutation.isLoading}
                            className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
              {bookings.map((b) => (
                <div key={b._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        {b.clientName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <EnvelopeIcon className="h-3.5 w-3.5" />
                        {b.clientEmail}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[b.status] || ''}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                      {formatDate(b.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      {formatTime12(b.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {b.meetLink ? (
                      <a
                        href={b.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 text-xs font-medium"
                      >
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                        Join Meet
                      </a>
                    ) : (
                      <span />
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(b._id, b.clientName)}
                        disabled={cancelMutation.isLoading}
                        className="text-xs font-medium text-red-500 dark:text-red-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMeetings;
