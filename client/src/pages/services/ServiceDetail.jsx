import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { PLAN_CATALOG } from '../../utils/planCatalog';
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
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-3xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service not found</h1>
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
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${catalog.gradient} opacity-[0.06] dark:opacity-[0.12]`}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-16">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8"
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                {serviceName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl text-lg leading-relaxed">
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose your plan</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {catalog.plans.length} fixed-price plan{catalog.plans.length > 1 ? 's' : ''} — or
              request a fully custom build.
            </p>
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
                className={`relative card dark:bg-surface-800 dark:border-surface-700 overflow-hidden group flex flex-col ${
                  plan.popular ? 'border-2 border-primary-200 dark:border-primary-500/30' : ''
                }`}
              >
                {plan.popular && (
                  <div
                    className={`absolute top-0 right-0 bg-gradient-to-l ${catalog.gradient} text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl`}
                  >
                    Popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{plan.bestFor}</p>
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

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {formatINR(plan.price)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-6">
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
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Support info */}
                {plan.support && (
                  <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                    <SparklesIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {plan.support}
                    </span>
                  </div>
                )}

                {/* Excludes */}
                {plan.excludes?.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 dark:border-surface-700 mb-6 space-y-2">
                    {plan.excludes.map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-sm">
                        <XMarkIcon
                          className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5"
                          strokeWidth={2.5}
                        />
                        <span className="text-gray-400 dark:text-gray-500">{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handlePlanCheckout(plan.slug)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 active:scale-[0.98] mt-auto ${
                    plan.popular
                      ? `text-white bg-gradient-to-r ${catalog.gradient} hover:shadow-lg hover:shadow-primary-500/25`
                      : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600'
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}

            {/* Custom Plan Card */}
            <div className="card dark:bg-surface-800 dark:border-surface-700 border-dashed flex flex-col group">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Custom Plan</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Beyond our fixed packages
                </p>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  Tailored
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-6">
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
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCustom}
                className="w-full py-3 px-6 rounded-xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 transition-all duration-200 active:scale-[0.98] mt-auto"
              >
                Request Custom Quote
              </button>
            </div>
          </div>
        </section>

        {/* ── What's Included (highlight popular plan) ── */}
        {(() => {
          const highlighted = catalog.plans.find((p) => p.popular) || catalog.plans[0];
          return (
            <section className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card dark:bg-surface-800 dark:border-surface-700">
                <div className="flex items-center gap-2 mb-5">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    What's included
                  </h2>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${catalog.lightBg} ${catalog.accentText}`}
                  >
                    {highlighted.name}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {highlighted.features.map((item) => (
                    <div
                      key={item}
                      className={`flex items-center gap-3 p-3.5 rounded-xl ${catalog.lightBg}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card dark:bg-surface-800 dark:border-surface-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                  Not included
                </h2>
                <div className="space-y-3">
                  {(highlighted.excludes || []).map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-surface-600 flex items-center justify-center flex-shrink-0">
                        <XMarkIcon
                          className="w-3 h-3 text-gray-400 dark:text-gray-500"
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ── Process & Timeline ── */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="card dark:bg-surface-800 dark:border-surface-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Our process</h2>
            <div className="relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-gray-200 via-primary-300 to-gray-200 dark:from-surface-600 dark:via-primary-500 dark:to-surface-600 rounded-full" />
              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <div key={step} className="relative flex items-start gap-4 pl-1">
                    <div
                      className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 
                      ${
                        index === 0
                          ? `bg-gradient-to-br ${catalog.gradient} text-white shadow-md`
                          : 'bg-white dark:bg-surface-700 text-gray-500 dark:text-gray-400 border-2 border-gray-200 dark:border-surface-600'
                      }
                    `}
                    >
                      {index + 1}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card dark:bg-surface-800 dark:border-surface-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Delivery timeline
            </h2>
            <div className="space-y-4">
              {catalog.plans.map((plan) => (
                <div
                  key={plan.slug}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-surface-700 rounded-xl"
                >
                  <ClockIcon className={`w-5 h-5 ${catalog.accentText} flex-shrink-0 mt-0.5`} />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      : {plan.delivery}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-surface-700 rounded-xl">
                <SparklesIcon className={`w-5 h-5 ${catalog.accentText} flex-shrink-0 mt-0.5`} />
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Custom
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    : Scope-based, typically 2–8 weeks
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServiceDetail;
