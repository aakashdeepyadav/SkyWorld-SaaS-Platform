import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowRightIcon,
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

  const authIntent = useMemo(
    () => sessionStorage.getItem('googleAuthIntent') || 'login',
    []
  );

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
        setError(
          err?.response?.data?.message || 'Google authentication failed. Please try again.'
        );
        window.setTimeout(() => navigate(content.fallbackRoute, { replace: true }), REDIRECT_DELAY_MS);
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
    <div className="min-h-screen bg-[#f6fbff]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-[44%]">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.85) 1px, transparent 0)',
              backgroundSize: '26px 26px',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(55,187,236,0.34),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_40%)]" />
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <Link to="/" className="w-fit" title="Go to Home">
              <img
                src="/wordmark_logo_white_fullname.png"
                alt="SkyWorld Ventures"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <div className="max-w-md">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-sky-300/80">
                {content.eyebrow}
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-white xl:text-5xl">
                {content.heading}
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-300">
                {content.description}
              </p>

              <div className="mt-10 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCurrent = index === activeStep && status === 'working';
                  const isDone = status === 'success' || index < activeStep;

                  return (
                    <div
                      key={step.title}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                        isCurrent ? 'bg-white/10' : ''
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                          isDone
                            ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200'
                            : isCurrent
                              ? 'border-sky-300/30 bg-sky-400/10 text-sky-100'
                              : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{step.title}</p>
                        <p className="text-xs text-slate-400">
                          {isDone ? 'Completed' : isCurrent ? 'In progress' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-sm text-slate-500">&copy; 2026 SkyWorld Ventures</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-xl">
            <Link to="/" className="mb-10 flex w-fit lg:hidden" title="Go to Home">
              <img
                src="/wordmark_logo_coloured_fullname.png"
                alt="SkyWorld Ventures"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#37BBEC_0%,#0EA5E9_45%,#22C55E_100%)]" />
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-cyan-50 blur-3xl" />

              <div className="relative px-7 py-8 sm:px-10 sm:py-10">
                <div className="flex items-center justify-between gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Secure Google Auth
                  </div>
                  <img
                    src="/icon_logo_coloured_normal.png"
                    alt="SkyWorld"
                    className="h-11 w-11 rounded-2xl object-contain"
                  />
                </div>

                <div className="mt-10 flex items-start gap-4">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl ${
                      status === 'error'
                        ? 'bg-rose-50 text-rose-500'
                        : status === 'success'
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-sky-50 text-sky-600'
                    }`}
                  >
                    <StatusIcon className={`h-8 w-8 ${status === 'working' ? 'animate-spin' : ''}`} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {status === 'error'
                        ? 'Authentication interrupted'
                        : status === 'success'
                          ? content.successTitle
                          : content.activeTitle}
                    </h2>
                    <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                      {status === 'error' ? error : content.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                    <span>Current Flow</span>
                    <span>{status === 'error' ? 'Retry Needed' : 'In Progress'}</span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'error'
                          ? 'w-1/3 bg-rose-400'
                          : status === 'success'
                            ? 'w-full bg-emerald-400'
                            : activeStep === 0
                              ? 'w-1/3 bg-sky-500'
                              : activeStep === 1
                                ? 'w-2/3 bg-sky-500'
                                : 'w-[88%] bg-sky-500'
                      }`}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCurrent = index === activeStep && status === 'working';
                      const isDone = status === 'success' || index < activeStep;

                      return (
                        <div
                          key={step.title}
                          className={`rounded-2xl border px-4 py-4 ${
                            isDone
                              ? 'border-emerald-200 bg-emerald-50'
                              : isCurrent
                                ? 'border-sky-200 bg-sky-50'
                                : 'border-slate-200 bg-white'
                          }`}
                        >
                          <StepIcon
                            className={`h-5 w-5 ${
                              isDone
                                ? 'text-emerald-500'
                                : isCurrent
                                  ? 'text-sky-500'
                                  : 'text-slate-400'
                            }`}
                          />
                          <p className="mt-3 text-sm font-medium text-slate-900">{step.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {status === 'error' ? (
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={content.fallbackRoute}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {content.fallbackLabel}
                    </Link>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
                      Protected handoff in progress
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Redirecting to your workspace
                      <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </div>
                )}

                {status === 'error' && (
                  <p className="mt-4 text-sm text-slate-400">
                    Redirecting automatically in {countdown} second{countdown === 1 ? '' : 's'}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
