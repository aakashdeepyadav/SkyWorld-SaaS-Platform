import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

const GENERIC_RESET_MESSAGE = 'If an account exists and supports password login, a reset link has been sent.';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [didSendLink, setDidSendLink] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });

      if (data.success) {
        setSubmitted(true);
        setSubmittedMessage(data.message || GENERIC_RESET_MESSAGE);
        setDidSendLink(Boolean(data.emailSent));
        toast.success(data.message || GENERIC_RESET_MESSAGE);
      } else {
        toast.error(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-[45%] bg-surface-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 80%, rgba(14,165,233,.08) 0%, transparent 60%)' }} />
          <div className="absolute top-0 right-0 w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(14,165,233,.05) 0%, transparent 70%)' }} />
          <div className="flex flex-col justify-between p-12 xl:p-16 w-full relative z-10">
            <div className="flex items-center">
              <img src="/wordmark_logo_white_fullname.png" alt="SkyWorld Ventures" className="h-9 w-auto object-contain" />
            </div>

            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug">
                Check your email
              </h1>
              <p className="text-gray-400 mt-4 max-w-sm leading-relaxed">
                Use the latest reset email if multiple requests were made.
              </p>
            </div>

            <p className="text-gray-600 text-sm">&copy; 2026 SkyWorld Ventures</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 bg-white">
          <div className="w-full max-w-sm text-center">
            <div className="lg:hidden flex items-center justify-center mb-10">
              <img src="/wordmark_logo_coloured_.png" alt="SkyWorld" className="h-7 w-auto object-contain" />
            </div>

            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {didSendLink ? 'Email Sent' : 'Request Received'}
              </h2>
              <p className="text-gray-600 mb-3">{submittedMessage || GENERIC_RESET_MESSAGE}</p>
              {didSendLink && (
                <p className="text-gray-600">
                  Sent to: <span className="font-medium text-gray-900">{email}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Next Steps</h3>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>- Check inbox, spam, and promotions</li>
                  <li>- Use the latest reset email only</li>
                  <li>- Link expires in 10 minutes</li>
                </ul>
              </div>

              <div className="text-sm text-gray-500">
                <p>Did not receive anything?</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] bg-surface-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 80%, rgba(14,165,233,.08) 0%, transparent 60%)' }} />
        <div className="absolute top-0 right-0 w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(14,165,233,.05) 0%, transparent 70%)' }} />
        <div className="flex flex-col justify-between p-12 xl:p-16 w-full relative z-10">
          <div className="flex items-center">
            <img src="/wordmark_logo_white_fullname.png" alt="SkyWorld Ventures" className="h-9 w-auto object-contain" />
          </div>

          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug">
              Reset your
              <br />
              password
            </h1>
            <p className="text-gray-400 mt-4 max-w-sm leading-relaxed">
              Enter your email address and we will process a reset request.
            </p>
          </div>

          <p className="text-gray-600 text-sm">&copy; 2026 SkyWorld Ventures</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center mb-10">
            <img src="/wordmark_logo_coloured_.png" alt="SkyWorld" className="h-7 w-auto object-contain" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Enter your email to receive reset instructions.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
