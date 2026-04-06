import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import AuthLayout from './AuthLayout';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setIsValid(false);
      toast.error('Invalid reset link');
    } else {
      setToken(resetToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password', { token, password });

      if (data.success) {
        setSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValid) {
    return (
      <AuthLayout
        heading="Something went wrong"
        subtext="The reset link appears to be invalid or expired."
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2>Invalid Reset Link</h2>
          <p className="text-gray-600 mt-2 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center px-5 py-2.5 btn-primary rounded-xl"
          >
            Request New Reset Link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        heading="All set!"
        subtext="Your password has been updated. Redirecting you to login."
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2>Password Reset!</h2>
          <p className="text-gray-600 mt-2 mb-6">
            Your password has been successfully reset. You will be redirected to login shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading={<>Create your new<br />password</>}
      subtext="Choose a strong password for your SkyWorld account."
      footerText="Remember your password?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      <h2>Reset Password</h2>
      <p>Enter your new password below.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="input-field mt-1"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="input-field mt-1"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
