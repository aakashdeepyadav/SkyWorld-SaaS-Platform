import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import {
  PlusIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [payingProjectId, setPayingProjectId] = useState(null);

  const { data: requests, isLoading: requestsLoading } = useQuery('clientRequests', async () => {
    const response = await api.get('/requests');
    return response.data;
  });

  const { data: projects, isLoading: projectsLoading } = useQuery('clientProjects', async () => {
    const response = await api.get('/projects');
    return response.data;
  });

  const { data: customRequests, isLoading: customRequestsLoading } = useQuery(
    'clientCustomRequests',
    async () => {
      const response = await api.get('/custom-requests');
      return response.data;
    }
  );

  /* ─── Pay remaining balance (final 50%) ─── */
  const handlePayBalance = async (project) => {
    if (!window.Razorpay) {
      toast.error('Payment service not available');
      return;
    }
    setPayingProjectId(project._id);
    try {
      const { data } = await api.post('/payments/razorpay/final-order', {
        projectId: project._id,
      });
      const { order, keyId, payment } = data;
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
        description: `Final payment — ${project.title}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              paymentId: payment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Final payment successful!');
            window.location.reload();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill,
        notes: { projectId: project._id, paymentPhase: 'final' },
        theme: { color: '#0EA5E9' },
      });
      checkout.on('payment.failed', (resp) => {
        toast.error(resp?.error?.description || 'Payment failed');
      });
      checkout.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start payment');
    } finally {
      setPayingProjectId(null);
    }
  };

  const statCards = [
    {
      name: 'Active Projects',
      value: projects?.total || 0,
      icon: BriefcaseIcon,
      bg: 'bg-blue-500/10',
      color: 'text-blue-500',
      ring: 'ring-blue-500/20',
    },
    {
      name: 'Pending Requests',
      value: requests?.requests?.filter((r) => r.status === 'pending').length || 0,
      icon: ClockIcon,
      bg: 'bg-amber-500/10',
      color: 'text-amber-500',
      ring: 'ring-amber-500/20',
    },
    {
      name: 'Completed',
      value: projects?.projects?.filter((p) => p.status === 'completed').length || 0,
      icon: CheckCircleIcon,
      bg: 'bg-emerald-500/10',
      color: 'text-emerald-500',
      ring: 'ring-emerald-500/20',
    },
    {
      name: 'Custom Requests',
      value: customRequests?.requests?.length || 0,
      icon: DocumentTextIcon,
      bg: 'bg-sky-500/10',
      color: 'text-sky-500',
      ring: 'ring-sky-500/20',
    },
  ];

  const getStatusBadge = (status) => {
    const map = {
      completed: 'badge-success',
      'in-progress': 'badge-primary',
      pending: 'badge-warning',
      approved: 'badge-primary',
      quoted: 'badge-primary',
      cancelled: 'badge-danger',
    };
    return map[status] || 'badge-primary';
  };

  const getPaymentBadge = (status) => {
    const map = {
      completed: 'badge-success',
      processing: 'badge-primary',
      pending: 'badge-warning',
      failed: 'badge-danger',
      refunded: 'badge-danger',
    };
    return map[status] || 'badge-primary';
  };

  const serviceLabels = {
    'web-development': 'Web Development',
    'app-development': 'App Development',
    'branding-creative': 'Branding',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your projects and requests at a glance.
          </p>
        </div>
        <Link to="/requests/new" className="btn-primary inline-flex items-center self-start">
          <PlusIcon className="w-4 h-4 mr-1.5" />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className={`${stat.bg} p-2.5 rounded-xl ring-1 ${stat.ring}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">My Projects</h2>
          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-3.5 bg-gray-100 dark:bg-surface-700 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-50 dark:bg-surface-700/50 rounded w-full" />
                </div>
              ))}
            </div>
          ) : projects?.projects?.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects?.projects?.slice(0, 5).map((project) => (
                <div
                  key={project._id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.title}
                    </h3>
                    <span className={`${getStatusBadge(project.status)} capitalize`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-2">
                    {project.serviceType && (
                      <span className="badge-primary">
                        {serviceLabels[project.serviceType] || project.serviceType}
                      </span>
                    )}
                    {project.plan && (
                      <span className="badge bg-gray-50 dark:bg-surface-700 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-surface-600 capitalize">
                        {project.plan}
                      </span>
                    )}
                    {project.paymentStatus && (
                      <span className={`${getPaymentBadge(project.paymentStatus)} capitalize`}>
                        {project.paymentStatus}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Pay Balance button — shows when advance paid but final pending */}
                  {project.advancePaid && !project.finalPaid && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-surface-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCardIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Balance due:{' '}
                            {formatINR(
                              project.totalPlanPrice
                                ? project.totalPlanPrice - Math.ceil(project.totalPlanPrice / 2)
                                : 0
                            )}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePayBalance(project);
                          }}
                          disabled={payingProjectId === project._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LockClosedIcon className="w-3 h-3" />
                          {payingProjectId === project._id ? 'Processing...' : 'Pay Balance'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Service Requests</h2>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-3.5 bg-gray-100 dark:bg-surface-700 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-50 dark:bg-surface-700/50 rounded w-full" />
                </div>
              ))}
            </div>
          ) : requests?.requests?.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests?.requests?.slice(0, 5).map((request) => (
                <div
                  key={request._id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.title}
                    </h3>
                    <span className={`${getStatusBadge(request.status)} capitalize`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Service: {request.serviceId?.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Custom Requests</h2>
          {customRequestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-3.5 bg-gray-100 dark:bg-surface-700 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-50 dark:bg-surface-700/50 rounded w-full" />
                </div>
              ))}
            </div>
          ) : customRequests?.requests?.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No custom requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customRequests?.requests?.slice(0, 5).map((request) => (
                <div
                  key={request._id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.fullName}
                    </h3>
                    <span className={`${getStatusBadge(request.status)} capitalize`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {serviceLabels[request.serviceType] || request.serviceType}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
