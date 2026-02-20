import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { FolderIcon } from '@heroicons/react/24/outline';

const getStatusBadge = (status) => {
    const map = {
        planning: 'badge-warning',
        'in-progress': 'badge-primary',
        review: 'badge-primary',
        completed: 'badge-success',
        cancelled: 'badge-danger',
    };
    return map[status] || 'badge-primary';
};

const ProjectList = () => {
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery(
        ['projects', page],
        async () => {
            const res = await api.get(`/projects?page=${page}&limit=12`);
            return res.data;
        },
        { keepPreviousData: true }
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <p className="text-sm text-gray-500 mt-1">Track active and past projects.</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card animate-pulse">
                            <div className="h-5 bg-gray-100 rounded w-2/3 mb-3" />
                            <div className="h-3 bg-gray-50 rounded w-full mb-2" />
                            <div className="h-2 bg-gray-100 rounded-full w-full" />
                        </div>
                    ))}
                </div>
            ) : data?.projects?.length === 0 ? (
                <div className="card text-center py-16">
                    <FolderIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No projects yet</p>
                    <p className="text-sm text-gray-400 mt-1">Projects will appear here once service requests are approved.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.projects.map(project => (
                        <Link
                            key={project._id}
                            to={`/projects/${project._id}`}
                            className="card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors flex-1 mr-2">
                                    {project.title}
                                </h3>
                                <span className={`${getStatusBadge(project.status)} capitalize flex-shrink-0`}>
                                    {project.status}
                                </span>
                            </div>
                            {project.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{project.description}</p>
                            )}
                            {/* Progress bar */}
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-gray-400">Progress</span>
                                    <span className="font-medium text-gray-600">{project.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                                        style={{ width: `${project.progress || 0}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
                                <span>{project.clientId?.name || 'Client'}</span>
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {data?.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40"
                    >Previous</button>
                    <span className="text-sm text-gray-500">Page {page} of {data.pages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                        disabled={page === data.pages}
                        className="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-40"
                    >Next</button>
                </div>
            )}
        </div>
    );
};

export default ProjectList;
