import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatINR } from '../utils/currency';
import { PLAN_CATALOG, COMBO_PACKAGES, MONTHLY_PLANS, CATEGORY_ORDER } from '../utils/planCatalog';

/* ─── Scroll-triggered entrance ─── */
const FadeIn = ({ children, className = '', delay = 0, as: Tag = 'div' }) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`_fi ${vis ? '_fi-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

/* ─── Animated number ─── */
const Num = ({ end, suffix = '' }) => {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setGo(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!go) return;
    let s = null;
    const tick = (t) => {
      if (!s) s = t;
      const p = Math.min((t - s) / 1600, 1);
      setVal(Math.floor((1 - (1 - p) ** 4) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [go, end]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
};

/* ─── SVG Icons ─── */
const ICONS = {
  web: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8"
    />
  ),
  brand: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
    />
  ),
  app: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  ),
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />,
  arrow: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  ),
  clock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  sparkle: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
    />
  ),
};

const Icon = ({ name, size = 22, strokeWidth = 1.5, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    viewBox="0 0 24 24"
    className={className}
  >
    {ICONS[name]}
  </svg>
);

/* ─── Process steps ─── */
const STEPS = [
  {
    n: '01',
    t: 'Brief',
    d: 'Tell us what you need. We scope, price, and assign your project — usually within a day.',
  },
  {
    n: '02',
    t: 'Build',
    d: 'Track milestones live. Chat with our team, review work, and iterate in real-time.',
  },
  {
    n: '03',
    t: 'Ship',
    d: 'Production-ready delivery with full handover. You pay only on approval.',
  },
];

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('web-development');
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const authed = Boolean(user);

  const doLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const activeCatalog = PLAN_CATALOG[activeTab];

  return (
    <div className="hp">
      {/* ═══ NAV ═══ */}
      <nav className={`hp-nav ${scrolled ? 'hp-nav--s' : ''}`}>
        <div className="hp-nav__in">
          <Link to="/" className="hp-nav__brand">
            <img
              src="/wordmark_logo_white_.png"
              alt="SkyWorld"
              className="hp-nav__logo"
              style={{
                opacity: scrolled && !isDark ? 0 : 1,
                position: scrolled && !isDark ? 'absolute' : 'relative',
              }}
            />
            <img
              src="/wordmark_logo_coloured_.png"
              alt="SkyWorld"
              className="hp-nav__logo"
              style={{
                opacity: scrolled && !isDark ? 1 : 0,
                position: scrolled && !isDark ? 'relative' : 'absolute',
              }}
            />
          </Link>
          <div className="hp-nav__r">
            {authed ? (
              <>
                <Link
                  to={`/dashboard/${user?.role || 'client'}`}
                  className={`hp-nav__link hidden sm:block ${scrolled ? 'hp-nav__link--dark' : ''}`}
                >
                  Dashboard
                </Link>
                <button onClick={doLogout} className="hp-nav__cta">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hp-nav__link hidden sm:block ${scrolled ? 'hp-nav__link--dark' : ''}`}
                >
                  Log in
                </Link>
                <Link to="/register" className="hp-nav__cta">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="hp-hero">
        {/* Dot grid pattern */}
        <div className="hp-hero__dots" />
        {/* Soft brand-colored radial behind text */}
        <div className="hp-hero__glow" />

        <div className="hp-hero__content">
          <p className="hp-hero__pill" style={{ animationDelay: '.12s' }}>
            Digital Studio
          </p>

          <h1 className="hp-hero__h1">
            <span className="hp-hero__ln" style={{ animationDelay: '.2s' }}>
              We design &amp; build
            </span>
            <br />
            <span className="hp-hero__ln" style={{ animationDelay: '.34s' }}>
              digital products that
            </span>
            <br />
            <span className="hp-hero__ln hp-hero__ln--em" style={{ animationDelay: '.48s' }}>
              people love.
            </span>
          </h1>

          <p className="hp-hero__sub" style={{ animationDelay: '.62s' }}>
            A transparent, milestone-based process &mdash; so you always know what&rsquo;s
            happening, what&rsquo;s next, and what it costs.
          </p>

          <div className="hp-hero__btns" style={{ animationDelay: '.76s' }}>
            {authed ? (
              <>
                <Link
                  to={`/dashboard/${user?.role || 'client'}`}
                  className="hp-btn hp-btn--primary"
                >
                  Open Dashboard <span className="hp-btn__arr">&rarr;</span>
                </Link>
                <Link to="/services/web-development" className="hp-btn hp-btn--ghost">
                  Browse Services
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="hp-btn hp-btn--primary">
                  Start a project <span className="hp-btn__arr">&rarr;</span>
                </Link>
                <Link to="/login" className="hp-btn hp-btn--ghost">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats row anchored to bottom */}
        <div className="hp-hero__stats" style={{ animationDelay: '.9s' }}>
          {[
            { v: 150, s: '+', l: 'Projects' },
            { v: 80, s: '+', l: 'Clients' },
            { v: 99, s: '%', l: 'Satisfaction' },
            { v: 24, s: 'hr', l: 'Response' },
          ].map((d) => (
            <div key={d.l} className="hp-st">
              <span className="hp-st__v">
                <Num end={d.v} suffix={d.s} />
              </span>
              <span className="hp-st__l">{d.l}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ═══ SERVICES ═══ */}
      <section className="hp-svc">
        <div className="hp-wrap">
          <FadeIn>
            <div className="hp-svc__header">
              <h2 className="hp-sect-h">What we do</h2>
              <p className="hp-sect-sub">
                Three core services — each with clear, fixed-price plans so you know exactly what
                you get and what it costs.
              </p>
            </div>
          </FadeIn>

          <div className="hp-svc__grid">
            {CATEGORY_ORDER.map((slug, i) => {
              const cat = PLAN_CATALOG[slug];
              const low = Math.min(...cat.plans.map((p) => p.price));
              return (
                <FadeIn key={slug} delay={i * 100}>
                  <Link
                    to={`/services/${slug}`}
                    className="hp-svc__card"
                    style={{ '--c': cat.color, '--g': cat.gradientCSS }}
                  >
                    <div className="hp-svc__bar" />
                    <div className="hp-svc__top">
                      <div className="hp-svc__icon">
                        <Icon name={cat.icon} size={20} />
                      </div>
                      <Icon name="arrow" size={16} strokeWidth={2} className="hp-svc__arr" />
                    </div>
                    <h3 className="hp-svc__name">{cat.name}</h3>
                    <p className="hp-svc__tagline">{cat.tagline}</p>
                    <div className="hp-svc__foot">
                      <span className="hp-svc__from">From {formatINR(low)}</span>
                      <span className="hp-svc__count">
                        {cat.plans.length} plan{cat.plans.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — editorial style ═══ */}
      <section className="hp-proc">
        <div className="hp-wrap">
          <FadeIn>
            <h2 className="hp-sect-h">How it works</h2>
          </FadeIn>

          <div className="hp-proc__grid">
            {STEPS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 120}>
                <div className="hp-proc__item">
                  <span className="hp-proc__num">{s.n}</span>
                  <div>
                    <h3 className="hp-proc__title">{s.t}</h3>
                    <p className="hp-proc__desc">{s.d}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="hp-pricing">
        <div className="hp-wrap">
          <FadeIn>
            <h2 className="hp-sect-h">Transparent, fixed-price plans</h2>
            <p className="hp-sect-sub">
              Choose a service, pick your plan, and get started — no hidden fees.
            </p>
          </FadeIn>

          {/* Segmented tabs */}
          <FadeIn>
            <div className="hp-tabs">
              {CATEGORY_ORDER.map((slug) => {
                const cat = PLAN_CATALOG[slug];
                return (
                  <button
                    key={slug}
                    className={`hp-tab ${activeTab === slug ? 'hp-tab--on' : ''}`}
                    onClick={() => setActiveTab(slug)}
                    style={{ '--tc': `rgb(${cat.color})` }}
                  >
                    <Icon name={cat.icon} size={15} strokeWidth={2} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </FadeIn>

          {/* Plan cards */}
          <div className="hp-plans" key={activeTab}>
            {activeCatalog?.plans.map((plan, i) => (
              <FadeIn key={plan.slug} delay={i * 70}>
                <div
                  className={`hp-plan ${plan.popular ? 'hp-plan--pop' : ''}`}
                  style={{ '--c': activeCatalog.color, '--g': activeCatalog.gradientCSS }}
                >
                  {plan.popular && <span className="hp-plan__badge">Popular</span>}
                  <h3 className="hp-plan__name">{plan.name}</h3>
                  <p className="hp-plan__for">{plan.bestFor}</p>
                  <div className="hp-plan__pricing">
                    <span className="hp-plan__amount">{formatINR(plan.price)}</span>
                    <span className="hp-plan__delivery">
                      <Icon name="clock" size={13} strokeWidth={2} /> {plan.delivery}
                    </span>
                  </div>
                  <ul className="hp-plan__list">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/services/${activeTab}`}
                    className={`hp-plan__cta ${plan.popular ? 'hp-plan__cta--pop' : ''}`}
                  >
                    Choose {plan.name} <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                </div>
              </FadeIn>
            ))}

            {/* Custom plan — hidden for web-development (already has 3 plans) */}
            {activeTab !== 'web-development' && (
              <FadeIn delay={(activeCatalog?.plans.length || 0) * 70}>
                <div
                  className="hp-plan hp-plan--custom"
                  style={{ '--c': activeCatalog.color, '--g': activeCatalog.gradientCSS }}
                >
                  <h3 className="hp-plan__name">Custom Plan</h3>
                  <p className="hp-plan__for">
                    Need something beyond our packages? We build to your exact requirements.
                  </p>
                  <div className="hp-plan__pricing">
                    <span className="hp-plan__amount">Tailored</span>
                    <span className="hp-plan__delivery">
                      <Icon name="sparkle" size={13} strokeWidth={2} /> Scope-based timeline
                    </span>
                  </div>
                  <ul className="hp-plan__list">
                    <li>
                      <Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" />
                      Custom design &amp; architecture
                    </li>
                    <li>
                      <Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" />
                      Dedicated project manager
                    </li>
                    <li>
                      <Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" />
                      Milestone-based billing
                    </li>
                    <li>
                      <Icon name="check" size={15} strokeWidth={2.5} className="hp-plan__ck" />
                      Priority support
                    </li>
                  </ul>
                  <Link
                    to={authed ? `/custom-request?service=${activeTab}` : '/register'}
                    className="hp-plan__cta"
                  >
                    Request a Quote <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* ═══ COMBOS ═══ */}
      <section className="hp-combos">
        <div className="hp-wrap">
          <FadeIn>
            <h2 className="hp-sect-h">Bundle &amp; save</h2>
            <p className="hp-sect-sub">
              Pre-built service combinations for common business needs — at a bundled discount.
            </p>
          </FadeIn>

          <div className="hp-combos__grid">
            {COMBO_PACKAGES.map((combo, i) => (
              <FadeIn key={combo.slug} delay={i * 100}>
                <div className="hp-combo" style={{ '--c': combo.color }}>
                  <div className="hp-combo__save">Save {combo.discount}%</div>
                  <h3 className="hp-combo__name">{combo.name}</h3>
                  <p className="hp-combo__tagline">{combo.tagline}</p>
                  <div className="hp-combo__prices">
                    <span className="hp-combo__was">{formatINR(combo.originalPrice)}</span>
                    <span className="hp-combo__now">{formatINR(combo.price)}</span>
                  </div>
                  <ul className="hp-combo__list">
                    {combo.includes.map((item, j) => (
                      <li key={j}>
                        <Icon
                          name={item.addOn ? 'sparkle' : 'check'}
                          size={14}
                          strokeWidth={2.5}
                          className={item.addOn ? 'hp-combo__star' : 'hp-combo__ck'}
                        />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                  <div className="hp-combo__meta">
                    <span>
                      <Icon name="clock" size={12} strokeWidth={2} /> {combo.delivery}
                    </span>
                    <span className="hp-combo__dot">&middot;</span>
                    <span>{combo.bestFor}</span>
                  </div>
                  <Link
                    to={authed ? `/custom-request?service=combo&combo=${combo.slug}` : '/register'}
                    className="hp-combo__cta"
                  >
                    Get This Combo <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MONTHLY PLANS ═══ */}
      <section className="hp-monthly">
        <div className="hp-wrap">
          <FadeIn>
            <h2 className="hp-monthly__h2">Keep your site running smoothly</h2>
            <p className="hp-monthly__sub">
              Optional monthly plans for updates, monitoring, and creatives — so you can focus on
              your business.
            </p>
          </FadeIn>

          <div className="hp-monthly__grid">
            {MONTHLY_PLANS.map((plan, i) => (
              <FadeIn key={plan.slug} delay={i * 80}>
                <div className={`hp-mplan ${plan.popular ? 'hp-mplan--pop' : ''}`}>
                  {plan.popular && <span className="hp-mplan__badge">Best Value</span>}
                  <h3 className="hp-mplan__name">{plan.name}</h3>
                  <div className="hp-mplan__price">
                    <span className="hp-mplan__amt">{formatINR(plan.price)}</span>
                    <span className="hp-mplan__per">/month</span>
                  </div>
                  <ul className="hp-mplan__list">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Icon name="check" size={14} strokeWidth={2.5} className="hp-mplan__ck" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={authed ? '/custom-request?service=maintenance' : '/register'}
                    className={`hp-mplan__cta ${plan.popular ? 'hp-mplan__cta--pop' : ''}`}
                  >
                    Get Started
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA — gradient banner, split layout ═══ */}
      <section className="hp-cta">
        <div className="hp-wrap">
          <FadeIn>
            <div className="hp-cta__inner">
              <div className="hp-cta__text">
                <h2 className="hp-cta__h2">
                  Ready to take your
                  <br />
                  business online?
                </h2>
                <p className="hp-cta__sub">
                  Plans starting at {formatINR(2499)}. No upfront fees — pay 50% advance, rest on
                  approval.
                </p>
              </div>
              <div className="hp-cta__actions">
                {authed ? (
                  <Link
                    to={`/dashboard/${user?.role || 'client'}`}
                    className="hp-btn hp-btn--primary hp-btn--lg"
                  >
                    Open Dashboard <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                ) : (
                  <Link to="/register" className="hp-btn hp-btn--primary hp-btn--lg">
                    Create your account <span className="hp-btn__arr">&rarr;</span>
                  </Link>
                )}
                <a
                  href="mailto:ventures.skyworld@gmail.com"
                  className="hp-btn hp-btn--ghost hp-btn--lg"
                >
                  Get in touch
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="hp-ft">
        <div className="hp-wrap hp-ft__inner">
          <div className="hp-ft__left">
            <img
              src="/wordmark_logo_white_fullname.png"
              alt="SkyWorld Ventures"
              className="hp-ft__logo"
            />
            <span className="hp-ft__copy">&copy; 2026 SkyWorld Ventures</span>
          </div>
          <div className="hp-ft__social">
            <a
              href="https://www.youtube.com/@SkyWorldVentures"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              href="https://x.com/SkyWorldVenture"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/skyworldventures/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
          <div className="hp-ft__links">
            <Link to="/faq">FAQ</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>

      {/* ═════════════ STYLES ═════════════ */}
      <style>{`
/* ── Tokens ── */
.hp {
  --sky: #0ea5e9;
  --sky-deep: #0284c7;
  --sky-glow: rgba(14,165,233,.16);
  --indigo: #6366f1;
  --dark: #0f172a;
  --dark-2: #1e293b;
  --slate: #334155;
  --muted: #64748b;
  --faint: #94a3b8;
  --border: rgba(0,0,0,.06);
  --bg: #ffffff;
  --bg-off: #f8fafc;
  --card: #ffffff;
  --radius: 12px;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--dark);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* ── Fade-in util ── */
._fi {
  opacity: 0;
  transform: translateY(18px);
  filter: blur(4px);
  transition: opacity .6s cubic-bezier(.25,.46,.45,.94),
              transform .6s cubic-bezier(.25,.46,.45,.94),
              filter .6s cubic-bezier(.25,.46,.45,.94);
}
._fi._fi-in { opacity: 1; transform: none; filter: none; }

/* ══════════════════════════════════════════
   NAV
   ══════════════════════════════════════════ */
.hp-nav {
  position: fixed; inset: 0 0 auto; z-index: 100;
  transition: background .3s, box-shadow .3s, backdrop-filter .3s;
}
.hp-nav--s {
  background: rgba(255,255,255,.82);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 4px 20px rgba(0,0,0,.03);
}
.hp-nav__in {
  max-width: 1120px; margin: 0 auto; padding: 0 24px;
  height: 60px; display: flex; align-items: center; justify-content: space-between;
}
.hp-nav__brand { display: flex; align-items: center; text-decoration: none; }
.hp-nav__logo { height: 26px; width: auto; object-fit: contain; transition: opacity .3s; }
.hp-nav__r { display: flex; align-items: center; gap: 8px; }
.hp-nav__link {
  font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 8px;
  text-decoration: none; color: rgba(255,255,255,.5); transition: color .2s;
}
.hp-nav__link:hover { color: rgba(255,255,255,.9); }
.hp-nav__link--dark { color: #64748b; }
.hp-nav__link--dark:hover { color: #0f172a; }
.hp-nav__cta {
  font-size: 13px; font-weight: 600; color: #fff; background: var(--sky);
  border: none; cursor: pointer; padding: 8px 18px; border-radius: 8px;
  text-decoration: none; transition: background .2s, transform .15s, box-shadow .2s;
  position: relative; overflow: hidden;
}
.hp-nav__cta::after {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
  transition: left .5s ease;
}
.hp-nav__cta:hover::after { left: 100%; }
.hp-nav__cta:hover { background: var(--sky-deep); transform: translateY(-1px); box-shadow: 0 4px 16px var(--sky-glow); }

/* ══════════════════════════════════════════
   BUTTONS
   ══════════════════════════════════════════ */
.hp-btn {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: var(--radius);
  text-decoration: none; cursor: pointer; border: none; transition: all .2s;
}
.hp-btn--primary { color: #fff; background: var(--sky); position: relative; overflow: hidden; }
.hp-btn--primary::after {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
  transition: left .5s ease;
}
.hp-btn--primary:hover::after { left: 100%; }
.hp-btn--primary:hover {
  background: var(--sky-deep); transform: translateY(-1px);
  box-shadow: 0 4px 20px var(--sky-glow);
}
.hp-btn--ghost {
  color: rgba(255,255,255,.4); background: transparent;
  border: 1px solid rgba(255,255,255,.1);
}
.hp-btn--ghost:hover { color: #fff; border-color: rgba(255,255,255,.25); }
.hp-btn--lg { padding: 14px 28px; font-size: 15px; }
.hp-btn__arr { display: inline-block; transition: transform .2s; margin-left: 2px; }
.hp-btn:hover .hp-btn__arr { transform: translateX(3px); }

/* ══════════════════════════════════════════
   SHARED
   ══════════════════════════════════════════ */
.hp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.hp-sect-h {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 700; letter-spacing: -.035em; line-height: 1.1;
  color: var(--dark); margin: 0;
}
.hp-sect-sub {
  font-size: 16px; line-height: 1.7; color: var(--muted);
  margin-top: 14px; max-width: 520px;
}

/* ══════════════════════════════════════════
   HERO
   ══════════════════════════════════════════ */
.hp-hero {
  position: relative; background: var(--dark);
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 80px 24px 0; overflow: hidden;
}

/* Dot grid */
.hp-hero__dots {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(rgba(148,163,184,.07) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 45%, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 45%, black 0%, transparent 75%);
}

/* Soft radial glow */
.hp-hero__glow {
  position: absolute; width: 700px; height: 700px;
  top: 50%; left: 50%; transform: translate(-50%, -55%);
  background: radial-gradient(circle, rgba(14,165,233,.06) 0%, transparent 65%);
  pointer-events: none;
}

/* Content wrapper */
.hp-hero__content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; max-width: 900px;
}

/* Pill badge */
.hp-hero__pill {
  display: inline-block;
  font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: var(--sky); border: 1px solid rgba(14,165,233,.25);
  padding: 6px 20px; border-radius: 50px; margin: 0 0 32px;
  animation: _heroIn .6s cubic-bezier(.25,.46,.45,.94) both;
}

/* Heading & line animation */
.hp-hero__h1 {
  font-size: clamp(2.4rem, 5.5vw, 4.2rem);
  font-weight: 800; letter-spacing: -.04em; line-height: 1.12;
  color: #f1f5f9; margin: 0;
}
.hp-hero__ln {
  display: inline-block;
  animation: _heroIn .65s cubic-bezier(.25,.46,.45,.94) both;
}
.hp-hero__ln--em {
  color: var(--sky);
}

@keyframes _heroIn {
  from { opacity: 0; transform: translateY(22px); filter: blur(4px); }
  to   { opacity: 1; transform: none; filter: none; }
}

/* Subtitle */
.hp-hero__sub {
  font-size: 16px; line-height: 1.75; color: rgba(148,163,184,.55);
  margin: 28px auto 0; max-width: 520px;
  animation: _heroIn .6s cubic-bezier(.25,.46,.45,.94) both;
}

/* Buttons */
.hp-hero__btns {
  display: flex; gap: 14px; margin-top: 36px; justify-content: center;
  animation: _heroIn .6s cubic-bezier(.25,.46,.45,.94) both;
}

/* Stats bar — anchored to bottom */
.hp-hero__stats {
  position: relative; z-index: 1;
  display: flex; width: min(85%, 840px);
  margin-top: auto; padding: 40px 0 48px;
  border-top: 1px solid rgba(148,163,184,.08);
  animation: _heroIn .6s cubic-bezier(.25,.46,.45,.94) both;
}
.hp-st { flex: 1; text-align: center; position: relative; }
.hp-st:not(:last-child)::after {
  content: ''; position: absolute; right: 0; top: 10%; height: 80%;
  width: 1px; background: rgba(148,163,184,.08);
}
.hp-st__v {
  display: block; font-size: clamp(1.3rem, 2.5vw, 1.8rem); font-weight: 800;
  color: #f1f5f9; letter-spacing: -.02em; font-variant-numeric: tabular-nums;
}
.hp-st__l {
  display: block; font-size: 11px; font-weight: 600;
  color: rgba(148,163,184,.28); letter-spacing: .08em; text-transform: uppercase;
  margin-top: 4px;
}

/* ══════════════════════════════════════════
   SERVICES
   ══════════════════════════════════════════ */
.hp-svc {
  padding: 120px 0; background: var(--bg-off); position: relative; overflow: hidden;
}
.hp-svc::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(14,165,233,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,165,233,.025) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(180deg, transparent 5%, rgba(0,0,0,.5) 40%, rgba(0,0,0,.5) 60%, transparent 95%);
  -webkit-mask-image: linear-gradient(180deg, transparent 5%, rgba(0,0,0,.5) 40%, rgba(0,0,0,.5) 60%, transparent 95%);
  pointer-events: none;
}
.hp-svc__header { max-width: 520px; margin-bottom: 52px; }
.hp-svc__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.hp-svc__grid > ._fi { display: flex; }
.hp-svc__grid > ._fi > * { flex: 1; }
.hp-svc__card {
  position: relative; display: flex; flex-direction: column;
  padding: 32px 28px 28px; background: var(--card); text-decoration: none; color: inherit;
  border-radius: 14px; border: 1px solid var(--border); overflow: hidden;
  transition: transform .35s cubic-bezier(.25,.46,.45,.94), box-shadow .35s, border-color .35s;
}
.hp-svc__card::after {
  content: ''; position: absolute; inset: 0; opacity: 0;
  background: radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--c),.06), transparent 40%);
  transition: opacity .35s;
}
.hp-svc__card:hover::after { opacity: 1; }
.hp-svc__card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 50px -14px rgba(var(--c),.14), 0 0 40px -12px rgba(var(--c),.08);
  border-color: rgba(var(--c),.18);
}
.hp-svc__bar {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--g); opacity: 0; transition: opacity .3s;
}
.hp-svc__card:hover .hp-svc__bar { opacity: 1; }
.hp-svc__top {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px;
}
.hp-svc__icon {
  width: 42px; height: 42px; border-radius: 10px; background: var(--g); color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: transform .35s cubic-bezier(.25,.46,.45,.94), box-shadow .35s;
}
.hp-svc__card:hover .hp-svc__icon {
  transform: scale(1.08) rotate(-3deg);
  box-shadow: 0 4px 16px rgba(var(--c),.2);
}
.hp-svc__arr { color: rgba(var(--c),.2); transition: color .3s, transform .3s; }
.hp-svc__card:hover .hp-svc__arr { color: rgb(var(--c)); transform: translate(2px,-2px); }
.hp-svc__name {
  font-size: 17px; font-weight: 650; letter-spacing: -.01em;
  color: var(--dark); margin-bottom: 6px;
}
.hp-svc__tagline {
  font-size: 14px; line-height: 1.6; color: var(--muted);
  flex: 1; margin-bottom: 22px;
}
.hp-svc__foot {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 16px; border-top: 1px solid var(--border);
}
.hp-svc__from { font-size: 14px; font-weight: 700; color: var(--dark); }
.hp-svc__count { font-size: 12px; color: var(--faint); font-weight: 500; }

/* ══════════════════════════════════════════
   PROCESS — large ghost numbers
   ══════════════════════════════════════════ */
.hp-proc {
  padding: 100px 0; background: var(--bg);
  border-top: none; position: relative;
}
.hp-proc::after {
  content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: min(80%, 900px); height: 1px;
  background: linear-gradient(90deg, transparent, rgba(14,165,233,.2), var(--sky), rgba(14,165,233,.2), transparent);
}
.hp-proc .hp-sect-h { margin-bottom: 48px; }
.hp-proc__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; position: relative; }
.hp-proc__item { display: flex; gap: 16px; position: relative; }
.hp-proc__num {
  font-size: 52px; font-weight: 800; letter-spacing: -.05em; line-height: 1;
  color: rgba(14,165,233,.1); flex-shrink: 0; font-variant-numeric: tabular-nums;
  transition: color .4s;
}
.hp-proc__item:hover .hp-proc__num { color: rgba(14,165,233,.2); }
.hp-proc__title {
  font-size: 16px; font-weight: 650; color: var(--dark);
  margin-bottom: 6px; padding-top: 6px;
}
.hp-proc__desc { font-size: 14px; line-height: 1.65; color: var(--muted); }

/* ══════════════════════════════════════════
   PRICING — segmented tabs
   ══════════════════════════════════════════ */
.hp-pricing {
  padding: 120px 0; background: var(--bg-off); position: relative; overflow: hidden;
}
.hp-pricing::before {
  content: ''; position: absolute; inset: 0;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 80px,
    rgba(14,165,233,.018) 80px,
    rgba(14,165,233,.018) 81px
  );
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 75%);
  pointer-events: none;
}
.hp-pricing .hp-sect-sub { margin-bottom: 0; }

.hp-tabs {
  display: inline-flex; gap: 4px; margin-top: 36px;
  background: rgba(0,0,0,.04); padding: 4px; border-radius: 12px;
}
.hp-tab {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 10px;
  border: none; background: transparent; color: var(--muted); cursor: pointer;
  transition: all .25s cubic-bezier(.25,.46,.45,.94);
}
.hp-tab:hover { color: var(--dark); background: rgba(0,0,0,.02); }
.hp-tab--on {
  background: var(--card); color: var(--dark);
  box-shadow: 0 1px 4px rgba(0,0,0,.07), 0 2px 12px rgba(0,0,0,.03);
  transform: scale(1.02);
}
.hp-tab--on svg { color: var(--tc); }

.hp-plans {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr));
  gap: 18px; margin-top: 28px;
}
.hp-plans > ._fi { display: flex; }
.hp-plans > ._fi > * { flex: 1; }
.hp-plan {
  position: relative; display: flex; flex-direction: column;
  padding: 30px 26px 26px; background: var(--card);
  border: 1px solid var(--border); border-radius: 14px;
  transition: transform .35s cubic-bezier(.25,.46,.45,.94), box-shadow .35s, border-color .35s;
}
.hp-plan:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 44px rgba(0,0,0,.06), 0 0 30px -10px rgba(var(--c),.08);
}
.hp-plan--pop {
  border-color: rgba(var(--c),.25);
  box-shadow: 0 0 0 1px rgba(var(--c),.06);
  position: relative;
}
.hp-plan--pop::before {
  content: ''; position: absolute; inset: -1px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(var(--c),.15), transparent 50%, rgba(var(--c),.1));
  z-index: -1; opacity: 0; transition: opacity .4s;
}
.hp-plan--pop:hover::before { opacity: 1; }
.hp-plan--pop:hover {
  box-shadow: 0 0 0 1px rgba(var(--c),.1), 0 16px 48px rgba(var(--c),.12), 0 0 60px -20px rgba(var(--c),.15);
}
.hp-plan--custom { border-style: dashed; }
.hp-plan__badge {
  position: absolute; top: 14px; right: 14px;
  font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  color: rgb(var(--c)); background: rgba(var(--c),.08);
  padding: 4px 10px; border-radius: 6px;
}
.hp-plan__name {
  font-size: 17px; font-weight: 700; color: var(--dark); letter-spacing: -.01em;
}
.hp-plan__for {
  font-size: 13px; color: var(--muted); margin-top: 4px; line-height: 1.5;
}
.hp-plan__pricing {
  margin: 18px 0; padding-bottom: 18px; border-bottom: 1px solid var(--border);
}
.hp-plan__amount {
  font-size: 28px; font-weight: 800; color: var(--dark); letter-spacing: -.03em;
}
.hp-plan__delivery {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--faint); margin-top: 4px;
}
.hp-plan__list { list-style: none; padding: 0; margin: 0 0 24px; flex: 1; }
.hp-plan__list li {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--slate); padding: 4px 0; line-height: 1.5;
}
.hp-plan__ck { color: #10b981; flex-shrink: 0; margin-top: 2px; }
.hp-plan__cta {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 11px; border-radius: 10px;
  font-size: 14px; font-weight: 600; text-decoration: none;
  border: 1px solid var(--border); color: var(--dark); background: var(--card);
  cursor: pointer; transition: all .2s;
}
.hp-plan__cta:hover { border-color: rgba(var(--c),.35); color: rgb(var(--c)); }
.hp-plan__cta--pop { background: var(--g); color: #fff; border: none; position: relative; overflow: hidden; }
.hp-plan__cta--pop::after {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
  transition: left .5s ease;
}
.hp-plan__cta--pop:hover::after { left: 100%; }
.hp-plan__cta--pop:hover {
  box-shadow: 0 4px 18px rgba(var(--c),.25); transform: translateY(-1px);
}

/* ══════════════════════════════════════════
   COMBOS
   ══════════════════════════════════════════ */
.hp-combos {
  padding: 120px 0; background: var(--bg);
  border-top: none;
  position: relative; overflow: hidden;
}
.hp-combos > .hp-wrap::before {
  content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: min(80%, 900px); height: 1px;
  background: linear-gradient(90deg, transparent, rgba(14,165,233,.2), var(--sky), rgba(14,165,233,.2), transparent);
}
.hp-combos::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(14,165,233,.015) 60px, rgba(14,165,233,.015) 61px),
    repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(14,165,233,.015) 60px, rgba(14,165,233,.015) 61px);
  mask-image: radial-gradient(ellipse 60% 55% at 50% 50%, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 60% 55% at 50% 50%, black 0%, transparent 70%);
  pointer-events: none;
}
.hp-combos .hp-sect-sub { margin-bottom: 0; }
.hp-combos__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px;
}
.hp-combos__grid > ._fi { display: flex; }
.hp-combos__grid > ._fi > * { flex: 1; }
.hp-combo {
  position: relative; display: flex; flex-direction: column;
  padding: 30px 26px 26px; background: var(--card);
  border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
  transition: transform .35s cubic-bezier(.25,.46,.45,.94), box-shadow .35s;
}
.hp-combo::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--g, linear-gradient(135deg, var(--sky), var(--indigo)));
  opacity: 0; transition: opacity .35s;
}
.hp-combo:hover::after { opacity: 1; }
.hp-combo:hover {
  transform: translateY(-5px);
  box-shadow: 0 18px 50px rgba(var(--c),.1), 0 0 30px -10px rgba(var(--c),.06);
}
.hp-combo__save {
  display: inline-flex; align-self: flex-start;
  font-size: 11px; font-weight: 700; letter-spacing: .03em;
  color: #fff; background: linear-gradient(135deg, #10b981, #059669);
  padding: 4px 11px; border-radius: 6px; margin-bottom: 16px;
}
.hp-combo__name { font-size: 18px; font-weight: 700; color: var(--dark); }
.hp-combo__tagline {
  font-size: 13px; color: var(--muted); margin-top: 4px;
  line-height: 1.5; margin-bottom: 18px;
}
.hp-combo__prices {
  display: flex; align-items: baseline; gap: 10px; margin-bottom: 18px;
}
.hp-combo__was { font-size: 15px; color: var(--faint); text-decoration: line-through; }
.hp-combo__now {
  font-size: 26px; font-weight: 800; color: var(--dark); letter-spacing: -.03em;
}
.hp-combo__list { list-style: none; padding: 0; margin: 0 0 18px; flex: 1; }
.hp-combo__list li {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--slate); padding: 4px 0;
}
.hp-combo__ck { color: #10b981; flex-shrink: 0; }
.hp-combo__star { color: var(--sky); flex-shrink: 0; }
.hp-combo__meta {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 12px; color: var(--faint); margin-bottom: 18px;
}
.hp-combo__meta span { display: flex; align-items: center; gap: 4px; }
.hp-combo__dot { color: var(--faint); }
.hp-combo__cta {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 11px; border-radius: 10px;
  font-size: 14px; font-weight: 600; text-decoration: none;
  background: var(--dark); color: #fff; cursor: pointer;
  transition: all .25s cubic-bezier(.25,.46,.45,.94); border: none;
  position: relative; overflow: hidden;
}
.hp-combo__cta::after {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
  transition: left .5s ease;
}
.hp-combo__cta:hover::after { left: 100%; }
.hp-combo__cta:hover {
  background: var(--dark-2); transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,.12);
}

/* ══════════════════════════════════════════
   MONTHLY PLANS
   ══════════════════════════════════════════ */
.hp-monthly {
  padding: 120px 0; background: var(--dark); position: relative; overflow: hidden;
}
.hp-monthly::before {
  content: ''; position: absolute; inset: 0;
  background-image: radial-gradient(rgba(14,165,233,.045) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse 65% 60% at 50% 50%, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 65% 60% at 50% 50%, black 0%, transparent 70%);
  pointer-events: none;
}
.hp-monthly__h2 {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 700; letter-spacing: -.035em; line-height: 1.1;
  color: #f1f5f9; margin: 0;
}
.hp-monthly__sub {
  font-size: 16px; color: rgba(148,163,184,.45);
  margin-top: 14px; line-height: 1.7; max-width: 520px;
}
.hp-monthly__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 48px;
}
.hp-monthly__grid > ._fi { display: flex; }
.hp-monthly__grid > ._fi > * { flex: 1; }
.hp-mplan {
  display: flex; flex-direction: column;
  padding: 30px 26px; background: rgba(30,41,59,.45);
  border: 1px solid rgba(255,255,255,.05); border-radius: 14px;
  backdrop-filter: blur(10px); position: relative; overflow: hidden;
  transition: transform .35s cubic-bezier(.25,.46,.45,.94), box-shadow .35s, border-color .35s;
}
.hp-mplan::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--sky), var(--indigo), #c084fc);
  opacity: 0; transition: opacity .35s;
}
.hp-mplan:hover::after { opacity: 1; }
.hp-mplan:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 44px rgba(0,0,0,.3), 0 0 40px -12px rgba(14,165,233,.08);
  border-color: rgba(14,165,233,.12);
}
.hp-mplan--pop { border-color: rgba(14,165,233,.25); }
.hp-mplan__badge {
  position: absolute; top: 14px; right: 14px;
  font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  color: var(--sky); background: rgba(14,165,233,.1);
  padding: 4px 10px; border-radius: 6px;
}
.hp-mplan__name {
  font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 12px;
}
.hp-mplan__price {
  display: flex; align-items: baseline; gap: 2px; margin-bottom: 22px;
}
.hp-mplan__amt {
  font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -.03em;
}
.hp-mplan__per { font-size: 14px; color: rgba(148,163,184,.35); }
.hp-mplan__list { list-style: none; padding: 0; margin: 0 0 24px; flex: 1; }
.hp-mplan__list li {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #94a3b8; padding: 4px 0;
}
.hp-mplan__ck { color: #10b981; flex-shrink: 0; }
.hp-mplan__cta {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 11px; border-radius: 10px;
  font-size: 14px; font-weight: 600; text-decoration: none;
  border: 1px solid rgba(255,255,255,.07); color: rgba(255,255,255,.45);
  background: transparent; cursor: pointer; transition: all .2s;
}
.hp-mplan__cta:hover { border-color: rgba(14,165,233,.3); color: #fff; }
.hp-mplan__cta--pop {
  background: linear-gradient(135deg, var(--sky), var(--indigo));
  color: #fff; border: none;
}
.hp-mplan__cta--pop:hover { box-shadow: 0 4px 18px rgba(14,165,233,.3); }

/* ══════════════════════════════════════════
   CTA — gradient banner
   ══════════════════════════════════════════ */
.hp-cta {
  padding: 100px 0; position: relative; overflow: hidden;
  background: linear-gradient(145deg, #0c4a6e 0%, var(--dark) 100%);
}
.hp-cta > .hp-wrap { position: relative; z-index: 1; }
.hp-cta::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    repeating-linear-gradient(135deg, transparent, transparent 50px, rgba(255,255,255,.012) 50px, rgba(255,255,255,.012) 51px),
    repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,.012) 50px, rgba(255,255,255,.012) 51px);
  pointer-events: none;
}
.hp-cta::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.025'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  mix-blend-mode: overlay; opacity: .3;
}
.hp-cta__inner {
  display: flex; align-items: center; justify-content: space-between; gap: 48px;
}
.hp-cta__text { flex: 1; }
.hp-cta__h2 {
  font-size: clamp(1.75rem, 3.8vw, 2.6rem);
  font-weight: 700; letter-spacing: -.03em; line-height: 1.15;
  color: #f1f5f9; margin: 0;
}
.hp-cta__sub {
  font-size: 15px; line-height: 1.65;
  color: rgba(148,163,184,.45); margin-top: 12px;
}
.hp-cta__actions { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
.hp-cta .hp-btn--ghost {
  color: rgba(148,163,184,.45); border-color: rgba(255,255,255,.08);
}
.hp-cta .hp-btn--ghost:hover { color: #fff; border-color: rgba(255,255,255,.2); }

/* ══════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════ */
.hp-ft {
  background: var(--dark); border-top: 1px solid rgba(255,255,255,.04); padding: 28px 0;
}
.hp-ft__inner {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 16px;
}
.hp-ft__left { display: flex; align-items: center; gap: 10px; }
.hp-ft__logo { height: 22px; width: auto; opacity: .4; }
.hp-ft__copy { font-size: 12px; color: rgba(148,163,184,.22); }
.hp-ft__links { display: flex; gap: 24px; }
.hp-ft__links a {
  font-size: 12px; color: rgba(148,163,184,.28);
  text-decoration: none; transition: color .2s;
}
.hp-ft__links a:hover { color: rgba(255,255,255,.55); }
.hp-ft__social { display: flex; align-items: center; gap: 16px; }
.hp-ft__social a {
  color: rgba(148,163,184,.28); transition: color .2s;
  display: flex; align-items: center;
}
.hp-ft__social a:hover { color: rgba(255,255,255,.6); }

/* ══════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════ */
@media (max-width: 960px) {
  .hp-svc__grid { grid-template-columns: 1fr 1fr; }
  .hp-combos__grid { grid-template-columns: 1fr 1fr; }
  .hp-monthly__grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .hp-hero { min-height: 100vh; padding: 100px 20px 0; }
  .hp-hero__content { text-align: center; }
  .hp-hero__stats { flex-wrap: wrap; gap: 16px; width: 100%; }
  .hp-st { flex: 1 0 40%; }
  .hp-st:not(:last-child)::after { display: none; }
  .hp-hero__btns { flex-direction: column; align-items: stretch; }  .hp-svc__grid { grid-template-columns: 1fr; }
  .hp-proc__grid { grid-template-columns: 1fr; gap: 20px; }
  .hp-plans { grid-template-columns: 1fr; }
  .hp-combos__grid { grid-template-columns: 1fr; }
  .hp-monthly__grid { grid-template-columns: 1fr; }
  .hp-tabs { flex-wrap: wrap; }
  .hp-cta__inner { flex-direction: column; text-align: center; }
  .hp-cta__actions { align-items: center; }
  .hp-hero__btns { flex-direction: column; align-items: stretch; }
  .hp-btn { justify-content: center; }
  .hp-ft__inner { flex-direction: column; text-align: center; }
}
@media (max-width: 480px) {
  .hp-hero__h1 { font-size: 2rem; }
  .hp-hero__stats { flex-direction: column; gap: 12px; width: 100%; }
  .hp-st { flex: none; }
  .hp-hero__pill { font-size: 10px; padding: 5px 16px; margin-bottom: 24px; }
  .hp-svc { padding: 80px 0; }
  .hp-pricing { padding: 80px 0; }
  .hp-combos { padding: 80px 0; }
  .hp-monthly { padding: 80px 0; }
  .hp-proc { padding: 70px 0; }
  .hp-cta { padding: 70px 0; }
  .hp-svc__card { padding: 26px 22px 24px; }
  .hp-plan { padding: 24px 20px 22px; }
  .hp-combo { padding: 24px 20px 22px; }
}

/* ══════════════════════════════════════════
   DARK MODE
   ══════════════════════════════════════════ */
.dark .hp {
  --bg: #0f172a; --bg-off: #0c1220; --card: rgba(30,41,59,.75);
  --border: rgba(255,255,255,.06);
}
.dark .hp-sect-h { color: #f1f5f9; }
.dark .hp-sect-sub { color: #94a3b8; }
.dark .hp-nav--s {
  background: rgba(15,23,42,.82);
  box-shadow: 0 1px 0 rgba(255,255,255,.04), 0 4px 20px rgba(0,0,0,.12);
}
.dark .hp-nav__link--dark { color: #64748b; }
.dark .hp-nav__link--dark:hover { color: #f1f5f9; }

/* Services — dark */
.dark .hp-svc { background: var(--bg-off); }
.dark .hp-svc::before {
  background-image:
    linear-gradient(rgba(14,165,233,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,165,233,.04) 1px, transparent 1px);
}
.dark .hp-svc__card {
  background: linear-gradient(145deg, rgba(30,41,59,.9), rgba(15,23,42,.85));
  border-color: rgba(255,255,255,.06);
}
.dark .hp-svc__card:hover {
  border-color: rgba(var(--c),.3);
  box-shadow: 0 0 0 1px rgba(var(--c),.08), 0 20px 50px -14px rgba(var(--c),.2);
}
.dark .hp-svc__name { color: #f1f5f9; }
.dark .hp-svc__tagline { color: #94a3b8; }
.dark .hp-svc__from { color: #f1f5f9; }
.dark .hp-svc__count { color: #64748b; }
.dark .hp-svc__foot { border-top-color: rgba(255,255,255,.06); }

/* Process — dark */
.dark .hp-proc { background: var(--bg); }
.dark .hp-proc::after {
  background: linear-gradient(90deg, transparent, rgba(14,165,233,.15), rgba(14,165,233,.3), rgba(14,165,233,.15), transparent);
}
.dark .hp-proc__num { color: rgba(14,165,233,.14); }
.dark .hp-proc__item:hover .hp-proc__num { color: rgba(14,165,233,.25); }
.dark .hp-proc__title { color: #f1f5f9; }
.dark .hp-proc__desc { color: #94a3b8; }

/* Pricing — dark */
.dark .hp-pricing { background: var(--bg-off); }
.dark .hp-pricing::before {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 80px,
    rgba(14,165,233,.03) 80px,
    rgba(14,165,233,.03) 81px
  );
}
.dark .hp-tabs { background: rgba(255,255,255,.04); }
.dark .hp-tab { color: #64748b; }
.dark .hp-tab:hover { color: #f1f5f9; background: rgba(255,255,255,.03); }
.dark .hp-tab--on {
  background: rgba(30,41,59,.9); color: #f1f5f9;
  box-shadow: 0 1px 4px rgba(0,0,0,.2), 0 2px 12px rgba(0,0,0,.1);
}
.dark .hp-plan {
  background: rgba(30,41,59,.6); border-color: rgba(255,255,255,.06);
}
.dark .hp-plan:hover {
  box-shadow: 0 16px 48px rgba(0,0,0,.35); border-color: rgba(var(--c),.18);
}
.dark .hp-plan--pop {
  border-color: rgba(var(--c),.3);
  box-shadow: 0 0 0 1px rgba(var(--c),.08), 0 8px 30px rgba(var(--c),.1);
}
.dark .hp-plan__name { color: #f1f5f9; }
.dark .hp-plan__for { color: #94a3b8; }
.dark .hp-plan__amount { color: #f1f5f9; }
.dark .hp-plan__list li { color: #cbd5e1; }
.dark .hp-plan__pricing { border-bottom-color: rgba(255,255,255,.06); }
.dark .hp-plan__cta {
  background: rgba(30,41,59,.7); border-color: rgba(255,255,255,.07); color: #cbd5e1;
}
.dark .hp-plan__cta:hover { border-color: rgba(var(--c),.35); color: rgb(var(--c)); }

/* Combos — dark */
.dark .hp-combos { background: var(--bg); }
.dark .hp-combos > .hp-wrap::before {
  background: linear-gradient(90deg, transparent, rgba(14,165,233,.15), rgba(14,165,233,.3), rgba(14,165,233,.15), transparent);
}
.dark .hp-combos::before {
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(14,165,233,.03) 60px, rgba(14,165,233,.03) 61px),
    repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(14,165,233,.03) 60px, rgba(14,165,233,.03) 61px);
}
.dark .hp-combo {
  background: rgba(30,41,59,.6); border-color: rgba(255,255,255,.06);
}
.dark .hp-combo:hover {
  box-shadow: 0 18px 50px rgba(var(--c),.12); border-color: rgba(var(--c),.18);
}
.dark .hp-combo__name { color: #f1f5f9; }
.dark .hp-combo__tagline { color: #94a3b8; }
.dark .hp-combo__was { color: #64748b; }
.dark .hp-combo__now { color: #f1f5f9; }
.dark .hp-combo__list li { color: #cbd5e1; }
.dark .hp-combo__cta { background: #f1f5f9; color: #0f172a; }
.dark .hp-combo__cta:hover { background: #fff; }
      `}</style>
    </div>
  );
};

export default Home;
