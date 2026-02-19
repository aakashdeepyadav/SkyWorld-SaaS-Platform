import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { PlusIcon, BriefcaseIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { data: requests, isLoading: requestsLoading } = useQuery('clientRequests', async () => {
    const response = await api.get('/requests');
    return response.data;
  });

  const { data: projects, isLoading: projectsLoading } = useQuery('clientProjects', async () => {
    const response = await api.get('/projects');
    return response.data;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
        <Link to="/requests/new" className="btn-primary flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <BriefcaseIcon className="w-8 h-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{projects?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {requests?.requests?.filter(r => r.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <BriefcaseIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects?.projects?.filter(p => p.status === 'completed').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects and Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">My Projects</h2>
          {projectsLoading ? (
            <p>Loading...</p>
          ) : projects?.projects?.length === 0 ? (
            <p className="text-gray-500">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {projects?.projects?.slice(0, 5).map((project) => (
                <div key={project._id} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: <span className="capitalize">{project.status}</span> • Progress: {project.progress}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Service Requests</h2>
          {requestsLoading ? (
            <p>Loading...</p>
          ) : requests?.requests?.length === 0 ? (
            <p className="text-gray-500">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {requests?.requests?.slice(0, 5).map((request) => (
                <div key={request._id} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">{request.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Service: {request.serviceId?.name} • Status: <span className="capitalize">{request.status}</span>
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

