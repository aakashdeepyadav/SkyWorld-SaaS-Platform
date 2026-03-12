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
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan not found</h1>
          <p className="text-gray-500 mb-6">The plan you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            to="/plans/monthly"
            className="inline-flex items-center gap-2 text-sky-600 font-medium hover:underline"
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
    <div className="min-h-screen bg-surface-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.05] to-indigo-500/[0.05]" />

        <div className="relative max-w-4xl mx-auto px-6 pt-10 pb-14">
          <Link
            to="/plans/monthly"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> All monthly plans
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-lg">
              {plan.popular && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#37BBEC] text-white mb-3">
                  Most Popular
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {plan.name}
              </h1>
              <p className="text-gray-500 mt-3 text-lg leading-relaxed">{plan.tagline}</p>
              <p className="text-sm text-gray-400 mt-2">{plan.bestFor}</p>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-2 flex-wrap justify-end">
                {plan.offerPercent > 0 && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatINR(plan.offerOriginalPrice)}
                  </span>
                )}
                <span className="text-4xl font-extrabold text-gray-900">
                  {formatINR(plan.price)}
                </span>
                <span className="text-base text-gray-400 font-medium">/month</span>
                {plan.offerPercent > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {plan.offerPercent}% off
                  </span>
                )}
              </div>
              <button
                onClick={handleGetStarted}
                className="mt-4 px-8 py-3 rounded-xl font-semibold text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/25 transition-all duration-300 active:scale-[0.98]"
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
            <div key={s.label} className="card flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {s.label}
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mb-12">
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <SparklesIcon className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-gray-900">What&apos;s included</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-3 text-sm">
                  <CheckIcon
                    className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                    strokeWidth={3}
                  />
                  <span className="text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Other plans */}
        {otherPlans.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Compare other plans</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {otherPlans.map((op) => (
                <Link
                  key={op.slug}
                  to={`/plans/monthly/${op.slug}`}
                  className="card hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-sky-600:text-sky-400 transition-colors">
                        {op.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{op.tagline}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {op.highlights?.map((h) => (
                          <span
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-600"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {op.offerPercent > 0 && (
                        <span className="text-sm text-gray-400 line-through block">
                          {formatINR(op.offerOriginalPrice)}
                        </span>
                      )}
                      <span className="text-lg font-extrabold text-gray-900">
                        {formatINR(op.price)}
                      </span>
                      {op.offerPercent > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 ml-1">
                          {op.offerPercent}% off
                        </span>
                      )}
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
