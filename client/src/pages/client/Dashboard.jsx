import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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

  const statCards = [
    {
      name: 'Active Projects',
      value: projects?.total || 0,
      icon: BriefcaseIcon,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      name: 'Pending Requests',
      value: requests?.requests?.filter(r => r.status === 'pending').length || 0,
      icon: ClockIcon,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
    },
    {
      name: 'Completed',
      value: projects?.projects?.filter(p => p.status === 'completed').length || 0,
      icon: CheckCircleIcon,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
    },
  ];

  const getStatusBadge = (status) => {
    const map = {
      'completed': 'badge-success',
      'in-progress': 'badge-primary',
      'pending': 'badge-warning',
      'approved': 'badge-primary',
      'rejected': 'badge-danger',
    };
    return map[status] || 'badge-primary';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Here's an overview of your projects and requests.</p>
        </div>
        <Link to="/requests/new" className="btn-primary inline-flex items-center self-start">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((stat, i) => (
          <div key={stat.name} className="card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center">
              <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects and Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">My Projects</h2>
          </div>
          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : projects?.projects?.length === 0 ? (
            <div className="text-center py-10">
              <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No projects yet</p>
              <p className="text-sm text-gray-400 mt-1">Submit a request to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects?.projects?.slice(0, 5).map((project) => (
                <div key={project._id} className="p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{project.title}</h3>
                    <span className={`${getStatusBadge(project.status)} capitalize`}>{project.status}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{project.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Service Requests</h2>
          </div>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : requests?.requests?.length === 0 ? (
            <div className="text-center py-10">
              <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No requests yet</p>
              <p className="text-sm text-gray-400 mt-1">Create a new request to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests?.requests?.slice(0, 5).map((request) => (
                <div key={request._id} className="p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">{request.title}</h3>
                    <span className={`${getStatusBadge(request.status)} capitalize`}>{request.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Service: {request.serviceId?.name}
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
