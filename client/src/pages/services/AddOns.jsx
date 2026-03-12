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
    <div className="min-h-screen bg-surface-50">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.06]" />

        <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-16">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>

          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Add-On Services
              </h1>
              <p className="text-gray-500 mt-2 max-w-2xl text-lg leading-relaxed">
                Extras you can add to any plan or combo.
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
                className="card flex flex-col group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center flex-shrink-0">
                    <PlusIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {addon.label}
                    </h3>
                    {addon.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {addon.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-1 mt-auto">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {formatINR(addon.price)}
                  </span>
                  {addon.unit && (
                    <span className="text-sm text-gray-400 font-medium">
                      {addon.unit}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddOn(addon.label)}
                  className="w-full mt-4 py-2.5 px-4 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100:bg-amber-500/20 transition-colors active:scale-[0.98]"
                >
                  Add to Request
                </button>
              </div>
            ))}
          </div>
        </section>



        {/* ── CTA ── */}
        <section className="text-center">
          <Link
            to={user ? '/checkout/addons' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/25 transition-all duration-300 active:scale-[0.98]"
          >
            Checkout Add-Ons
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AddOns;
