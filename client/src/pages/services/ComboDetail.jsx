import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import { COMBO_PACKAGES, findCombo, PLAN_CATALOG } from '../../utils/planCatalog';
import {
  CheckIcon,
  ArrowLeftIcon,
  ClockIcon,
  SparklesIcon,
  TagIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { CodeBracketIcon, DevicePhoneMobileIcon, PaintBrushIcon } from '@heroicons/react/24/solid';

/* ─── Icon map for categories ─── */
const ICON_MAP = {
  'web-development': CodeBracketIcon,
  'app-development': DevicePhoneMobileIcon,
  'branding-creative': PaintBrushIcon,
};

const GRADIENT_MAP = {
  'from-amber-500 to-orange-500': 'linear-gradient(135deg, #f59e0b, #f97316)',
  'from-emerald-500 to-teal-600': 'linear-gradient(135deg, #10b981, #0d9488)',
  'from-violet-500 to-purple-600': 'linear-gradient(135deg, #8b5cf6, #9333ea)',
};

const ComboDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const combo = useMemo(() => findCombo(slug), [slug]);

  if (!combo) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 px-6 py-20">
        <div className="max-w-3xl mx-auto card dark:bg-surface-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Combo not found</h1>
          <p className="text-sm text-gray-500 mt-2">
            The combo package you are looking for does not exist.
          </p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const gradientCSS = GRADIENT_MAP[combo.gradient] || 'linear-gradient(135deg, #0ea5e9, #6366f1)';

  const handleGetCombo = () => {
    const target = `/checkout/combo/${combo.slug}`;
    if (!user) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  /* Resolve included plans to their full details */
  const resolvedItems = combo.includes.map((item) => {
    if (item.addOn) return { ...item, type: 'addon' };
    const cat = PLAN_CATALOG[item.category];
    const plan = cat?.plans.find((p) => p.slug === item.plan);
    return { ...item, type: 'plan', catData: cat, planData: plan };
  });

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.14]"
          style={{ background: gradientCSS }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-16">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `rgba(${combo.color}, 0.12)` }}
            >
              <TagIcon className="w-7 h-7" style={{ color: `rgb(${combo.color})` }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {combo.name}
                </h1>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: gradientCSS }}
                >
                  Save {combo.discount}%
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl text-lg leading-relaxed">
                {combo.tagline}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Best for: {combo.bestFor}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {/* ── Pricing Summary ── */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card dark:bg-surface-800 dark:border-surface-700 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Original Price
            </p>
            <p className="text-xl font-bold text-gray-400 line-through mt-1">
              {formatINR(combo.originalPrice)}
            </p>
          </div>
          <div className="card dark:bg-surface-800 dark:border-surface-700 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Combo Price
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
              {formatINR(combo.price)}
            </p>
          </div>
          <div className="card dark:bg-surface-800 dark:border-surface-700 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">You Save</p>
            <p className="text-xl font-extrabold mt-1" style={{ color: `rgb(${combo.color})` }}>
              {formatINR(combo.originalPrice - combo.price)}
            </p>
          </div>
          <div className="card dark:bg-surface-800 dark:border-surface-700 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Delivery</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 flex items-center justify-center gap-1.5">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              {combo.delivery}
            </p>
          </div>
        </section>

        {/* ── What's Included ── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            What&apos;s included in this combo
          </h2>

          <div className="space-y-5">
            {resolvedItems.map((item, i) => {
              if (item.type === 'addon') {
                return (
                  <div
                    key={i}
                    className="card dark:bg-surface-800 dark:border-surface-700 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {item.label}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Bonus Add-on
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Included free with this combo package.
                      </p>
                    </div>
                  </div>
                );
              }

              const Icon = ICON_MAP[item.category] || CodeBracketIcon;
              const plan = item.planData;
              const cat = item.catData;

              return (
                <div key={i} className="card dark:bg-surface-800 dark:border-surface-700">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${cat?.lightBg || 'bg-gray-100 dark:bg-surface-700'} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${cat?.accentText || 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {item.label}
                        </h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cat?.lightBg || 'bg-gray-100'} ${cat?.accentText || 'text-gray-500'}`}
                        >
                          {cat?.name || item.category}
                        </span>
                      </div>
                      {plan && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {plan.bestFor} &middot; Delivery in {plan.delivery}
                        </p>
                      )}
                    </div>
                    {plan && (
                      <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatINR(plan.price)}
                      </span>
                    )}
                  </div>
                  {plan?.features && (
                    <div className="grid sm:grid-cols-2 gap-2 pl-14">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-sm">
                          <CheckIcon
                            className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                            strokeWidth={3}
                          />
                          <span className="text-gray-600 dark:text-gray-400">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Why Choose This Combo ── */}
        <section className="card dark:bg-surface-800 dark:border-surface-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            Why choose a combo?
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: TagIcon,
                title: 'Bundled Savings',
                desc: `Save ${combo.discount}% compared to buying each service individually.`,
              },
              {
                icon: ClockIcon,
                title: 'Faster Delivery',
                desc: 'Services are coordinated together for a streamlined timeline.',
              },
              {
                icon: ShieldCheckIcon,
                title: 'One Point of Contact',
                desc: 'A single project manager handles everything for you.',
              },
            ].map(({ icon: Ic, title, desc }) => (
              <div key={title} className="text-center p-4">
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `rgba(${combo.color}, 0.1)` }}
                >
                  <Ic className="w-5 h-5" style={{ color: `rgb(${combo.color})` }} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center">
          <button
            onClick={handleGetCombo}
            className={`inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98]`}
            style={{ background: gradientCSS }}
          >
            Get This Combo — {formatINR(combo.price)}
            <span>&rarr;</span>
          </button>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            You save {formatINR(combo.originalPrice - combo.price)} with this bundle
          </p>
        </section>

        {/* ── Other Combos ── */}
        {COMBO_PACKAGES.filter((c) => c.slug !== combo.slug).length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              Other combo packages
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {COMBO_PACKAGES.filter((c) => c.slug !== combo.slug).map((other) => {
                const otherGradient =
                  GRADIENT_MAP[other.gradient] || 'linear-gradient(135deg, #0ea5e9, #6366f1)';
                return (
                  <Link
                    key={other.slug}
                    to={`/combos/${other.slug}`}
                    className="card dark:bg-surface-800 dark:border-surface-700 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `rgba(${other.color}, 0.12)` }}
                      >
                        <TagIcon className="w-4 h-4" style={{ color: `rgb(${other.color})` }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {other.name}
                      </h3>
                      <span
                        className="ml-auto text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ background: otherGradient }}
                      >
                        Save {other.discount}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{other.tagline}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-gray-400 line-through">
                        {formatINR(other.originalPrice)}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatINR(other.price)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ComboDetail;
