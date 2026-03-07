import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { LockClosedIcon, BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const VALID_TABS = ['security', 'notifications', 'danger'];

const Settings = () => {
    const { user, logout, updateUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'security';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [notifications, setNotifications] = useState({
        email: user?.notificationPreferences?.email ?? true,
        projectUpdates: user?.notificationPreferences?.projectUpdates ?? true,
        marketing: user?.notificationPreferences?.marketing ?? false,
    });
    const [notifLoading, setNotifLoading] = useState(false);
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [disable2FAPassword, setDisable2FAPassword] = useState('');
    const [twoFactorSetup, setTwoFactorSetup] = useState({
        qrCode: '',
        secret: '',
        token: '',
        backupCodes: [],
    });

    const resetTwoFactorSetupState = () => {
        setTwoFactorSetup({ qrCode: '', secret: '', token: '', backupCodes: [] });
    };

    const startTwoFactorSetup = async () => {
        setTwoFactorLoading(true);
        try {
            const response = await api.post('/auth/2fa/setup');
            setTwoFactorSetup({
                qrCode: response.data?.data?.qrCode || '',
                secret: response.data?.data?.secret || '',
                token: '',
                backupCodes: [],
            });
            toast.success('Scan the QR code and verify with your authenticator app');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start 2FA setup');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const verifyTwoFactorSetup = async (e) => {
        e.preventDefault();
        if (!twoFactorSetup.token.trim()) {
            toast.error('Enter the 6-digit authenticator code');
            return;
        }
        setTwoFactorLoading(true);
        try {
            const response = await api.post('/auth/2fa/verify-setup', {
                token: twoFactorSetup.token.trim(),
            });
            const backupCodes = response.data?.data?.backupCodes || [];
            setTwoFactorSetup((prev) => ({
                ...prev,
                token: '',
                backupCodes,
            }));
            if (user) {
                updateUser({ ...user, twoFactorEnabled: true });
            }
            toast.success('Two-factor authentication enabled');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to verify 2FA setup');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const copyBackupCodes = async () => {
        if (!twoFactorSetup.backupCodes.length) return;
        try {
            await navigator.clipboard.writeText(twoFactorSetup.backupCodes.join('\n'));
            toast.success('Backup codes copied');
        } catch {
            toast.error('Failed to copy backup codes');
        }
    };

    const handleDisableTwoFactor = async () => {
        if (!disable2FAPassword.trim()) {
            toast.error('Password is required to disable 2FA');
            return;
        }
        setTwoFactorLoading(true);
        try {
            await api.post('/auth/2fa/disable', { password: disable2FAPassword.trim() });
            if (user) {
                updateUser({ ...user, twoFactorEnabled: false });
            }
            setDisable2FAPassword('');
            resetTwoFactorSetupState();
            toast.success('Two-factor authentication disabled');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New password and confirmation do not match');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        if (!/[A-Z]/.test(passwordData.newPassword) || !/[a-z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
            toast.error('New password must include uppercase, lowercase, number, and special character');
            return;
        }
        if (passwordData.currentPassword === passwordData.newPassword) {
            toast.error('New password must be different from current password');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword.trim(),
                newPassword: passwordData.newPassword.trim(),
            });
            toast.success('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            const data = error.response?.data;
            const msg =
                data?.message ||
                (Array.isArray(data?.errors) && data.errors[0]?.message) ||
                'Failed to change password';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
            try {
                await api.delete('/auth/account');
                await logout();
                toast.success('Account deleted');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete account');
            }
        }
    };

    const tabs = [
        { id: 'security', label: 'Security', icon: LockClosedIcon },
        { id: 'notifications', label: 'Notifications', icon: BellIcon },
        { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon },
    ];

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
        if (!tabParam && activeTab !== 'security') {
            setActiveTab('security');
        }
    }, [searchParams, activeTab]);

    const handleTabSelect = (tabId) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams);
        if (tabId === 'security') {
            params.delete('tab');
        } else {
            params.set('tab', tabId);
        }
        setSearchParams(params, { replace: true });
    };

    const Toggle = ({ checked, onChange, label, desc }) => (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
                {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-primary-500' : 'bg-gray-200 dark:bg-surface-700'
                    }`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'
                    }`} />
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tab navigation */}
                <div className="lg:w-56 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabSelect(tab.id)}
                                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-surface-800'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                                    }`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab content */}
                <div className="flex-1">
                    {/* Security */}
                    {activeTab === 'security' && (
                        <div className="card">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Security</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your password and account security</p>

                            {user?.authMethod === 'google' ? (
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-start">
                                    <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-blue-900 dark:text-blue-300 text-sm">Google Account</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Your account is linked to Google. Password is managed through your Google account.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="input-field"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="input-field"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="input-field"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-surface-700">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Two-factor authentication</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Add an authenticator app code for an extra layer of account security.
                                </p>

                                {user?.authMethod === 'google' ? (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-surface-800 rounded-xl border border-gray-100 dark:border-surface-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            2FA setup is currently available for email-password login accounts.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-surface-800 rounded-xl border border-gray-100 dark:border-surface-700">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        Status: {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {user?.twoFactorEnabled
                                                            ? 'Your login requires a 2FA verification code.'
                                                            : 'Enable 2FA to protect your account from unauthorized access.'}
                                                    </p>
                                                </div>
                                                {!user?.twoFactorEnabled && !twoFactorSetup.qrCode && (
                                                    <button
                                                        type="button"
                                                        onClick={startTwoFactorSetup}
                                                        disabled={twoFactorLoading}
                                                        className="btn-primary !py-2 !px-4 disabled:opacity-50"
                                                    >
                                                        {twoFactorLoading ? 'Starting...' : 'Enable 2FA'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {!user?.twoFactorEnabled && twoFactorSetup.qrCode && (
                                            <div className="mt-4 p-4 border border-gray-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Step 1: Scan QR code</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Use Google Authenticator, Microsoft Authenticator, or Authy.
                                                </p>
                                                <div className="mt-3 flex flex-col sm:flex-row gap-4 items-start">
                                                    <img
                                                        src={twoFactorSetup.qrCode}
                                                        alt="2FA setup QR code"
                                                        className="w-40 h-40 rounded-lg border border-gray-200 dark:border-surface-700 bg-white p-2"
                                                    />
                                                    <div className="text-xs text-gray-600 dark:text-gray-300">
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Manual setup key</p>
                                                        <code className="block px-3 py-2 rounded bg-gray-100 dark:bg-surface-900 break-all">
                                                            {twoFactorSetup.secret}
                                                        </code>
                                                    </div>
                                                </div>

                                                <form onSubmit={verifyTwoFactorSetup} className="mt-4 flex flex-col sm:flex-row gap-3">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        className="input-field sm:max-w-[220px] tracking-[0.25em] text-center"
                                                        placeholder="000000"
                                                        value={twoFactorSetup.token}
                                                        onChange={(e) =>
                                                            setTwoFactorSetup((prev) => ({
                                                                ...prev,
                                                                token: e.target.value.replace(/\D/g, ''),
                                                            }))
                                                        }
                                                        required
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={twoFactorLoading}
                                                        className="btn-primary !py-2.5 !px-4 disabled:opacity-50"
                                                    >
                                                        {twoFactorLoading ? 'Verifying...' : 'Verify and enable'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={resetTwoFactorSetupState}
                                                        className="btn-secondary !py-2.5 !px-4"
                                                    >
                                                        Cancel
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                        {user?.twoFactorEnabled && (
                                            <div className="mt-4 p-4 border border-gray-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Disable 2FA</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Confirm your current account password to disable two-factor authentication.
                                                </p>
                                                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                                                    <input
                                                        type="password"
                                                        className="input-field sm:max-w-[280px]"
                                                        placeholder="Current password"
                                                        value={disable2FAPassword}
                                                        onChange={(e) => setDisable2FAPassword(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleDisableTwoFactor}
                                                        disabled={twoFactorLoading}
                                                        className="btn-danger !py-2.5 !px-4 disabled:opacity-50"
                                                    >
                                                        {twoFactorLoading ? 'Disabling...' : 'Disable 2FA'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {twoFactorSetup.backupCodes.length > 0 && (
                                            <div className="mt-4 p-4 border border-amber-200 dark:border-amber-500/30 rounded-xl bg-amber-50/80 dark:bg-amber-500/10">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                                                        Save these backup codes now
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={copyBackupCodes}
                                                        className="btn-secondary !py-1.5 !px-3 !text-xs"
                                                    >
                                                        Copy codes
                                                    </button>
                                                </div>
                                                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
                                                    Each code can be used once if you lose access to your authenticator app.
                                                </p>
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    {twoFactorSetup.backupCodes.map((code) => (
                                                        <code key={code} className="px-3 py-2 rounded bg-white/80 dark:bg-surface-900 text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                            {code}
                                                        </code>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <div className="card">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Notifications</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose what notifications you receive</p>

                            <div className="divide-y divide-gray-100 dark:divide-surface-700">
                                <Toggle
                                    checked={notifications.email}
                                    onChange={(v) => setNotifications({ ...notifications, email: v })}
                                    label="Email notifications"
                                    desc="Receive important updates via email"
                                />
                                <Toggle
                                    checked={notifications.projectUpdates}
                                    onChange={(v) => setNotifications({ ...notifications, projectUpdates: v })}
                                    label="Project updates"
                                    desc="Get notified when project status changes"
                                />
                                <Toggle
                                    checked={notifications.marketing}
                                    onChange={(v) => setNotifications({ ...notifications, marketing: v })}
                                    label="Marketing emails"
                                    desc="Receive tips, offers, and product updates"
                                />
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-surface-700">
                                <button
                                    className="btn-primary disabled:opacity-50"
                                    disabled={notifLoading}
                                    onClick={async () => {
                                        setNotifLoading(true);
                                        try {
                                            const response = await api.put('/users/profile/me', { notificationPreferences: notifications });
                                            updateUser(response.data.user);
                                            toast.success('Preferences saved');
                                        } catch (error) {
                                            toast.error(error.response?.data?.message || 'Failed to save preferences');
                                        } finally {
                                            setNotifLoading(false);
                                        }
                                    }}
                                >
                                    {notifLoading ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    {activeTab === 'danger' && (
                        <div className="card border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5">
                            <h2 className="text-lg font-bold text-red-900 dark:text-red-400 mb-1">Danger Zone</h2>
                            <p className="text-sm text-red-600/70 dark:text-red-400/60 mb-6">Irreversible and destructive actions</p>

                            <div className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-red-200 dark:border-red-500/20">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Delete Account</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Permanently delete your account and all associated data. This cannot be undone.
                                        </p>
                                    </div>
                                    <button onClick={handleDeleteAccount} className="btn-danger !text-sm !py-2 !px-4 ml-4 flex-shrink-0">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Settings;
