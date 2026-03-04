import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import {
  ArrowLeftIcon,
  SparklesIcon,
  PlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const AddOns = () => {
  const { ADD_ONS } = useCatalog();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddOn = (label) => {
    const target = `/checkout/addons?selected=${encodeURIComponent(label)}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.06] dark:from-amber-500/[0.12] dark:to-orange-500/[0.12]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-16">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>

          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                Add-On Services
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl text-lg leading-relaxed">
                Boost any project with targeted extras — add these on top of any plan or combo for
                even better results.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {/* ── Add-On Cards ── */}
        <section>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADD_ONS.map((addon) => (
              <div
                key={addon.label}
                className="card dark:bg-surface-800 dark:border-surface-700 flex flex-col group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <PlusIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {addon.label}
                    </h3>
                    {addon.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {addon.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-1 mt-auto">
                  <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {formatINR(addon.price)}
                  </span>
                  {addon.unit && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                      {addon.unit}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddOn(addon.label)}
                  className="w-full mt-4 py-2.5 px-4 rounded-xl text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors active:scale-[0.98]"
                >
                  Add to Request
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Benefits Section ── */}
        <section className="card dark:bg-surface-800 dark:border-surface-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">How add-ons work</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: PlusIcon,
                title: 'Stack with any plan',
                desc: 'Add-ons can be combined with any individual plan or combo package.',
              },
              {
                icon: ClockIcon,
                title: 'Quick turnaround',
                desc: 'Most add-ons are delivered within 1–3 business days alongside your project.',
              },
              {
                icon: ShieldCheckIcon,
                title: 'Quality guaranteed',
                desc: 'Every add-on undergoes the same quality checks as our core services.',
              },
            ].map(({ icon: Ic, title, desc }) => (
              <div key={title} className="text-center p-4">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Ic className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Not sure what you need? Tell us about your project and we&apos;ll recommend the right
            extras.
          </p>
          <Link
            to={user ? '/checkout/addons' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 active:scale-[0.98]"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Browse &amp; Checkout Add-Ons
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AddOns;
