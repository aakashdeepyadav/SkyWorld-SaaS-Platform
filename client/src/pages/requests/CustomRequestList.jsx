import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'approved', label: 'Approved' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SERVICE_LABELS = {
  'web-development': 'Web Development',
  'app-development': 'App Development',
  'branding-creative': 'Branding',
};

const getStatusBadge = (status) => {
  const map = {
    pending: 'badge-warning',
    quoted: 'badge-primary',
    approved: 'badge-success',
    cancelled: 'badge-danger',
  };
  return map[status] || 'badge-primary';
};

const CustomRequestList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [status, setStatus] = useState('quoted');
  const [payingId, setPayingId] = useState(null);

  const { data, isLoading } = useQuery(
    ['custom-requests', statusFilter, page],
    async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/custom-requests?${params}`);
      return res.data;
    },
    { keepPreviousData: true }
  );

  const updateMutation = useMutation(
    async () => {
      const payload = {};
      const normalizedQuote = quotedPrice?.trim();

      if (normalizedQuote) payload.quotedPrice = Number(normalizedQuote);
      if (status) payload.status = status;

      const hasExistingQuote = Number(selected?.quotedPrice) > 0;
      const hasNewQuote = Number(payload.quotedPrice) > 0;
      if (payload.status === 'quoted' && !hasNewQuote && !hasExistingQuote) {
        throw new Error('Enter an approved amount before marking as quoted');
      }

      if (payload.quotedPrice !== undefined && payload.status === 'pending') {
        payload.status = 'quoted';
      }

      return api.put(`/custom-requests/${selected._id}`, payload);
    },
    {
      onSuccess: () => {
        toast.success('Request updated');
        queryClient.invalidateQueries(['custom-requests']);
        setIsModalOpen(false);
        setSelected(null);
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update request'),
    }
  );

  const openModal = (request) => {
    setSelected(request);
    setQuotedPrice(request.quotedPrice ? String(request.quotedPrice) : '');
    setStatus(request.status === 'pending' ? 'quoted' : request.status || 'quoted');
    setIsModalOpen(true);
  };

  const handlePay = async (request) => {
    if (!window.Razorpay) {
      toast.error('Payment service not available');
      return;
    }
    setPayingId(request._id);
    try {
      const { data: orderData } = await api.post('/payments/razorpay/order', {
        customRequestId: request._id,
      });
      const { order, keyId, payment } = orderData;
      const phone = typeof user?.phone === 'string' ? user.phone.trim() : '';
      const prefill = {
        name: user?.name || '',
        email: user?.email || '',
        ...(phone ? { contact: phone } : {}),
      };

      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkyWorld Ventures',
        description: 'Custom project payment',
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              paymentId: payment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful');
            queryClient.invalidateQueries(['custom-requests']);
            queryClient.invalidateQueries(['projects']);
            queryClient.invalidateQueries(['payments']);
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill,
        notes: {
          customRequestId: request._id,
        },
        theme: {
          color: '#0EA5E9',
        },
      });

      checkout.on('payment.failed', (response) => {
        toast.error(response?.error?.description || 'Payment failed');
      });

      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start payment');
    } finally {
      setPayingId(null);
    }
  };

  const totalPages = data?.pages || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isAdmin ? 'Review requests and send quotes.' : 'Track your plan requests.'}
          </p>
        </div>
        {!isAdmin && (
          <Link to="/request" className="btn-primary inline-flex items-center self-start">
            New Request
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusFilter === tab.key ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-surface-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-50 dark:bg-surface-600 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : data?.requests?.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.requests.map((request) => (
            <div key={request._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                      {SERVICE_LABELS[request.serviceType] || request.serviceType}
                    </span>
                    <span className={`${getStatusBadge(request.status)} capitalize`}>
                      {request.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {request.fullName}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{request.email}</p>
                  {request.projectDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-3">
                      {request.projectDescription}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Number(request.expectedPrice) > 0 && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                        Client offer: {formatINR(Number(request.expectedPrice))}
                      </span>
                    )}
                    {request.budgetRange && (
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-surface-700 px-2 py-1 rounded-full">
                        Budget range: {request.budgetRange}
                      </span>
                    )}
                  </div>
                  {request.fileUrl && (
                    <a
                      href={request.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-500 mt-2 inline-block"
                    >
                      View attachment
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-surface-700 text-xs text-gray-500 dark:text-gray-400">
                    <p>Quote</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      {request.quotedPrice ? formatINR(Number(request.quotedPrice)) : 'Pending'}
                    </p>
                  </div>
                  {isAdmin ? (
                    <button
                      onClick={() => openModal(request)}
                      className="btn-secondary inline-flex items-center justify-center"
                    >
                      <PencilSquareIcon className="w-4 h-4 mr-1.5" /> Update
                    </button>
                  ) : request.status === 'quoted' && request.quotedPrice > 0 ? (
                    <button
                      onClick={() => handlePay(request)}
                      disabled={payingId === request._id}
                      className="btn-primary disabled:opacity-50"
                    >
                      {payingId === request._id ? 'Processing...' : 'Pay Now'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Update Quote</h2>
            <div className="space-y-4">
              {Number(selected.expectedPrice) > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-700">Client offered amount</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-amber-900">
                      {formatINR(Number(selected.expectedPrice))}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuotedPrice(String(Number(selected.expectedPrice)));
                        setStatus('quoted');
                      }}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      Use this amount
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quoted price (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  className="input-field"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  This amount will be used for client payment once status is quoted.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="quoted">Quoted</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isLoading}
                  className="btn-primary disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomRequestList;
