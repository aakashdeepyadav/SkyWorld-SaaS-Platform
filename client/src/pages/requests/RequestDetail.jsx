import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';

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

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'admin';

    const [assignData, setAssignData] = useState({ developerId: '', estimatedPrice: '' });

    const { data, isLoading, error } = useQuery(
        ['request', id],
        async () => {
            const res = await api.get(`/requests/${id}`);
            return res.data.request;
        }
    );

    const { data: developers } = useQuery(
        'developers',
        async () => {
            const res = await api.get('/users?role=developer&limit=100');
            return res.data.users || [];
        },
        { enabled: isAdmin }
    );

    const assignMutation = useMutation(
        async () => {
            if (!assignData.developerId) throw new Error('Select a developer');
            return api.put(`/requests/${id}/assign`, {
                developerId: assignData.developerId,
                estimatedPrice: assignData.estimatedPrice ? Number(assignData.estimatedPrice) : undefined,
            });
        },
        {
            onSuccess: () => {
                toast.success('Developer assigned successfully');
                queryClient.invalidateQueries(['request', id]);
            },
            onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to assign'),
        }
    );

    const statusMutation = useMutation(
        async (newStatus) => api.put(`/requests/${id}/status`, { status: newStatus }),
        {
            onSuccess: () => {
                toast.success('Status updated');
                queryClient.invalidateQueries(['request', id]);
            },
            onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
        }
    );

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto animate-fade-in">
                <div className="card animate-pulse space-y-4">
                    <div className="h-6 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-50 rounded w-2/3" />
                    <div className="h-4 bg-gray-50 rounded w-1/2" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20">
                <p className="text-gray-500">Request not found or access denied.</p>
                <button onClick={() => navigate('/requests')} className="btn-primary mt-4">Back to Requests</button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => navigate('/requests')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Requests
            </button>

            {/* Main Info */}
            <div className="card">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{data.title}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Submitted {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <span className={`${getStatusBadge(data.status)} capitalize text-sm`}>{data.status}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 mb-0.5">Service</p>
                        <p className="text-sm font-medium text-gray-900">{data.serviceId?.name || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 mb-0.5">Client</p>
                        <p className="text-sm font-medium text-gray-900">{data.clientId?.name || 'N/A'}</p>
                    </div>
                    {data.estimatedPrice > 0 && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-0.5">Estimated Price</p>
                            <p className="text-sm font-medium text-gray-900">{formatINR(data.estimatedPrice)}</p>
                        </div>
                    )}
                    {data.assignedDeveloperId && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-0.5">Assigned Developer</p>
                            <p className="text-sm font-medium text-gray-900">{data.assignedDeveloperId.name}</p>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>
                </div>

                {data.requirements && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Requirements</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{data.requirements}</p>
                    </div>
                )}
            </div>

            {/* Admin: Assign Developer */}
            {isAdmin && data.status === 'pending' && (
                <div className="card border-primary-200 bg-primary-50/30">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <UserIcon className="w-5 h-5 mr-2 text-primary-500" /> Assign Developer
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="devSelect" className="block text-sm font-medium text-gray-700 mb-1.5">Developer</label>
                            <select
                                id="devSelect"
                                value={assignData.developerId}
                                onChange={e => setAssignData(prev => ({ ...prev, developerId: e.target.value }))}
                                className="input-field"
                            >
                                <option value="">Select developer...</option>
                                {developers?.map(d => (
                                    <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="estPrice" className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Price (INR)</label>
                            <input
                                id="estPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={assignData.estimatedPrice}
                                onChange={e => setAssignData(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                                className="input-field"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={() => assignMutation.mutate()}
                            disabled={assignMutation.isLoading || !assignData.developerId}
                            className="btn-primary disabled:opacity-50"
                        >
                            {assignMutation.isLoading ? 'Assigning...' : 'Assign & Approve'}
                        </button>
                    </div>
                </div>
            )}

            {/* Status Actions */}
            {(isAdmin || user?.role === 'developer') && data.status !== 'completed' && data.status !== 'cancelled' && (
                <div className="card">
                    <h2 className="font-semibold text-gray-900 mb-3">Update Status</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.status === 'approved' && (
                            <button onClick={() => statusMutation.mutate('in-progress')} className="btn-primary !text-sm !py-2">
                                Start Work
                            </button>
                        )}
                        {data.status === 'in-progress' && (
                            <button onClick={() => statusMutation.mutate('completed')} className="btn-primary !bg-emerald-500 !hover:bg-emerald-600 !text-sm !py-2">
                                Mark Complete
                            </button>
                        )}
                        {data.status !== 'cancelled' && isAdmin && (
                            <button onClick={() => statusMutation.mutate('cancelled')} className="btn-danger !text-sm !py-2">
                                Cancel Request
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestDetail;
