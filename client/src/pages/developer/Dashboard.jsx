import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BriefcaseIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DeveloperDashboard = () => {
  const { user } = useAuth();

  const { data: projects, isLoading } = useQuery('developerProjects', async () => {
    const response = await api.get('/projects');
    return response.data;
  });

  const stats = {
    total: projects?.total || 0,
    inProgress: projects?.projects?.filter(p => p.status === 'in-progress').length || 0,
    completed: projects?.projects?.filter(p => p.status === 'completed').length || 0,
  };

  const statCards = [
    { name: 'Total Projects', value: stats.total, icon: BriefcaseIcon, bg: 'bg-blue-50', color: 'text-blue-600' },
    { name: 'In Progress', value: stats.inProgress, icon: ClockIcon, bg: 'bg-amber-50', color: 'text-amber-600' },
    { name: 'Completed', value: stats.completed, icon: CheckCircleIcon, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  ];

  const getStatusBadge = (status) => {
    const map = {
      'completed': 'badge-success',
      'in-progress': 'badge-primary',
      'pending': 'badge-warning',
    };
    return map[status] || 'badge-primary';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's your project overview for today.</p>
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

      {/* Projects List */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">My Projects</h2>
          <span className="badge-primary">{stats.total} total</span>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse p-4 border border-gray-100 rounded-xl">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full ml-4" />
                </div>
              </div>
            ))}
          </div>
        ) : projects?.projects?.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-lg">No projects assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Projects will appear here once they're assigned to you</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects?.projects?.map((project) => (
              <div key={project._id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{project.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Client: {project.clientId?.name}</span>
                    </div>
                  </div>
                  <span className={`${getStatusBadge(project.status)} capitalize ml-4 whitespace-nowrap`}>
                    {project.status}
                  </span>
                </div>
                {/* Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold">{project.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${project.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-primary-500 to-accent-500'
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
    </div>
  );
};

export default DeveloperDashboard;
