import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowUpTrayIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CameraIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const ROLE_META = {
  admin: {
    label: 'Administrator',
    subtitle: 'Platform governance and access control.',
    badgeClass: 'badge-danger',
  },
  developer: {
    label: 'Developer',
    subtitle: 'Delivery operations and project execution.',
    badgeClass: 'badge-primary',
  },
  client: {
    label: 'Client',
    subtitle: 'Business profile used for service delivery.',
    badgeClass: 'badge-success',
  },
};

const getInitialFormData = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  company: user?.company || '',
});

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(() => getInitialFormData(user));

  useEffect(() => {
    setFormData(getInitialFormData(user));
  }, [user?.name, user?.phone, user?.company]);

  const normalizedFormData = useMemo(
    () => ({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
    }),
    [formData]
  );

  const hasChanges = useMemo(
    () =>
      normalizedFormData.name !== (user?.name || '') ||
      normalizedFormData.phone !== (user?.phone || '') ||
      normalizedFormData.company !== (user?.company || ''),
    [normalizedFormData, user?.company, user?.name, user?.phone]
  );

  const roleMeta = ROLE_META[user?.role] || {
    label: user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'User',
    subtitle: 'Account profile information.',
    badgeClass: 'badge-primary',
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditToggle = () => {
    if (editing) {
      setFormData(getInitialFormData(user));
    }
    setEditing((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!normalizedFormData.name) {
      toast.error('Full name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile/me', normalizedFormData);
      updateUser(response.data.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setAvatarLoading(true);
    try {
      const avatarFormData = new FormData();
      avatarFormData.append('avatar', file);
      const response = await api.post('/files/avatar', avatarFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(response.data.user);
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Image upload service unavailable. Please try again later.'
      );
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const inputReadOnlyClasses =
    'bg-gray-50 dark:bg-surface-900/50 cursor-not-allowed text-gray-500 dark:text-gray-400';

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-card dark:border-surface-700 dark:bg-surface-800/80">
        <div className="relative h-32">
          {/* Hero banner background */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface-900 via-surface-800 to-primary-700" />
          {/* Brand overlay gradient for extra depth */}
          <div className="absolute inset-0 opacity-25 bg-hero-pattern" />
          {/* Soft glows */}
          <div className="absolute -top-10 left-8 h-44 w-44 rounded-full bg-primary-400/25 blur-3xl" />
          <div className="absolute -bottom-14 right-10 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
          {/* Fade into card body so the content feels anchored */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white dark:to-surface-800" />
        </div>
        <div className="px-5 pb-7 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'Profile avatar'}
                    className="h-24 w-24 rounded-2xl object-cover border-4 border-white dark:border-surface-800 shadow-card"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl border-4 border-white dark:border-surface-800 bg-gradient-to-br from-primary-600 to-primary-400 text-white shadow-card flex items-center justify-center text-3xl font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute -right-2 -bottom-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-70 dark:border-surface-600 dark:bg-surface-800 dark:text-gray-300 dark:hover:bg-surface-700"
                  title="Upload profile photo"
                >
                  {avatarLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  ) : (
                    <CameraIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="pb-0.5">
                <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur shadow-card dark:border-surface-700/50 dark:bg-surface-800/55">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.name || 'Profile'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {user?.userCode && (
                      <span className="font-medium text-gray-600 dark:text-gray-300 mr-2">
                        {user.userCode}
                      </span>
                    )}
                    {user?.email}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{roleMeta.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEditToggle}
                className={editing ? 'btn-secondary !py-2 !px-4' : 'btn-primary !py-2 !px-4'}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
              {editing && (
                <button
                  type="submit"
                  form="profile-form"
                  disabled={loading || !hasChanges}
                  className="btn-primary !py-2 !px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className={`${roleMeta.badgeClass} !text-[11px]`}>{roleMeta.label}</span>
            <span
              className={`${user?.isActive !== false ? 'badge-success' : 'badge-danger'} !text-[11px]`}
            >
              {user?.isActive !== false ? 'Active Account' : 'Inactive Account'}
            </span>
            <span className="badge !text-[11px] bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-surface-700/70 dark:text-gray-300 dark:ring-surface-600">
              {user?.authMethod === 'google' ? 'Google Sign-In' : 'Email Sign-In'}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="card !p-0 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Maintain your personal and organization details used across SkyWorld.
            </p>
          </div>

          <form id="profile-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    maxLength={50}
                    className={`input-field pl-10 ${!editing ? inputReadOnlyClasses : ''}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className={`input-field pl-10 ${inputReadOnlyClasses}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone
                </label>
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    maxLength={20}
                    placeholder="+12025550123"
                    className={`input-field pl-10 ${!editing ? inputReadOnlyClasses : ''}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Company
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={!editing}
                    maxLength={100}
                    placeholder="Your organization"
                    className={`input-field pl-10 ${!editing ? inputReadOnlyClasses : ''}`}
                  />
                </div>
              </div>
            </div>

            {editing && !hasChanges && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No changes detected. Update one or more fields to enable saving.
              </p>
            )}
          </form>
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Account Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-surface-700/60 dark:bg-surface-900/40">
                <ShieldCheckIcon className="h-5 w-5 text-primary-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Role
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {roleMeta.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-surface-700/60 dark:bg-surface-900/40">
                <CheckBadgeIcon
                  className={`h-5 w-5 ${user?.isActive !== false ? 'text-emerald-500' : 'text-red-500'}`}
                />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.isActive !== false ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-surface-700/60 dark:bg-surface-900/40">
                <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Member Since
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {memberSince}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-surface-700/60 dark:bg-surface-900/40">
                <ArrowUpTrayIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    2FA
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card border-primary-100 dark:border-primary-500/20">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Security Controls
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage password, notifications, and account safety settings.
            </p>
            <Link
              to="/settings?tab=security"
              className="btn-secondary mt-4 inline-flex items-center gap-2 !px-4 !py-2"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              Open Settings
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
