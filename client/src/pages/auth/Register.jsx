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
    if (formData.password !== formData.confirmPassword) {
      return;
    }
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

  // Password strength
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
      1: { width: '25%', color: 'bg-red-500', label: 'Weak' },
      2: { width: '50%', color: 'bg-amber-500', label: 'Fair' },
      3: { width: '75%', color: 'bg-primary-500', label: 'Good' },
      4: { width: '100%', color: 'bg-emerald-500', label: 'Strong' },
    };
    return map[score];
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent-500/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center space-x-3 mb-8">
            <img src="/logo.png" alt="SkyWorld" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-white">SkyWorld</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Start building
            <br />
            <span className="text-primary-200">something great.</span>
          </h1>
          <p className="text-primary-100/80 text-lg max-w-md">
            Join thousands of businesses who trust SkyWorld for their digital projects.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            {[
              { value: '500+', label: 'Projects' },
              { value: '150+', label: 'Clients' },
              { value: '99%', label: 'Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-primary-200 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-surface-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src="/logo.png" alt="SkyWorld" className="w-10 h-10 object-contain" />
            <span className="ml-3 text-2xl font-bold text-gray-900">SkyWorld</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-gray-500">Get started with your free account today</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                id="name" name="name" type="text" required
                className="input-field" placeholder="John Doe"
                value={formData.name} onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="input-field" placeholder="you@example.com"
                value={formData.email} onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                id="password" name="password" type="password" required
                className="input-field" placeholder="••••••••"
                value={formData.password} onChange={handleChange}
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 mr-3 overflow-hidden">
                      <div className={`h-full rounded-full ${strength.color} transition-all duration-500`} style={{ width: strength.width }} />
                    </div>
                    <span className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password" required
                className="input-field" placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start pt-1">
              <input id="terms" type="checkbox" required className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-500">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-surface-50 text-gray-400 font-medium">or</span></div>
            </div>

            <button
              type="button" onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
