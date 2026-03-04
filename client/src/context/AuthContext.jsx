import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const hasSession = localStorage.getItem('hasSession');
    if (!hasSession) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('hasSession');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for auth:expired from api interceptor
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      localStorage.removeItem('hasSession');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      localStorage.setItem('hasSession', 'true');
      toast.success('Login successful');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      if (response.data?.requiresOtp) {
        toast.success(response.data.message || 'OTP sent to your email');
        return response.data;
      }
      setUser(response.data.user);
      localStorage.setItem('hasSession', 'true');
      toast.success('Registration successful');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async (email, otp, purpose) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp, purpose });
      setUser(response.data.user);
      localStorage.setItem('hasSession', 'true');
      toast.success(response.data.message || 'Verification successful');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
      throw error;
    }
  }, []);

  const resendOtp = useCallback(async (email, purpose) => {
    try {
      const response = await api.post('/auth/resend-otp', { email, purpose });
      toast.success(response.data.message || 'OTP resent');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
      throw error;
    }
  }, []);

  const googleLogin = useCallback(async (code) => {
    try {
      const response = await api.post('/auth/google', { code });
      setUser(response.data.user);
      localStorage.setItem('hasSession', 'true');
      toast.success('Google login successful');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Logged out successfully');
    } catch (error) {
      // Server unreachable — still clean up locally
    } finally {
      setUser(null);
      localStorage.removeItem('hasSession');
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    verifyOtp,
    resendOtp,
    googleLogin,
    logout,
    updateUser,
    checkAuth,
  }), [user, loading, login, register, verifyOtp, resendOtp, googleLogin, logout, updateUser, checkAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

