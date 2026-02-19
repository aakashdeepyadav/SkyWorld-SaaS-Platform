import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { BriefcaseIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DeveloperDashboard = () => {
  const { data: projects, isLoading } = useQuery('developerProjects', async () => {
    const response = await api.get('/projects');
    return response.data;
  });

  const stats = {
    total: projects?.total || 0,
    inProgress: projects?.projects?.filter(p => p.status === 'in-progress').length || 0,
    completed: projects?.projects?.filter(p => p.status === 'completed').length || 0,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Developer Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <BriefcaseIcon className="w-8 h-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Projects</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : projects?.projects?.length === 0 ? (
          <p className="text-gray-500">No projects assigned yet</p>
        ) : (
          <div className="space-y-4">
            {projects?.projects?.map((project) => (
              <div key={project._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Client: {project.clientId?.name} • Progress: {project.progress}%
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
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

