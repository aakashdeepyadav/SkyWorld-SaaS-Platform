import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  CreditCardIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const prettifyStatus = (status) => status?.replace(/-/g, ' ') || 'updated';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const websiteUrl = import.meta.env.VITE_WEBSITE_URL || '/website';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isDeveloper = user?.role === 'developer';

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useQuery(
    ['header-notifications', user?._id, user?.role],
    async () => {
      const requests = [
        api.get('/projects?limit=5'),
        api.get('/requests?limit=5')
      ];

      if (!isDeveloper) {
        requests.push(api.get('/custom-requests?limit=5'));
      }

      const results = await Promise.allSettled(requests);
      const activity = [];

      const projects = results[0]?.status === 'fulfilled' ? results[0].value?.data?.projects || [] : [];
      projects.forEach((project) => {
        activity.push({
          id: `project-${project._id}`,
          title: project.title || 'Project update',
          message: `Project is ${prettifyStatus(project.status)}`,
          href: `/projects/${project._id}`,
          timestamp: project.updatedAt || project.createdAt
        });
      });

      const serviceRequests = results[1]?.status === 'fulfilled' ? results[1].value?.data?.requests || [] : [];
      serviceRequests.forEach((request) => {
        activity.push({
          id: `request-${request._id}`,
          title: request.title || request.serviceId?.name || 'Service request',
          message: `Request is ${prettifyStatus(request.status)}`,
          href: `/requests/${request._id}`,
          timestamp: request.updatedAt || request.createdAt
        });
      });

      if (!isDeveloper) {
        const customRequests = results[2]?.status === 'fulfilled' ? results[2].value?.data?.requests || [] : [];
        customRequests.forEach((request) => {
          const serviceType = request.serviceType?.replace(/-/g, ' ') || 'custom';
          activity.push({
            id: `custom-${request._id}`,
            title: `${serviceType} request`,
            message: `Status is ${prettifyStatus(request.status)}`,
            href: '/custom-requests',
            timestamp: request.updatedAt || request.createdAt
          });
        });
      }

      activity.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      return activity.slice(0, 8);
    },
    {
      enabled: false,
      staleTime: 30000
    }
  );

  const unreadCount = useMemo(() => {
    const now = Date.now();
    return notifications.filter((item) => {
      const ts = new Date(item.timestamp).getTime();
      return !Number.isNaN(ts) && now - ts <= 24 * 60 * 60 * 1000;
    }).length;
  }, [notifications]);

  useEffect(() => {
    setNotificationOpen(false);
  }, [location.pathname, location.search]);

  const toggleNotifications = () => {
    setNotificationOpen((prev) => {
      const next = !prev;
      if (next) refetchNotifications();
      return next;
    });
  };

  const mainNavigation = [
    { name: 'Dashboard', href: `/dashboard/${user?.role}`, icon: HomeIcon },
    ...(user?.role !== 'developer' ? [{ name: 'Custom Requests', href: '/custom-requests', icon: DocumentTextIcon }] : []),
    { name: 'Requests', href: '/requests', icon: ClipboardDocumentListIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    ...(user?.role !== 'developer' ? [{ name: 'Payments', href: '/payments', icon: CreditCardIcon }] : []),
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Services', href: '/admin/services', icon: WrenchScrewdriverIcon },
  ];

  const accountNavigation = [
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (href) => location.pathname === href || (href !== `/dashboard/${user?.role}` && location.pathname.startsWith(href));

  const NavSection = ({ label, items }) => (
    <div className="mb-2">
      {label && (
        <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">{label}</p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive(item.href)
              ? 'bg-primary-500/20 text-primary-400 shadow-glow/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive(item.href) ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'
              }`} />
            {item.name}
            {isActive(item.href) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );

  // Get the current page title
  const getPageTitle = () => {
    const allItems = [...mainNavigation, ...adminNavigation, ...accountNavigation];
    const active = allItems.find(n => isActive(n.href));
    if (active) return active.name;

    if (location.pathname.startsWith('/requests/new')) return 'New Request';
    if (location.pathname.startsWith('/requests/')) return 'Request Detail';
    if (location.pathname.startsWith('/custom-requests')) return 'Custom Requests';
    if (location.pathname.startsWith('/projects/')) return 'Project Detail';
    return 'Dashboard';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 h-16 border-b border-white/10">
        <a href={websiteUrl} className="flex items-center" title="Go to SkyWorld website">
          <img src="/logo.png" alt="SkyWorld" className="w-8 h-8 object-contain" />
          <span className="ml-3 text-xl font-bold text-white tracking-tight">SkyWorld</span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <NavSection items={mainNavigation} />
        {isAdmin && <NavSection label="Admin" items={adminNavigation} />}
        <NavSection label="Account" items={accountNavigation} />
      </nav>

      {/* User info */}
      <div className="p-4 mx-3 mb-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center mb-3">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'User avatar'}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface-900" />
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-sidebar-gradient z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors mr-3"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getPageTitle()}
                </h2>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                  aria-label="Open notifications"
                  aria-expanded={notificationOpen}
                >
                  <BellIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] leading-[18px] text-white font-semibold text-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                      <Link
                        to="/settings?tab=notifications"
                        className="text-xs font-medium text-primary-600 hover:text-primary-500"
                        onClick={() => setNotificationOpen(false)}
                      >
                        Preferences
                      </Link>
                    </div>

                    {notificationsLoading ? (
                      <div className="px-4 py-6 text-sm text-gray-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500">No recent updates yet.</div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((item) => (
                          <Link
                            key={item.id}
                            to={item.href}
                            onClick={() => setNotificationOpen(false)}
                            className="block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{formatRelativeTime(item.timestamp)}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User avatar'}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
