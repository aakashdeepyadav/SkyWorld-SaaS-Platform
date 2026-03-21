import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import {
  Seo,
  buildBreadcrumbSchema,
  buildOffer,
  buildServiceSchema,
} from '../../components/seo/Seo';
import {
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { CodeBracketIcon, DevicePhoneMobileIcon, PaintBrushIcon } from '@heroicons/react/24/solid';

const ICON_MAP = {
  'web-development': CodeBracketIcon,
  'app-development': DevicePhoneMobileIcon,
  'branding-creative': PaintBrushIcon,
};

const PlanDetail = () => {
  const { PLAN_CATALOG } = useCatalog();
  const { slug, planSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const catalog = useMemo(() => PLAN_CATALOG[slug], [slug]);
  const plan = useMemo(
    () => catalog?.plans.find((p) => p.slug === planSlug) || null,
    [catalog, planSlug]
  );
  const Icon = ICON_MAP[slug] || CodeBracketIcon;

  /* Fetch DB service for serviceId (needed for checkout) */
  const { data: services = [] } = useQuery(
    ['services-for-plan-detail'],
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

  /* Not found */
  if (!catalog || !plan) {
    return (
      <div className="min-h-screen bg-surface-50 px-6 py-20">
        <div className="max-w-3xl mx-auto card text-center">
          <h1 className="text-2xl font-bold text-gray-900">Plan not found</h1>
          <p className="text-sm text-gray-500 mt-2">The plan you are looking for does not exist.</p>
          <Link to={slug ? `/services/${slug}` : '/'} className="btn-primary mt-6 inline-flex">
            Back to {catalog?.name || 'Home'}
          </Link>
        </div>
      </div>
    );
  }

  const advanceAmount = Math.ceil(plan.price / 2);
  const otherPlans = catalog.plans.filter((p) => p.slug !== planSlug);
  const planPath = `/services/${slug}/${plan.slug}`;
  const planStructuredData = [
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: catalog.name, path: `/services/${slug}` },
      { name: plan.name, path: planPath },
    ]),
    buildServiceSchema({
      name: `${plan.name} - ${catalog.name}`,
      description: `${plan.bestFor}. Delivery in ${plan.delivery}.`,
      path: planPath,
      serviceType: catalog.name,
      offers: buildOffer({
        path: planPath,
        price: plan.price,
      }),
    }),
  ];

  const handleCheckout = () => {
    const params = new URLSearchParams({ service: slug, plan: planSlug });
    if (dbService?._id) params.set('serviceId', dbService._id);
    const target = `/checkout?${params.toString()}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Seo
        title={`${plan.name} | ${catalog.name} Pricing | SkyWorld Ventures`}
        description={`${plan.name} is built for ${plan.bestFor.toLowerCase()}. View pricing, delivery timeline, included features, and payment breakdown from SkyWorld Ventures.`}
        path={planPath}
        keywords={[
          plan.name,
          `${catalog.name} pricing`,
          `${plan.name} package`,
          `${catalog.name} plan`,
        ]}
        structuredData={planStructuredData}
      />
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${catalog.gradient} opacity-[0.06]`} />

        <div className="relative max-w-4xl mx-auto px-6 pt-10 pb-14">
          <Link
            to={`/services/${slug}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> All {catalog.name} plans
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-lg">
              {plan.popular && (
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#37BBEC] text-white mb-3`}
                >
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-xl ${catalog.lightBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${catalog.accentText}`} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  {plan.name}
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">{plan.bestFor}</p>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-2">
                {plan.offerPercent > 0 && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatINR(plan.offerOriginalPrice)}
                  </span>
                )}
                <span className="text-4xl font-extrabold text-gray-900">
                  {formatINR(plan.price)}
                </span>
                {plan.offerPercent > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {plan.offerPercent}% off
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" /> Delivery in {plan.delivery}
              </p>
              <button
                onClick={handleCheckout}
                className={`mt-4 px-8 py-3 rounded-xl font-semibold text-white bg-[#37BBEC] hover:bg-[#2ea8d6] hover:shadow-lg transition-all duration-300 active:scale-[0.98]`}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        {/* Quick Stats */}
        <div className="grid sm:grid-cols-3 gap-4 -mt-2 mb-12">
          <div className="card flex items-center gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl ${catalog.lightBg} flex items-center justify-center`}
            >
              <ClockIcon className={`w-5 h-5 ${catalog.accentText}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Delivery</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{plan.delivery}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl ${catalog.lightBg} flex items-center justify-center`}
            >
              <SparklesIcon className={`w-5 h-5 ${catalog.accentText}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Support</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {plan.support || 'Chat support'}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckIcon className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Payment</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                50% advance, rest on delivery
              </p>
            </div>
          </div>
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

        {/* Highlights */}
        {plan.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {plan.highlights.map((h) => (
              <span
                key={h}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg ${catalog.lightBg} ${catalog.accentText}`}
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Pricing Breakdown */}
        <div className="card mb-12">
          <h2 className="text-base font-bold text-gray-900 mb-4">Payment breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">50% Advance</p>
                  <p className="text-[11px] text-gray-500">Pay now to start your project</p>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald-600">{formatINR(advanceAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-300 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">50% on Delivery</p>
                  <p className="text-[11px] text-gray-500">Pay after reviewing your project</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-400">
                {formatINR(plan.price - advanceAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-16">
          <button
            onClick={handleCheckout}
            className={`inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-lg bg-[#37BBEC] hover:bg-[#2ea8d6] transition-all duration-300 hover:shadow-xl active:scale-[0.98]`}
          >
            Get Started — {formatINR(plan.price)}
            <span>&rarr;</span>
          </button>
          <p className="text-sm text-gray-400 mt-3">
            {formatINR(advanceAmount)} advance · {plan.delivery} delivery
          </p>
        </div>

        {/* Other Plans */}
        {otherPlans.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Other {catalog.name} plans</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {otherPlans.map((op) => (
                <Link
                  key={op.slug}
                  to={`/services/${slug}/${op.slug}`}
                  className="card hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className={`text-sm font-bold text-gray-900 group-hover:${catalog.accentText} transition-colors`}
                      >
                        {op.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{op.bestFor}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {op.highlights?.map((h) => (
                          <span
                            key={h}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${catalog.lightBg} ${catalog.accentText}`}
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
                      <span className="block text-xs text-gray-400">
                        <ClockIcon className="w-3 h-3 inline mr-0.5" />
                        {op.delivery}
                      </span>
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

export default PlanDetail;
