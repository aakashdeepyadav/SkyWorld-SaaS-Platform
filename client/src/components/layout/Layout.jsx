import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const mainNavigation = [
    { name: 'Dashboard', href: `/dashboard/${user?.role}`, icon: HomeIcon },
    ...(user?.role !== 'developer' ? [{ name: 'Custom Requests', href: '/custom-requests', icon: DocumentTextIcon }] : []),
    { name: 'Requests', href: '/requests', icon: ClipboardDocumentListIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon },
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
        <img src="/logo.png" alt="SkyWorld" className="w-8 h-8 object-contain" />
        <span className="ml-3 text-xl font-bold text-white tracking-tight">SkyWorld</span>
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
              <button className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                <BellIcon className="w-5 h-5" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
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
