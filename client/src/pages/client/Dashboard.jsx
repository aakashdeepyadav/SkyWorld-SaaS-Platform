import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { user } = useAuth();

  const { data: requests, isLoading: requestsLoading } = useQuery('clientRequests', async () => {
    const response = await api.get('/requests');
    return response.data;
  });

  const { data: projects, isLoading: projectsLoading } = useQuery('clientProjects', async () => {
    const response = await api.get('/projects');
    return response.data;
  });

  const { data: customRequests, isLoading: customRequestsLoading } = useQuery('clientCustomRequests', async () => {
    const response = await api.get('/custom-requests');
    return response.data;
  });

  const statCards = [
    { name: 'Active Projects', value: projects?.total || 0, icon: BriefcaseIcon, bg: 'bg-blue-50', color: 'text-blue-600' },
    { name: 'Pending Requests', value: requests?.requests?.filter(r => r.status === 'pending').length || 0, icon: ClockIcon, bg: 'bg-amber-50', color: 'text-amber-600' },
    { name: 'Completed', value: projects?.projects?.filter(p => p.status === 'completed').length || 0, icon: CheckCircleIcon, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { name: 'Custom Requests', value: customRequests?.requests?.length || 0, icon: DocumentTextIcon, bg: 'bg-sky-50', color: 'text-sky-600' },
  ];

  const getStatusBadge = (status) => {
    const map = { 'completed': 'badge-success', 'in-progress': 'badge-primary', 'pending': 'badge-warning', 'approved': 'badge-primary', 'quoted': 'badge-primary', 'cancelled': 'badge-danger' };
    return map[status] || 'badge-primary';
  };

  const getPaymentBadge = (status) => {
    const map = { completed: 'badge-success', processing: 'badge-primary', pending: 'badge-warning', failed: 'badge-danger', refunded: 'badge-danger' };
    return map[status] || 'badge-primary';
  };

  const serviceLabels = {
    'web-development': 'Web Development',
    'app-development': 'App Development',
    'branding-creative': 'Branding'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">Your projects and requests at a glance.</p>
        </div>
        <Link to="/requests/new" className="btn-primary inline-flex items-center self-start">
          <PlusIcon className="w-4 h-4 mr-1.5" />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`${stat.bg} p-2.5 rounded-xl`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">My Projects</h2>
          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse p-3"><div className="h-3.5 bg-gray-100 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-50 rounded w-full" /></div>)}
            </div>
          ) : projects?.projects?.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects?.projects?.slice(0, 5).map((project) => (
                <div key={project._id} className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900">{project.title}</h3>
                    <span className={`${getStatusBadge(project.status)} capitalize`}>{project.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-2">
                    {project.serviceType && (
                      <span className="badge-primary">{serviceLabels[project.serviceType] || project.serviceType}</span>
                    )}
                    {project.plan && (
                      <span className="badge bg-gray-50 text-gray-600 ring-1 ring-gray-200 capitalize">{project.plan}</span>
                    )}
                    {project.paymentStatus && (
                      <span className={`${getPaymentBadge(project.paymentStatus)} capitalize`}>{project.paymentStatus}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Service Requests</h2>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse p-3"><div className="h-3.5 bg-gray-100 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-50 rounded w-full" /></div>)}
            </div>
          ) : requests?.requests?.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests?.requests?.slice(0, 5).map((request) => (
                <div key={request._id} className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{request.title}</h3>
                    <span className={`${getStatusBadge(request.status)} capitalize`}>{request.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Service: {request.serviceId?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Custom Requests</h2>
          {customRequestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse p-3"><div className="h-3.5 bg-gray-100 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-50 rounded w-full" /></div>)}
            </div>
          ) : customRequests?.requests?.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No custom requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customRequests?.requests?.slice(0, 5).map((request) => (
                <div key={request._id} className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{request.fullName}</h3>
                    <span className={`${getStatusBadge(request.status)} capitalize`}>{request.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
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
