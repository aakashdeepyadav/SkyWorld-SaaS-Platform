import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery('adminStats', async () => {
    const [users, projects, payments] = await Promise.all([
      api.get('/users?limit=5'),
      api.get('/projects?limit=5'),
      api.get('/payments?limit=5')
    ]);
    return { users: users.data, projects: projects.data, payments: payments.data };
  });

  const statCards = [
    { name: 'Total Users', value: stats?.users?.total || 0, icon: UsersIcon, color: 'bg-blue-500' },
    { name: 'Active Projects', value: stats?.projects?.total || 0, icon: BriefcaseIcon, color: 'bg-green-500' },
    { name: 'Total Revenue', value: `$${stats?.payments?.total || 0}`, icon: CurrencyDollarIcon, color: 'bg-yellow-500' },
    { name: 'Growth', value: '+12%', icon: ChartBarIcon, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3">
              {stats?.users?.users?.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      {user.name?.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 capitalize">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3">
              {stats?.projects?.projects?.map((project) => (
                <div key={project._id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{project.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Client: {project.clientId?.name} • Status: {project.status}
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

