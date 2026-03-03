import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Command Palette — opens with Ctrl+K / Cmd+K.
 * Provides quick navigation to any page in the dashboard.
 */
const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  // All navigable routes
  const allCommands = useMemo(
    () =>
      [
        { name: 'Dashboard', path: `/dashboard/${user?.role || 'client'}`, section: 'Navigation' },
        { name: 'Requests', path: '/requests', section: 'Navigation' },
        { name: 'Projects', path: '/projects', section: 'Navigation' },
        {
          name: 'Requests',
          path: '/custom-requests',
          section: 'Navigation',
          hidden: user?.role === 'developer',
        },
        {
          name: 'Payments',
          path: '/payments',
          section: 'Navigation',
          hidden: user?.role === 'developer',
        },
        {
          name: 'New Request',
          path: '/requests/new',
          section: 'Actions',
          hidden: user?.role === 'developer',
        },
        {
          name: 'New Request (Plan Picker)',
          path: '/request',
          section: 'Actions',
          hidden: user?.role === 'developer',
        },
        { name: 'Profile', path: '/profile', section: 'Account' },
        { name: 'Settings', path: '/settings', section: 'Account' },
        ...(isAdmin
          ? [
              { name: 'User Management', path: '/admin/users', section: 'Admin' },
              { name: 'Service Management', path: '/admin/services', section: 'Admin' },
            ]
          : []),
      ].filter((c) => !c.hidden),
    [user]
  );

  const filtered = useMemo(() => {
    if (!query) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, allCommands]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation in list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].path);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-surface-700 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center px-4 border-b border-gray-100 dark:border-surface-700">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages..."
              className="w-full px-3 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
            />
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-surface-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
              ESC
            </span>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No results found</div>
            ) : (
              filtered.map((cmd, i) => (
                <button
                  key={cmd.path}
                  onClick={() => {
                    navigate(cmd.path);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    i === selectedIndex
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700'
                  }`}
                >
                  <span className="font-medium">{cmd.name}</span>
                  <span className="text-xs text-gray-400">{cmd.section}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-surface-700 text-[10px] text-gray-400">
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 dark:bg-surface-700 px-1 rounded font-mono">↑↓</span>
              <span>Navigate</span>
              <span className="bg-gray-100 dark:bg-surface-700 px-1 rounded font-mono">↵</span>
              <span>Select</span>
            </div>
            <span className="bg-gray-100 dark:bg-surface-700 px-1 rounded font-mono">⌘K</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
