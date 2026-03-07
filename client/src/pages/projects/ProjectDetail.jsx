import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';
import ProjectTracker from '../../components/common/ProjectTracker';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);
    const [showMessages, setShowMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isPaying, setIsPaying] = useState(false);

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

    const handlePay = async () => {
        const totalPayable = Number(project?.totalPlanPrice || project?.budget || 0);
        if (!totalPayable || totalPayable <= 0) {
            toast.error('Payment amount unavailable');
            return;
        }
        if (project?.finalPaid) {
            toast.success('This project is fully paid');
            return;
        }

        const isFinalPayment = Boolean(project?.advancePaid && !project?.finalPaid);
        const orderEndpoint = isFinalPayment
            ? '/payments/razorpay/final-order'
            : '/payments/razorpay/order';

        if (!window.Razorpay) {
            toast.error('Payment service not available');
            return;
        }
        setIsPaying(true);
        try {
            const { data } = await api.post(orderEndpoint, { projectId: id });
            const { order, keyId, payment } = data;
            const phone = typeof user?.phone === 'string' ? user.phone.trim() : '';
            const prefill = {
                name: user?.name || '',
                email: user?.email || '',
                ...(phone ? { contact: phone } : {})
            };
            const checkout = new window.Razorpay({
                key: keyId,
                amount: order.amount,
                currency: order.currency,
                name: 'SkyWorld',
                description: `${isFinalPayment ? 'Final' : 'Advance'} payment - ${project.title}`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post('/payments/razorpay/verify', {
                            paymentId: payment._id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        const redirectProjectId = verifyRes?.data?.payment?.projectId || id;
                        toast.success(isFinalPayment ? 'Final payment successful' : 'Advance payment successful');
                        queryClient.invalidateQueries(['payments']);
                        queryClient.invalidateQueries(['project', id]);
                        queryClient.invalidateQueries('clientProjects');
                        navigate(`/projects/${redirectProjectId}?meetingPrompt=1`);
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Payment verification failed');
                    }
                },
                prefill,
                notes: {
                    projectId: project._id
                },
                theme: {
                    color: '#0EA5E9'
                }
            });
            checkout.on('payment.failed', (response) => {
                toast.error(response?.error?.description || 'Payment failed');
            });
            checkout.open();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start payment');
        } finally {
            setIsPaying(false);
        }
    };

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

    const totalPlanPrice = Number(project?.totalPlanPrice || project?.budget || 0);
    const advanceAmount = totalPlanPrice > 0 ? Math.ceil(totalPlanPrice / 2) : 0;
    const finalAmount = totalPlanPrice > 0 ? Math.max(totalPlanPrice - advanceAmount, 0) : 0;
    const nextPaymentAmount = project?.advancePaid ? finalAmount : advanceAmount;
    const nextPaymentLabel = project?.advancePaid ? 'Pay Final 50%' : 'Pay 50% Advance';

    const paymentStage = (() => {
        if (!totalPlanPrice || totalPlanPrice <= 0) {
            return {
                label: 'No Payment Required',
                badgeClass: 'badge',
                description: 'No payable amount is configured for this project.'
            };
        }
        if (project?.finalPaid) {
            return {
                label: '100% Paid',
                badgeClass: 'badge-success',
                description: 'Advance and final payments are completed for this project.'
            };
        }
        if (project?.advancePaid) {
            return {
                label: '50% Advance Paid',
                badgeClass: 'badge-primary',
                description: `Half payment is completed. Remaining amount due: ${formatINR(finalAmount)}.`
            };
        }
        if (project?.paymentStatus === 'failed') {
            return {
                label: 'Payment Failed',
                badgeClass: 'badge-danger',
                description: `Payment attempt failed. Complete the advance payment of ${formatINR(advanceAmount)} to proceed.`
            };
        }
        return {
            label: 'Advance Pending',
            badgeClass: 'badge-warning',
            description: `To start this project, complete advance payment of ${formatINR(advanceAmount)}.`
        };
    })();

    const canPay =
        user?.role === 'client' &&
        totalPlanPrice > 0 &&
        project.status !== 'cancelled' &&
        !project?.finalPaid;

    const showMeetingPrompt = user?.role === 'client' && searchParams.get('meetingPrompt') === '1';
    const meetingRedirect = `/projects/${project?._id || id}`;

    const dismissMeetingPrompt = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('meetingPrompt');
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => navigate('/projects')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Projects
            </button>

            {/* Header Card */}
            <div className="card dark:bg-surface-800 dark:border-surface-700">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Created {new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`${getStatusBadge(project.status)} capitalize text-sm`}>{project.status}</span>
                </div>

                {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 whitespace-pre-wrap">{project.description}</p>
                )}

                {/* Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-surface-700 rounded-xl">
                        <p className="text-xs text-gray-400">Client</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.clientId?.name || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-surface-700 rounded-xl">
                        <p className="text-xs text-gray-400">Budget</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{project.budget ? formatINR(project.budget) : 'TBD'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-surface-700 rounded-xl">
                        <p className="text-xs text-gray-400">Start</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-surface-700 rounded-xl">
                        <p className="text-xs text-gray-400">End</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-surface-700 rounded-xl mb-6 border border-gray-100 dark:border-surface-600">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Payment Stage</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{paymentStage.description}</p>
                    </div>
                    <div className="flex-shrink-0 inline-flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className={`${paymentStage.badgeClass}`}>{paymentStage.label}</span>
                    </div>
                </div>

                {/* Pay CTA */}
                {canPay && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-primary-50 dark:bg-primary-500/10 rounded-xl mb-6">
                        <div>
                            <p className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                                {project?.advancePaid ? 'Complete final payment' : 'Pay to start this project'}
                            </p>
                            <p className="text-xs text-primary-600 dark:text-primary-500 mt-0.5">
                                Amount: {formatINR(nextPaymentAmount)}
                            </p>
                        </div>
                        <button
                            onClick={handlePay}
                            disabled={isPaying}
                            className="btn-primary !py-2 !px-4 disabled:opacity-50"
                        >
                            {isPaying ? 'Processing...' : `${nextPaymentLabel} (${formatINR(nextPaymentAmount)})`}
                        </button>
                    </div>
                )}

                {user?.role === 'client' && (
                    <div
                        className={`rounded-xl border p-4 mb-6 ${showMeetingPrompt
                                ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30'
                                : 'bg-gray-50 dark:bg-surface-700 border-gray-100 dark:border-surface-600'
                            }`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {showMeetingPrompt ? 'Payment received. Book your kickoff meeting.' : 'Meeting & Contact'}
                            </p>
                            {showMeetingPrompt && <span className="badge-primary">Recommended</span>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            Schedule a meeting to discuss scope, timeline, and next steps. For urgent help, contact support directly.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                                to={`/book-meeting?redirect=${encodeURIComponent(meetingRedirect)}`}
                                className="btn-primary !py-2 !px-3 !text-sm"
                            >
                                Book Meeting
                            </Link>
                            <Link to="/contact" className="btn-secondary !py-2 !px-3 !text-sm">
                                Contact Support
                            </Link>
                            {showMeetingPrompt && (
                                <button
                                    type="button"
                                    onClick={dismissMeetingPrompt}
                                    className="btn-ghost !py-2 !px-3 !text-sm"
                                >
                                    Not now
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Developers */}
                {project.developerIds?.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Team</h3>
                        <div className="flex flex-wrap gap-2">
                            {project.developerIds.map(dev => (
                                <div key={dev._id || dev} className="inline-flex items-center px-3 py-1.5 bg-gray-50 dark:bg-surface-700 rounded-lg text-sm">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center text-xs font-semibold mr-2">
                                        {(dev.name || 'D').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">{dev.name || dev.email || 'Developer'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Visual Project Status Tracker ─────────────────────────── */}
            <ProjectTracker project={project} />

            {/* Admin/Dev: Progress Slider */}
            {(isDev || isAdmin) && project.status !== 'completed' && project.status !== 'cancelled' && (
                <div className="card dark:bg-surface-800 dark:border-surface-700">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Update Progress</h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            defaultValue={project.progress || 0}
                            className="flex-1 h-1.5 bg-gray-200 dark:bg-surface-700 rounded-lg accent-primary-500 cursor-pointer"
                            onMouseUp={(e) => updateProgressMutation.mutate(Number(e.target.value))}
                            onTouchEnd={(e) => updateProgressMutation.mutate(Number(e.target.value))}
                        />
                        <span className="text-sm font-medium text-gray-500 w-10 text-right">{project.progress || 0}%</span>
                    </div>
                </div>
            )}

            {/* Status Actions */}
            {(isAdmin || isDev) && project.status !== 'completed' && project.status !== 'cancelled' && (
                <div className="card dark:bg-surface-800 dark:border-surface-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Update Status</h2>
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
            <div className="card dark:bg-surface-800 dark:border-surface-700">
                <button
                    onClick={() => setShowMessages(!showMessages)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-primary-500" /> Messages
                    </h2>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showMessages ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showMessages && (
                    <div className="mt-4 border-t border-gray-100 dark:border-surface-700 pt-4">
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
                                                : 'bg-gray-100 dark:bg-surface-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
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
