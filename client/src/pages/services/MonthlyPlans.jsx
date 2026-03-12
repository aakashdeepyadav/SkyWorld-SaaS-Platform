import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const MonthlyPlans = () => {
  const { MONTHLY_PLANS } = useCatalog();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = (plan) => {
    const target = `/checkout/monthly/${plan.slug}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.05] to-indigo-500/[0.05]" />

        <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-14">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Monthly Maintenance Plans
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl text-lg leading-relaxed">
            Optional plans for ongoing updates, monitoring, and support.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* Plan Comparison Grid */}
        <div className="grid md:grid-cols-3 gap-6 -mt-2">
          {MONTHLY_PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`relative card flex flex-col overflow-hidden transition-shadow hover:shadow-lg ${plan.popular ? 'border-2 border-sky-200 shadow-md' : ''
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#37BBEC] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl">
                  Best Value
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {plan.tagline}
                </p>
              </div>

              {/* Highlights */}
              {plan.highlights?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {plan.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-600"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatINR(plan.price)}
                </span>
                <span className="text-sm text-gray-400 font-medium">/month</span>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 mb-5 pb-5 border-b border-gray-100">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" /> {plan.responseTime}
                </span>
                <span>{plan.updates}</span>
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-5 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon
                      className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                      strokeWidth={3}
                    />
                    <span className="text-gray-700">{f}</span>
                  </div>
                ))}
              </div>

              {/* Not included */}


              {/* Actions */}
              <div className="mt-auto space-y-2.5">
                <button
                  onClick={() => handleGetStarted(plan)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 active:scale-[0.98] ${plan.popular
                    ? 'text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/25'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200:bg-surface-600'
                    }`}
                >
                  Get Started
                </button>
                <Link
                  to={`/plans/monthly/${plan.slug}`}
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-400 hover:text-sky-600:text-sky-400 transition-colors py-1"
                >
                  View full details <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ-style info */}
        <div className="mt-16 grid sm:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              How billing works
            </h3>
            <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
              <p>
                Plans are billed monthly. No long-term contracts — you can pause or cancel anytime
                with 7 days notice.
              </p>
              <p>
                First payment is collected when your plan starts. We&apos;ll send you a reminder
                before each billing cycle.
              </p>
            </div>
          </div>
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              Switching plans
            </h3>
            <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
              <p>Upgrade or downgrade anytime. Changes take effect from the next billing cycle.</p>
              <p>
                Need something outside these plans?{' '}
                <Link
                  to={user ? '/request' : '/register'}
                  className="text-sky-600 font-medium hover:underline"
                >
                  Request a custom quote
                </Link>{' '}
                and we&apos;ll work it out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPlans;
