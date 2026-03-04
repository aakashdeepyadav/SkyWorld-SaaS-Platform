import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

/**
 * SocketProvider — connects to Socket.IO when user is authenticated,
 * manages real-time notifications, online presence, and provides
 * helper methods for project room management.
 */
export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications on mount
  useEffect(() => {
    if (!user) return;
    api
      .get('/notifications?limit=20')
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});
  }, [user]);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Determine server URL (same origin in production, explicit in dev)
    let serverUrl;
    const raw = import.meta.env.VITE_API_URL;
    try {
      serverUrl = raw && /^https?:\/\//i.test(raw) ? new URL(raw).origin : window.location.origin;
    } catch {
      serverUrl = window.location.origin;
    }

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Real-time notification
    socket.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  // Join a project room (for real-time messages)
  const joinProject = useCallback((projectId) => {
    socketRef.current?.emit('project:join', projectId);
  }, []);

  // Leave a project room
  const leaveProject = useCallback((projectId) => {
    socketRef.current?.emit('project:leave', projectId);
  }, []);

  // Typing indicator helpers
  const startTyping = useCallback((projectId) => {
    socketRef.current?.emit('typing:start', { projectId });
  }, []);

  const stopTyping = useCallback((projectId) => {
    socketRef.current?.emit('typing:stop', { projectId });
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* silent */
    }
  }, []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      notifications,
      unreadCount,
      joinProject,
      leaveProject,
      startTyping,
      stopTyping,
      markNotificationRead,
      markAllRead,
    }),
    [
      connected,
      notifications,
      unreadCount,
      joinProject,
      leaveProject,
      startTyping,
      stopTyping,
      markNotificationRead,
      markAllRead,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
