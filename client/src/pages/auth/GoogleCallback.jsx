import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const REDIRECT_DELAY_MS = 3000;

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('working');
  const [activeStep, setActiveStep] = useState(0);
  const [countdown, setCountdown] = useState(Math.floor(REDIRECT_DELAY_MS / 1000));

  const authIntent = useMemo(() => sessionStorage.getItem('googleAuthIntent') || 'login', []);

  const content = useMemo(() => {
    if (authIntent === 'register') {
      return {
        eyebrow: 'Google Sign Up',
        heading: 'Creating your SkyWorld access',
        description:
          'We are connecting your Google account, preparing your profile, and getting your workspace ready.',
        activeTitle: 'Finishing Google sign up',
        successTitle: 'Your account is ready',
        fallbackRoute: '/register',
        fallbackLabel: 'Back to sign up',
      };
    }

    return {
      eyebrow: 'Google Sign In',
      heading: 'Signing you into SkyWorld',
      description:
        'We are verifying your Google account, restoring your session, and preparing your workspace.',
      activeTitle: 'Finishing Google sign in',
      successTitle: 'You are signed in',
      fallbackRoute: '/login',
      fallbackLabel: 'Back to sign in',
    };
  }, [authIntent]);

  const steps = useMemo(
    () => [
      {
        icon: ShieldCheckIcon,
        title: 'Verifying Google account',
      },
      {
        icon: SparklesIcon,
        title: authIntent === 'register' ? 'Creating your profile' : 'Restoring your session',
      },
      {
        icon: CheckBadgeIcon,
        title: 'Preparing your dashboard',
      },
    ],
    [authIntent]
  );

  useEffect(() => {
    if (status !== 'working') return undefined;

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, [status, steps.length]);

  useEffect(() => {
    if (!error) return undefined;

    setCountdown(Math.floor(REDIRECT_DELAY_MS / 1000));
    const intervalId = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [error]);

  useEffect(() => {
    const clearGoogleAuthState = () => {
      sessionStorage.removeItem('postAuthRedirect');
      sessionStorage.removeItem('googleAuthIntent');
    };

    const redirectToFallback = () => {
      clearGoogleAuthState();
      navigate(content.fallbackRoute, { replace: true });
    };

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError('Google authentication was cancelled before completion.');
        window.setTimeout(redirectToFallback, REDIRECT_DELAY_MS);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code was returned from Google.');
        window.setTimeout(redirectToFallback, REDIRECT_DELAY_MS);
        return;
      }

      try {
        await googleLogin(code);
        const redirectTo = sessionStorage.getItem('postAuthRedirect') || '/dashboard';
        clearGoogleAuthState();
        setStatus('success');
        navigate(redirectTo, { replace: true });
      } catch (err) {
        clearGoogleAuthState();
        setStatus('error');
        setError(err?.response?.data?.message || 'Google authentication failed. Please try again.');
        window.setTimeout(
          () => navigate(content.fallbackRoute, { replace: true }),
          REDIRECT_DELAY_MS
        );
      }
    };

    handleCallback();
  }, [searchParams, googleLogin, navigate, content.fallbackRoute]);

  const StatusIcon =
    status === 'error'
      ? ExclamationTriangleIcon
      : status === 'success'
        ? CheckBadgeIcon
        : ArrowPathIcon;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8 sm:px-8">
      <div className="w-full max-w-[420px]">
        <Link to="/" className="mb-9 flex justify-center" title="Go to Home">
          <img
            src="/wordmark_logo_coloured_fullname.png"
            alt="SkyWorld Ventures"
            className="h-9 w-auto"
          />
        </Link>

        <section
          className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-9"
          aria-live="polite"
        >
          <div className="flex items-center gap-4 border-b border-slate-200 pb-7">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-500' : status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-500' : 'border-sky-200 bg-sky-50 text-sky-600'}`}
            >
              <StatusIcon className={`h-5 w-5 ${status === 'working' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{content.eyebrow}</p>
              <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-950">
                {status === 'error'
                  ? 'Sign-in paused'
                  : status === 'success'
                    ? content.successTitle
                    : content.activeTitle}
              </h1>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-slate-600">
            {status === 'error' ? error : content.description}
          </p>

          <div className="mt-7 space-y-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCurrent = index === activeStep && status === 'working';
              const isDone = status === 'success' || index < activeStep;
              return (
                <div
                  key={step.title}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${isDone ? 'border-emerald-200 bg-emerald-50/50' : isCurrent ? 'border-sky-200 bg-sky-50/50' : 'border-slate-200 bg-white'}`}
                >
                  <StepIcon
                    className={`h-5 w-5 shrink-0 ${isDone ? 'text-emerald-500' : isCurrent ? 'text-sky-500' : 'text-slate-400'}`}
                  />
                  <span className="text-sm text-slate-700">{step.title}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {isDone ? 'Done' : isCurrent ? 'Working' : 'Next'}
                  </span>
                </div>
              );
            })}
          </div>

          {status === 'error' ? (
            <div className="mt-7 flex gap-3">
              <Link
                to={content.fallbackRoute}
                className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {content.fallbackLabel}
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mt-7 flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
              Redirecting to your workspace...
            </div>
          )}

          {status === 'error' && (
            <p className="mt-4 text-xs text-slate-400">
              Returning to sign in in {countdown} second{countdown === 1 ? '' : 's'}.
            </p>
          )}
        </section>
        <p className="mt-6 text-center text-xs text-slate-500">&copy; 2026 SkyWorld Ventures</p>
      </div>
    </main>
  );
};

export default GoogleCallback;
