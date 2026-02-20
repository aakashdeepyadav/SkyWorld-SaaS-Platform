import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery('adminStats', async () => {
    const [users, projects, payments] = await Promise.all([
      api.get('/users?limit=5'),
      api.get('/projects?limit=5'),
      api.get('/payments?limit=5')
    ]);
    return { users: users.data, projects: projects.data, payments: payments.data };
  });

  const statCards = [
    { name: 'Total Users', value: stats?.users?.total || 0, icon: UsersIcon, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
    { name: 'Active Projects', value: stats?.projects?.total || 0, icon: BriefcaseIcon, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
    { name: 'Total Revenue', value: `$${stats?.payments?.total || 0}`, icon: CurrencyDollarIcon, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    { name: 'Growth', value: '+12%', icon: ChartBarIcon, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-primary-100 text-sm font-medium">Welcome back,</p>
          <h1 className="text-3xl font-bold mt-1">{user?.name} 👋</h1>
          <p className="text-primary-100/80 mt-2 max-w-lg">Here's what's happening with your platform today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, i) => (
          <div key={stat.name} className="card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{ stroke: 'url(#grad)' }} />
                <stat.icon className={`w-6 h-6 text-gray-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
            <span className="badge-primary">{stats?.users?.total || 0} total</span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center p-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.users?.users?.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                      {u.name?.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <span className="badge-primary capitalize">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Projects</h2>
            <span className="badge-primary">{stats?.projects?.total || 0} total</span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.projects?.projects?.map((project) => (
                <div key={project._id} className="p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm">{project.title}</p>
                    <span className={`badge ${project.status === 'completed' ? 'badge-success' :
                        project.status === 'in-progress' ? 'badge-primary' :
                          'badge-warning'
                      } capitalize`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Client: {project.clientId?.name}
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

export default AdminDashboard;
