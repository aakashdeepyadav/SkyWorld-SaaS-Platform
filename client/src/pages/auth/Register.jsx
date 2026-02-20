import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return;
    setLoading(true);
    try {
      await register(formData.email, formData.password, formData.name);
      navigate('/dashboard');
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid email profile`;
    window.location.href = googleAuthUrl;
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { width: '0%', color: 'bg-gray-200', label: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = {
      0: { width: '0%', color: 'bg-gray-200', label: '' },
      1: { width: '25%', color: 'bg-red-400', label: 'Weak' },
      2: { width: '50%', color: 'bg-amber-400', label: 'Fair' },
      3: { width: '75%', color: 'bg-primary-500', label: 'Good' },
      4: { width: '100%', color: 'bg-emerald-500', label: 'Strong' },
    };
    return map[score];
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-surface-900 relative">
        <div className="flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="SkyWorld" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-white">SkyWorld</span>
          </div>

          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug">
              Start building
              <br />
              something great.
            </h1>
            <p className="text-gray-400 mt-4 max-w-sm leading-relaxed">
              Join businesses who trust SkyWorld for their digital projects.
            </p>
          </div>

          <p className="text-gray-600 text-sm">&copy; 2026 SkyWorld Ventures</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center space-x-2 mb-10">
            <img src="/logo.png" alt="SkyWorld" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-gray-900">SkyWorld</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-1.5 text-sm text-gray-500">Get started with your free account.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input id="name" name="name" type="text" required
                className="input-field" placeholder="John Doe"
                value={formData.name} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required
                className="input-field" placeholder="you@example.com"
                value={formData.email} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" name="password" type="password" required
                className="input-field" placeholder="••••••••"
                value={formData.password} onChange={handleChange} />
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                  </div>
                  <span className="text-xs text-gray-400 w-12">{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required
                className="input-field" placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange} />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start pt-1">
              <input id="terms" type="checkbox" required className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded" />
              <label htmlFor="terms" className="ml-2 text-xs text-gray-500">
                I agree to the <Link to="/terms" className="text-primary-600">Terms</Link> and <Link to="/privacy" className="text-primary-600">Privacy Policy</Link>
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">or</span></div>
            </div>

            <button type="button" onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
