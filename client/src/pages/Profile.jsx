import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { CameraIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        company: user?.company || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/users/profile/me', formData);
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

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be smaller than 5MB');
            return;
        }

        setAvatarLoading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await api.post('/files/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            updateUser(response.data.user);
            toast.success('Profile photo updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Image upload service unavailable. Please try again later.');
        } finally {
            setAvatarLoading(false);
            // Reset file input so user can re-select the same file
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <div className="relative">
                <div className="h-36 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl" />
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 px-6 -mt-12 relative z-10">
                    {/* Avatar with upload */}
                    <div className="relative group">
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
                                alt={user.name}
                                className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white dark:border-surface-800 ring-2 ring-primary-500/20"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white dark:border-surface-800 ring-2 ring-primary-500/20">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarLoading}
                            className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
                            title="Change photo"
                        >
                            {avatarLoading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <CameraIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            )}
                        </button>
                    </div>
                    <div className="flex-1 pb-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => setEditing(!editing)}
                        className={editing ? 'btn-secondary' : 'btn-primary'}
                    >
                        {editing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Personal Info */}
                <div className="lg:col-span-2 card">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Personal Information</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Full Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    className={`input-field ${!editing && 'bg-gray-50 dark:bg-surface-900/50 cursor-not-allowed'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <input
                                        value={user?.email || ''}
                                        disabled
                                        className="input-field pl-10 bg-gray-50 dark:bg-surface-900/50 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Phone</label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Enter phone number"
                                        className={`input-field pl-10 ${!editing && 'bg-gray-50 dark:bg-surface-900/50 cursor-not-allowed'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Company</label>
                                <div className="relative">
                                    <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <input
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Enter company name"
                                        className={`input-field pl-10 ${!editing && 'bg-gray-50 dark:bg-surface-900/50 cursor-not-allowed'}`}
                                    />
                                </div>
                            </div>
                        </div>
                        {editing && (
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Account Details */}
                <div className="card h-fit">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Account</h2>
                    <div className="space-y-3">
                        <div className="flex items-center p-3 bg-gray-50 dark:bg-surface-900/50 rounded-xl border border-gray-100 dark:border-surface-700/50">
                            <ShieldCheckIcon className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                                <p className="font-semibold text-gray-900 dark:text-white capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 dark:bg-surface-900/50 rounded-xl border border-gray-100 dark:border-surface-700/50">
                            <div className={`w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0 ${user?.isActive !== false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                <p className="font-semibold text-gray-900 dark:text-white capitalize">{user?.isActive !== false ? 'Active' : 'Inactive'}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 dark:bg-surface-900/50 rounded-xl border border-gray-100 dark:border-surface-700/50">
                            <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 dark:bg-surface-900/50 rounded-xl border border-gray-100 dark:border-surface-700/50">
                            <div className="w-5 h-5 mr-3 flex items-center justify-center flex-shrink-0">
                                {user?.authMethod === 'google' ? (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                ) : (
                                    <EnvelopeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Auth Method</p>
                                <p className="font-semibold text-gray-900 dark:text-white capitalize">{user?.authMethod || 'Email'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
