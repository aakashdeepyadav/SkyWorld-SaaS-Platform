import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import {
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/solid';

/* ─── Service content map ──────────────────────────────────────── */
const SERVICE_CONTENT = {
  'web-development': {
    name: 'Web Development',
    subtitle: 'High-converting websites built for speed and clarity.',
    icon: CodeBracketIcon,
    gradient: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-50 dark:bg-sky-500/10',
    accentText: 'text-sky-600 dark:text-sky-400',
    starterPrice: 1499,
    starterTimeline: '5–7 days',
    starterIncludes: [
      '1–3 pages',
      'Template-based design',
      'Mobile responsive layout',
      'Basic contact form',
      'Performance & SEO basics',
    ],
    starterExcludes: [
      'Custom animations',
      'Advanced integrations',
      'E-commerce features',
      'Complex backend workflows',
    ],
    customIncludes: [
      'Custom UX & UI design',
      'CMS or admin panel',
      'Advanced integrations',
      'Scalable architecture planning',
    ],
    customExcludes: [
      'Hosting fees',
      'Ongoing content updates',
      'Third-party subscription costs',
    ],
    process: ['Discovery & brief', 'Design & layout', 'Build & QA', 'Launch & handoff'],
    delivery: ['Starter: 5–7 days', 'Custom: 3–6 weeks depending on scope'],
  },
  'app-development': {
    name: 'App Development',
    subtitle: 'Clean, intuitive apps that feel effortless to use.',
    icon: DevicePhoneMobileIcon,
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50 dark:bg-violet-500/10',
    accentText: 'text-violet-600 dark:text-violet-400',
    starterPrice: 2999,
    starterTimeline: '10–14 days',
    starterIncludes: [
      'Basic UI screens',
      'Simple functionality',
      'No complex backend',
      'Lightweight data storage',
      'App handoff package',
    ],
    starterExcludes: [
      'Complex backend systems',
      'Third-party integrations',
      'Real-time features',
      'Multi-role dashboards',
    ],
    customIncludes: [
      'Product strategy workshop',
      'Custom design system',
      'Robust backend & APIs',
      'App store deployment support',
    ],
    customExcludes: [
      'App store fees',
      'Ongoing maintenance plans',
      'Third-party licensing fees',
    ],
    process: ['Product discovery', 'UX & UI design', 'Development & testing', 'Launch support'],
    delivery: ['Starter: 10–14 days', 'Custom: 4–10 weeks depending on scope'],
  },
  'branding-creative': {
    name: 'Branding',
    subtitle: 'Identity systems that make your business unforgettable.',
    icon: PaintBrushIcon,
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50 dark:bg-amber-500/10',
    accentText: 'text-amber-600 dark:text-amber-400',
    starterPrice: 799,
    starterTimeline: '4–6 days',
    starterIncludes: [
      '1 logo concept',
      '2 revisions',
      'Social media kit',
      'Basic brand guide',
    ],
    starterExcludes: [
      'Multiple logo directions',
      'Packaging design',
      'Full brand strategy',
      'Extended collateral design',
    ],
    customIncludes: [
      'Brand strategy workshop',
      'Multiple logo directions',
      'Comprehensive brand guidelines',
      'Collateral templates',
    ],
    customExcludes: [
      'Print production costs',
      'Photography or video shoots',
      'Trademark registration',
    ],
    process: ['Brand discovery', 'Concept exploration', 'Refinements', 'Delivery kit'],
    delivery: ['Starter: 4–6 days', 'Custom: 2–4 weeks depending on scope'],
  },
};

/* ─── Component ────────────────────────────────────────────────── */
const ServiceDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const content = useMemo(() => SERVICE_CONTENT[slug], [slug]);

  const { data: services = [] } = useQuery(
    ['services-for-detail'],
    async () => {
      const response = await api.get('/services');
      return response.data?.services || [];
    },
    { staleTime: 30 * 1000 }
  );

  const dbService = useMemo(
    () => [...services]
      .filter((item) => item.category === slug)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0],
    [services, slug]
  );

  if (!content) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-3xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service not found</h1>
          <p className="text-sm text-gray-500 mt-2">The service you are looking for does not exist.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
        </div>
      </div>
    );
  }

  const serviceName = dbService?.name || content.name;
  const serviceSubtitle = dbService?.description || content.subtitle;
  const starterPrice = Number(dbService?.basePrice ?? content.starterPrice ?? 0);
  const Icon = content.icon;

  const handleStarter = () => {
    const params = new URLSearchParams({ service: slug, plan: 'starter' });
    if (dbService?._id) params.set('serviceId', dbService._id);
    const target = `/checkout?${params.toString()}`;
    if (!user) { navigate('/login', { state: { from: target } }); return; }
    navigate(target);
  };

  const handleCustom = () => {
    const target = `/custom-request?service=${slug}`;
    if (!user) { navigate('/login', { state: { from: target } }); return; }
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Gradient backdrop */}
        <div className={`absolute inset-0 bg-gradient-to-br ${content.gradient} opacity-[0.06] dark:opacity-[0.12]`} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-16">
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>

          <div className="flex items-start gap-5">
            <div className={`w-14 h-14 rounded-2xl ${content.lightBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-7 h-7 ${content.accentText}`} />
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

        {/* ── What's Included / Not Included ──────────────────── */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card dark:bg-surface-800 dark:border-surface-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">What's included</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {content.starterIncludes.map((item) => (
                <div key={item} className={`flex items-center gap-3 p-3.5 rounded-xl ${content.lightBg}`}>
                  <div className={`w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0`}>
                    <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card dark:bg-surface-800 dark:border-surface-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Not included</h2>
            <div className="space-y-3">
              {content.starterExcludes.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-surface-600 flex items-center justify-center flex-shrink-0">
                    <XMarkIcon className="w-3 h-3 text-gray-400 dark:text-gray-500" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process & Timeline ──────────────────────────────── */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="card dark:bg-surface-800 dark:border-surface-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Our process</h2>
            <div className="relative">
              {/* Vertical line — centered on w-8 (32px) circles with pl-1 (4px) offset → center = 20px */}
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-gray-200 via-primary-300 to-gray-200 dark:from-surface-600 dark:via-primary-500 dark:to-surface-600 rounded-full" />

              <div className="space-y-6">
                {content.process.map((step, index) => (
                  <div key={step} className="relative flex items-start gap-4 pl-1">
                    <div className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 
                      ${index === 0
                        ? `bg-gradient-to-br ${content.gradient} text-white shadow-md`
                        : 'bg-white dark:bg-surface-700 text-gray-500 dark:text-gray-400 border-2 border-gray-200 dark:border-surface-600'
                      }
                    `}>
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Delivery timeline</h2>
            <div className="space-y-4">
              {content.delivery.map((item) => {
                const [label, ...rest] = item.split(':');
                return (
                  <div key={item} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-surface-700 rounded-xl">
                    <ClockIcon className={`w-5 h-5 ${content.accentText} flex-shrink-0 mt-0.5`} />
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">:{rest.join(':')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Pricing Cards ──────────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose your plan</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Start simple or go fully custom.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="relative card dark:bg-surface-800 dark:border-surface-700 border-2 border-primary-200 dark:border-primary-500/30 overflow-hidden group">
              {/* Popular badge */}
              <div className={`absolute top-0 right-0 bg-gradient-to-l ${content.gradient} text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl`}>
                Popular
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Starter Plan</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{formatINR(starterPrice)}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" /> Delivery in {content.starterTimeline}
                </p>
              </div>

              <div className="space-y-2.5 mb-8">
                {content.starterIncludes.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={3} />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStarter}
                disabled={starterPrice <= 0}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${content.gradient} hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Choose Starter
              </button>
            </div>

            {/* Custom Plan */}
            <div className="card dark:bg-surface-800 dark:border-surface-700 group">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Custom Plan</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">Tailored</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <SparklesIcon className="w-3.5 h-3.5" /> Best for complex or multi-phase work
                </p>
              </div>

              <div className="space-y-2.5 mb-8">
                {content.customIncludes.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={3} />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-100 dark:border-surface-700 mt-2">
                  {content.customExcludes.map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm mt-2">
                      <XMarkIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" strokeWidth={2.5} />
                      <span className="text-gray-400 dark:text-gray-500">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCustom}
                className="w-full py-3 px-6 rounded-xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 transition-all duration-200 active:scale-[0.98]"
              >
                Request Custom Plan
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServiceDetail;
