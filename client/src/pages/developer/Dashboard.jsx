import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BriefcaseIcon, ClockIcon, CheckCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const DeveloperDashboard = () => {
  const { user } = useAuth();

  const { data: projects, isLoading } = useQuery('developerProjects', async () => {
    const response = await api.get('/projects');
    return response.data;
  });

  const { data: requests, isLoading: requestsLoading } = useQuery('developerRequests', async () => {
    const response = await api.get('/requests');
    return response.data;
  });

  const stats = {
    total: projects?.total || 0,
    inProgress: projects?.projects?.filter(p => p.status === 'in-progress').length || 0,
    completed: projects?.projects?.filter(p => p.status === 'completed').length || 0,
    assignedRequests: requests?.total || 0,
  };

  const statCards = [
    { name: 'Total Projects', value: stats.total, icon: BriefcaseIcon, bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-600 dark:text-blue-400' },
    { name: 'In Progress', value: stats.inProgress, icon: ClockIcon, bg: 'bg-amber-50 dark:bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
    { name: 'Completed', value: stats.completed, icon: CheckCircleIcon, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
    { name: 'Assigned Requests', value: stats.assignedRequests, icon: ClipboardDocumentListIcon, bg: 'bg-violet-50 dark:bg-violet-500/10', color: 'text-violet-600 dark:text-violet-400' },
  ];

  const getStatusBadge = (status) => {
    const map = { 'completed': 'badge-success', 'in-progress': 'badge-primary', 'pending': 'badge-warning' };
    return map[status] || 'badge-primary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your project overview.</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">My Projects</h2>
          <span className="badge-primary">{stats.total} total</span>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse p-3 border border-gray-100 dark:border-surface-700 rounded-xl">
                <div className="h-4 bg-gray-100 dark:bg-surface-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-50 dark:bg-surface-600 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : projects?.projects?.length === 0 ? (
          <div className="text-center py-10">
            <BriefcaseIcon className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No projects assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects?.projects?.map((project) => (
              <div key={project._id} className="p-4 border border-gray-100 dark:border-surface-700 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white">{project.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{project.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Client: {project.clientId?.name}</p>
                  </div>
                  <span className={`${getStatusBadge(project.status)} capitalize ml-3 whitespace-nowrap`}>
                    {project.status}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${project.status === 'completed' ? 'bg-emerald-500' : 'bg-primary-500'
                        }`}
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Assigned Requests</h2>
          <span className="badge-primary">{stats.assignedRequests} total</span>
        </div>
        {requestsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse p-3 border border-gray-100 dark:border-surface-700 rounded-xl">
                <div className="h-4 bg-gray-100 dark:bg-surface-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-50 dark:bg-surface-600 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : requests?.requests?.length === 0 ? (
          <div className="text-center py-10">
            <ClipboardDocumentListIcon className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No requests assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests?.requests?.map((request) => (
              <Link key={request._id} to={`/requests/${request._id}`} className="block p-4 border border-gray-100 dark:border-surface-700 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{request.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{request.serviceId?.name || 'Service'}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Client: {request.clientId?.name || 'N/A'}</p>
                  </div>
                  <span className={`${getStatusBadge(request.status)} capitalize ml-3 whitespace-nowrap`}>
                    {request.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperDashboard;
