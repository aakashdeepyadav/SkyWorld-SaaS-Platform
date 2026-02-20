import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);
    const [showMessages, setShowMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    const isAdmin = user?.role === 'admin';
    const isDev = user?.role === 'developer';

    const { data: project, isLoading } = useQuery(
        ['project', id],
        async () => {
            const res = await api.get(`/projects/${id}`);
            return res.data.project;
        }
    );

    const { data: messagesData, isLoading: messagesLoading } = useQuery(
        ['messages', id],
        async () => {
            const res = await api.get(`/messages?projectId=${id}&limit=100`);
            return res.data;
        },
        { enabled: showMessages, refetchInterval: showMessages ? 10000 : false }
    );

    useEffect(() => {
        if (showMessages) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesData, showMessages]);

    const sendMessageMutation = useMutation(
        async () => {
            if (!newMessage.trim()) return;
            return api.post('/messages', {
                projectId: id,
                content: newMessage.trim(),
            });
        },
        {
            onSuccess: () => {
                setNewMessage('');
                queryClient.invalidateQueries(['messages', id]);
            },
            onError: (err) => toast.error(err.response?.data?.message || 'Failed to send message'),
        }
    );

    const updateProgressMutation = useMutation(
        async (progress) => api.put(`/projects/${id}`, { progress }),
        {
            onSuccess: () => {
                toast.success('Progress updated');
                queryClient.invalidateQueries(['project', id]);
            },
            onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
        }
    );

    const updateStatusMutation = useMutation(
        async (status) => api.put(`/projects/${id}`, { status }),
        {
            onSuccess: () => {
                toast.success('Status updated');
                queryClient.invalidateQueries(['project', id]);
            },
            onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
        }
    );

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="card animate-pulse space-y-4">
                    <div className="h-6 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-50 rounded w-2/3" />
                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <p className="text-gray-500">Project not found.</p>
                <button onClick={() => navigate('/projects')} className="btn-primary mt-4">Back to Projects</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => navigate('/projects')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Projects
            </button>

            {/* Header */}
            <div className="card">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Created {new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`${getStatusBadge(project.status)} capitalize text-sm`}>{project.status}</span>
                </div>

                {project.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">{project.description}</p>
                )}

                {/* Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400">Client</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{project.clientId?.name || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400">Budget</p>
                        <p className="text-sm font-medium text-gray-900">{project.budget ? `$${project.budget.toLocaleString()}` : 'TBD'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400">Start</p>
                        <p className="text-sm font-medium text-gray-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400">End</p>
                        <p className="text-sm font-medium text-gray-900">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Progress</span>
                        <span className="text-gray-500">{project.progress || 0}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress || 0}%` }}
                        />
                    </div>
                    {(isDev || isAdmin) && project.status !== 'completed' && (
                        <div className="flex items-center gap-2 mt-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                defaultValue={project.progress || 0}
                                className="flex-1 h-1 bg-gray-200 rounded-lg accent-primary-500 cursor-pointer"
                                onMouseUp={(e) => updateProgressMutation.mutate(Number(e.target.value))}
                                onTouchEnd={(e) => updateProgressMutation.mutate(Number(e.target.value))}
                            />
                        </div>
                    )}
                </div>

                {/* Developers */}
                {project.developerIds?.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Team</h3>
                        <div className="flex flex-wrap gap-2">
                            {project.developerIds.map(dev => (
                                <div key={dev._id || dev} className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold mr-2">
                                        {(dev.name || 'D').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-700">{dev.name || dev.email || 'Developer'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Milestones */}
            {project.milestones?.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Milestones</h2>
                    <div className="space-y-3">
                        {project.milestones.map((ms, i) => (
                            <div key={i} className={`flex items-start p-3 rounded-xl ${ms.completed ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                <CheckCircleIcon className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${ms.completed ? 'text-emerald-500' : 'text-gray-300'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${ms.completed ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>{ms.title}</p>
                                    {ms.description && <p className="text-xs text-gray-500 mt-0.5">{ms.description}</p>}
                                    {ms.dueDate && <p className="text-xs text-gray-400 mt-1">Due: {new Date(ms.dueDate).toLocaleDateString()}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Actions */}
            {(isAdmin || isDev) && project.status !== 'completed' && project.status !== 'cancelled' && (
                <div className="card">
                    <h2 className="font-semibold text-gray-900 mb-3">Update Status</h2>
                    <div className="flex flex-wrap gap-2">
                        {project.status === 'planning' && (
                            <button onClick={() => updateStatusMutation.mutate('in-progress')} className="btn-primary !text-sm !py-2">Start Development</button>
                        )}
                        {project.status === 'in-progress' && (
                            <button onClick={() => updateStatusMutation.mutate('review')} className="btn-primary !text-sm !py-2">Submit for Review</button>
                        )}
                        {project.status === 'review' && isAdmin && (
                            <button onClick={() => updateStatusMutation.mutate('completed')} className="btn-primary !bg-emerald-500 !text-sm !py-2">Approve & Complete</button>
                        )}
                        {isAdmin && (
                            <button onClick={() => updateStatusMutation.mutate('cancelled')} className="btn-danger !text-sm !py-2">Cancel Project</button>
                        )}
                    </div>
                </div>
            )}

            {/* Messages Panel */}
            <div className="card">
                <button
                    onClick={() => setShowMessages(!showMessages)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-primary-500" /> Messages
                    </h2>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showMessages ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showMessages && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        {/* Message list */}
                        <div className="max-h-80 overflow-y-auto space-y-3 mb-4">
                            {messagesLoading ? (
                                <div className="text-center py-8 text-sm text-gray-400">Loading messages...</div>
                            ) : messagesData?.messages?.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-400">No messages yet. Start the conversation.</div>
                            ) : (
                                messagesData.messages.map(msg => {
                                    const isMe = msg.senderId?._id === user?._id;
                                    return (
                                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe
                                                    ? 'bg-primary-500 text-white rounded-br-md'
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                                }`}>
                                                {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderId?.name}</p>}
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Send message */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                                        e.preventDefault();
                                        sendMessageMutation.mutate();
                                    }
                                }}
                                placeholder="Type a message..."
                                className="input-field !py-2.5"
                                maxLength={2000}
                            />
                            <button
                                onClick={() => sendMessageMutation.mutate()}
                                disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                                className="btn-primary !p-2.5 !rounded-xl disabled:opacity-40"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetail;
