import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const MonthlyPlanDetail = () => {
  const { findMonthlyPlan, MONTHLY_PLANS } = useCatalog();
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const plan = findMonthlyPlan(slug);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plan not found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The plan you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            to="/plans/monthly"
            className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-medium hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" /> View all monthly plans
          </Link>
        </div>
      </div>
    );
  }

  const handleGetStarted = () => {
    const target = `/checkout/monthly/${plan.slug}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  const otherPlans = MONTHLY_PLANS.filter((p) => p.slug !== plan.slug);

  const statCards = [
    {
      icon: ClockIcon,
      label: 'Response time',
      value: plan.responseTime,
    },
    {
      icon: ArrowPathIcon,
      label: 'Updates included',
      value: plan.updates,
    },
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Support',
      value: plan.highlights?.join(', ') || 'Chat support',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.05] to-indigo-500/[0.05] dark:from-sky-500/[0.10] dark:to-indigo-500/[0.10]" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-sky-200/20 dark:bg-sky-800/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 pt-10 pb-14">
          <Link
            to="/plans/monthly"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> All monthly plans
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-lg">
              {plan.popular && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white mb-3">
                  Most Popular
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                {plan.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg leading-relaxed">
                {plan.tagline}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{plan.bestFor}</p>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {formatINR(plan.price)}
                </span>
                <span className="text-base text-gray-400 font-medium">/month</span>
              </div>
              <button
                onClick={handleGetStarted}
                className="mt-4 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-300 active:scale-[0.98]"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        {/* Stat cards */}
        <div className="grid sm:grid-cols-3 gap-4 -mt-2 mb-12">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="card dark:bg-surface-800 dark:border-surface-700 flex items-center gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                  {s.label}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Features & Not included side by side */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card dark:bg-surface-800 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-5">
              <SparklesIcon className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                What&apos;s included
              </h2>
            </div>
            <div className="space-y-3">
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-3 text-sm">
                  <CheckIcon
                    className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                    strokeWidth={3}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card dark:bg-surface-800 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-5">
              <XMarkIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Not included</h2>
            </div>
            <div className="space-y-3">
              {plan.notIncluded.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm">
                  <XMarkIcon
                    className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5"
                    strokeWidth={2.5}
                  />
                  <span className="text-gray-400 dark:text-gray-500">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-5 leading-relaxed">
              Need any of these? Check our{' '}
              <Link
                to="/addons"
                className="text-sky-600 dark:text-sky-400 font-medium hover:underline"
              >
                add-ons
              </Link>{' '}
              or{' '}
              <Link
                to={user ? '/request' : '/register'}
                className="text-sky-600 dark:text-sky-400 font-medium hover:underline"
              >
                request a custom quote
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Other plans */}
        {otherPlans.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Compare other plans
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {otherPlans.map((op) => (
                <Link
                  key={op.slug}
                  to={`/plans/monthly/${op.slug}`}
                  className="card dark:bg-surface-800 dark:border-surface-700 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {op.name}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{op.tagline}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {op.highlights?.map((h) => (
                          <span
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                        {formatINR(op.price)}
                      </span>
                      <span className="block text-xs text-gray-400">/month</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyPlanDetail;
