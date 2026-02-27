import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';

const ICON_MAP = {
    request_status: '📋',
    project_update: '🔧',
    payment_received: '💳',
    message_received: '💬',
    developer_assigned: '👨‍💻',
    custom_request: '📄',
    system: '📢',
};

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const NotificationBell = () => {
    const { notifications, unreadCount, markNotificationRead, markAllRead } = useSocket();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <BellIcon className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 min-w-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full leading-none px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-[420px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-[340px]">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-sm text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const Wrapper = n.link ? Link : 'div';
                                const wrapperProps = n.link
                                    ? { to: n.link, onClick: () => { markNotificationRead(n._id); setOpen(false); } }
                                    : { onClick: () => markNotificationRead(n._id) };

                                return (
                                    <Wrapper
                                        key={n._id}
                                        {...wrapperProps}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${n.read ? 'bg-white hover:bg-gray-50' : 'bg-primary-50/40 hover:bg-primary-50/70'
                                            } ${n.link ? 'block' : ''}`}
                                    >
                                        <span className="text-lg flex-shrink-0 mt-0.5">
                                            {ICON_MAP[n.type] || '🔔'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${n.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
                                            <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        {!n.read && (
                                            <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                                        )}
                                    </Wrapper>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
