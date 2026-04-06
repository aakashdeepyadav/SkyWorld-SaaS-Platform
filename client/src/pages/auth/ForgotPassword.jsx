import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import AuthLayout from './AuthLayout';

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
        setSubmittedMessage(data.message || 'Reset link sent to your email');
        setDidSendLink(Boolean(data.emailSent));
        toast.success(data.message || 'Reset link sent to your email');
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
      <AuthLayout
        heading="Check your email"
        subtext="Use the latest reset email if multiple requests were made."
        footerText="Remember your password?"
        footerLink="/login"
        footerLabel="Sign in"
      >
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2>{didSendLink ? 'Email Sent' : 'Request Received'}</h2>
            <p className="text-gray-600 mt-2 mb-3">{submittedMessage}</p>
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
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading={<>Reset your<br />password</>}
      subtext="Enter your email address and we will process a reset request."
      footerText="Remember your password?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      <h2>Forgot Password?</h2>
      <p>Enter your email to receive reset instructions.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field mt-1"
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
    </AuthLayout>
  );
};

export default ForgotPassword;
