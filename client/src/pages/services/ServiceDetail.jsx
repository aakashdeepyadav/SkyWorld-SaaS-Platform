import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import {
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CodeBracketIcon, DevicePhoneMobileIcon, PaintBrushIcon } from '@heroicons/react/24/solid';

/* ─── Icon map for categories ─── */
const ICON_MAP = {
  'web-development': CodeBracketIcon,
  'app-development': DevicePhoneMobileIcon,
  'branding-creative': PaintBrushIcon,
};

/* ─── Process steps per category ─── */
const PROCESS_STEPS = {
  'web-development': ['Discovery & brief', 'Design & layout', 'Build & QA', 'Launch & handoff'],
  'app-development': [
    'Product discovery',
    'UX & UI design',
    'Development & testing',
    'Launch support',
  ],
  'branding-creative': ['Brand discovery', 'Concept exploration', 'Refinements', 'Delivery kit'],
};

/* ─── Component ─── */
const ServiceDetail = () => {
  const { PLAN_CATALOG } = useCatalog();
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const catalog = useMemo(() => PLAN_CATALOG[slug], [slug]);
  const Icon = ICON_MAP[slug] || CodeBracketIcon;
  const processSteps = PROCESS_STEPS[slug] || PROCESS_STEPS['web-development'];

  /* Fetch DB service for serviceId (needed for checkout) */
  const { data: services = [] } = useQuery(
    ['services-for-detail'],
    async () => {
      const response = await api.get('/services');
      return response.data?.services || [];
    },
    { staleTime: 30 * 1000 }
  );

  const dbService = useMemo(
    () =>
      [...services]
        .filter((item) => item.category === slug)
        .sort(
          (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        )[0],
    [services, slug]
  );

  /* ─── Not found ─── */
  if (!catalog) {
    return (
      <div className="min-h-screen bg-surface-50 px-6 py-20">
        <div className="max-w-3xl mx-auto card text-center">
          <h1 className="text-2xl font-bold text-gray-900">Service not found</h1>
          <p className="text-sm text-gray-500 mt-2">
            The service you are looking for does not exist.
          </p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const serviceName = dbService?.name || catalog.name;
  const serviceSubtitle = dbService?.description || catalog.tagline;

  /* ─── Checkout handler ─── */
  const handlePlanCheckout = (planSlug) => {
    const params = new URLSearchParams({ service: slug, plan: planSlug });
    if (dbService?._id) params.set('serviceId', dbService._id);
    const target = `/checkout?${params.toString()}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  const handleCustom = () => {
    const target = `/request?service=${slug}`;
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
        <div className={`absolute inset-0 bg-gradient-to-br ${catalog.gradient} opacity-[0.06]`} />

        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-16">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>

          <div className="flex items-start gap-5">
            <div
              className={`w-14 h-14 rounded-2xl ${catalog.lightBg} flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-7 h-7 ${catalog.accentText}`} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {serviceName}
              </h1>
              <p className="text-gray-500 mt-2 max-w-2xl text-lg leading-relaxed">
                {serviceSubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20 space-y-16">
        {/* ── Plan Cards ── */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Choose your plan</h2>
          </div>

          <div
            className={`grid gap-6 max-w-5xl mx-auto ${
              catalog.plans.length === 2
                ? 'lg:grid-cols-3'
                : catalog.plans.length >= 3
                  ? 'lg:grid-cols-4'
                  : 'lg:grid-cols-2'
            }`}
          >
            {catalog.plans.map((plan) => (
              <div
                key={plan.slug}
                className={`relative card overflow-hidden group flex flex-col ${
                  plan.popular ? 'border-2 border-primary-200' : ''
                }`}
              >
                {plan.popular && (
                  <div
                    className={`absolute top-0 right-0 bg-[#37BBEC] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl`}
                  >
                    Popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{plan.bestFor}</p>
                </div>

                {/* Highlight badges */}
                {plan.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {plan.highlights.map((h) => (
                      <span
                        key={h}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${catalog.lightBg} ${catalog.accentText}`}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-baseline gap-2 mb-1">
                  {plan.offerPercent > 0 && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatINR(plan.offerOriginalPrice)}
                    </span>
                  )}
                  <span className="text-3xl font-extrabold text-gray-900">
                    {formatINR(plan.price)}
                  </span>
                  {plan.offerPercent > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {plan.offerPercent}% off
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                  <ClockIcon className="w-3.5 h-3.5" /> Delivery in {plan.delivery}
                </p>

                {/* Features */}
                <div className="space-y-2.5 mb-4 flex-1">
                  {plan.features.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm">
                      <CheckIcon
                        className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                        strokeWidth={3}
                      />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Support info */}
                {plan.support && (
                  <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-emerald-50">
                    <SparklesIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700">{plan.support}</span>
                  </div>
                )}

                <Link
                  to={`/services/${slug}/${plan.slug}`}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 active:scale-[0.98] mt-auto text-center block ${
                    plan.popular
                      ? `text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg hover:shadow-[#37BBEC]/25`
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200:bg-surface-600'
                  }`}
                >
                  View {plan.name}
                </Link>
              </div>
            ))}

            {/* Custom Plan Card */}
            <div className="card border-dashed flex flex-col group">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-gray-900">Custom Plan</h3>
                <p className="text-xs text-gray-400 mt-1">Beyond our fixed packages</p>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-extrabold text-gray-900">Tailored</span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                <SparklesIcon className="w-3.5 h-3.5" /> Scope-based timeline
              </p>

              <div className="space-y-2.5 mb-4 flex-1">
                {[
                  'Custom design & architecture',
                  'Dedicated project manager',
                  'Milestone-based billing',
                  'Priority support & updates',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon
                      className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                      strokeWidth={3}
                    />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCustom}
                className="w-full py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200:bg-surface-600 transition-all duration-200 active:scale-[0.98] mt-auto"
              >
                Request Custom Quote
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServiceDetail;
