import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery('adminStats', async () => {
    const res = await api.get('/admin/stats');
    return res.data.stats;
  });

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      color: 'text-blue-600 dark:text-blue-400',
      link: '/admin/users',
    },
    {
      name: 'Active Projects',
      value: stats?.totalProjects || 0,
      icon: BriefcaseIcon,
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      color: 'text-emerald-600 dark:text-emerald-400',
      link: '/projects',
    },
    {
      name: 'Revenue',
      value: formatINR(stats?.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      color: 'text-amber-600 dark:text-amber-400',
      link: '/payments',
    },
    {
      name: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: ClipboardDocumentListIcon,
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      color: 'text-violet-600 dark:text-violet-400',
      link: '/requests',
    },
    {
      name: 'Pending Requests',
      value: stats?.pendingCustomRequests || 0,
      icon: DocumentTextIcon,
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      color: 'text-sky-600 dark:text-sky-400',
      link: '/custom-requests',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening on your platform today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/settings" className="btn-secondary !text-sm !py-2">
            Settings
          </Link>
          <Link to="/admin/users" className="btn-secondary !text-sm !py-2">
            Manage Users
          </Link>
          <Link to="/admin/services" className="btn-primary !text-sm !py-2">
            Manage Services
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? (
                    <span className="inline-block w-12 h-7 bg-gray-100 dark:bg-surface-700 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
              <div className={`${stat.bg} p-2.5 rounded-xl`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Users</h2>
            <Link
              to="/admin/users"
              className="text-xs text-primary-500 hover:text-primary-600 flex items-center"
            >
              View all <ArrowRightIcon className="w-3 h-3 ml-1" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center p-2.5">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-surface-700 rounded-lg" />
                  <div className="ml-3 flex-1">
                    <div className="h-3.5 bg-gray-100 dark:bg-surface-700 rounded w-1/3 mb-1.5" />
                    <div className="h-3 bg-gray-50 dark:bg-surface-600 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {stats?.recentUsers?.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                      {u.name?.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {u.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <span className="badge-primary capitalize">{u.role}</span>
                </div>
              ))}
              {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No users yet</p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-xs text-primary-500 hover:text-primary-600 flex items-center"
            >
              View all <ArrowRightIcon className="w-3 h-3 ml-1" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-2.5">
                  <div className="h-3.5 bg-gray-100 dark:bg-surface-700 rounded w-2/3 mb-1.5" />
                  <div className="h-3 bg-gray-50 dark:bg-surface-600 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {stats?.recentProjects?.map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="block p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {project.title}
                    </p>
                    <span
                      className={`badge ${
                        project.status === 'completed'
                          ? 'badge-success'
                          : project.status === 'in-progress'
                            ? 'badge-primary'
                            : 'badge-warning'
                      } capitalize`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Client: {project.clientId?.name}
                  </p>
                </Link>
              ))}
              {(!stats?.recentProjects || stats.recentProjects.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No projects yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
