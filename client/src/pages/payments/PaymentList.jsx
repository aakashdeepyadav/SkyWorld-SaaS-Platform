import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';

const getStatusBadge = (status) => {
    const map = {
        pending: 'badge-warning',
        processing: 'badge-primary',
        completed: 'badge-success',
        failed: 'badge-danger',
        refunded: 'badge-danger',
    };
    return map[status] || 'badge-primary';
};

const PaymentList = () => {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    const { data, isLoading } = useQuery(
        ['payments', page, statusFilter],
        async () => {
            const params = new URLSearchParams({ page, limit: 10 });
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/payments?${params}`);
            return res.data;
        },
        { keepPreviousData: true }
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {user?.role === 'client' ? 'Your payment history and invoices.' : 'All platform payment transactions.'}
                </p>
            </div>

            {/* Status Filter */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {['', 'pending', 'processing', 'completed', 'failed', 'refunded'].map(status => (
                    <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setPage(1); }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${statusFilter === status
                                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-surface-800'
                            }`}
                    >
                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="card !p-0 overflow-hidden animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-surface-700">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-surface-700 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-100 dark:bg-surface-700 rounded w-1/3" />
                                <div className="h-2.5 bg-gray-50 dark:bg-surface-600 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : data?.payments?.length === 0 ? (
                <div className="card text-center py-16">
                    <CreditCardIcon className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No payments found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Payments will appear here when invoices are created.</p>
                </div>
            ) : (
                <div className="card !p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-surface-700">
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Project</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Amount</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                                    {user?.role !== 'client' && (
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Client</th>
                                    )}
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-surface-700">
                                {data.payments.map(payment => (
                                    <tr key={payment._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-700/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{payment.projectId?.title || 'N/A'}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatINR(payment.amount)}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`${getStatusBadge(payment.status)} capitalize`}>{payment.status}</span>
                                        </td>
                                        {user?.role !== 'client' && (
                                            <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{payment.clientId?.name || 'N/A'}</td>
                                        )}
                                        <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(payment.createdAt).toLocaleDateString()}
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
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40">Previous</button>
                    <span className="text-sm text-gray-500">Page {page} of {data.pages}</span>
                    <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40">Next</button>
                </div>
            )}
        </div>
    );
};

export default PaymentList;
