import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';

/* ─── Scroll-triggered entrance ─── */
const FadeIn = ({ children, className = '', delay = 0, as: Tag = 'div' }) => {
    const ref = useRef(null);
    const [vis, setVis] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <Tag
            ref={ref}
            className={`_fi ${vis ? '_fi-in' : ''} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >{children}</Tag>
    );
};

/* ─── Animated number ─── */
const Num = ({ end, suffix = '' }) => {
    const ref = useRef(null);
    const [val, setVal] = useState(0);
    const [go, setGo] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); obs.disconnect(); } }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    useEffect(() => {
        if (!go) return; let s = null;
        const tick = (t) => { if (!s) s = t; const p = Math.min((t - s) / 1600, 1); setVal(Math.floor((1 - (1 - p) ** 4) * end)); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
    }, [go, end]);
    return <span ref={ref}>{val}{suffix}</span>;
};

/* ─── Service card data ─── */
const SERVICES = {
    'app-development': {
        title: 'App Development',
        desc: 'iOS, Android & cross-platform apps built for performance and retention.',
        tags: ['Flutter', 'React Native', 'Kotlin'],
        color: '14,165,233',
        gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    },
    'web-development': {
        title: 'Web Development',
        desc: 'SaaS platforms, marketing sites & web apps — fast, accessible, scalable.',
        tags: ['React', 'Node.js', 'Next.js'],
        color: '139,92,246',
        gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8" />,
    },
    'branding-creative': {
        title: 'Branding & Design',
        desc: 'Logo systems, UI/UX, and creative direction that builds recognition.',
        tags: ['Figma', 'UI/UX', 'Identity'],
        color: '245,158,11',
        gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />,
    }
};

const STEPS = [
    { n: '01', t: 'Brief', d: 'Tell us what you need. We scope, price, and assign a team — usually within a day.' },
    { n: '02', t: 'Build', d: 'Track milestones live. Chat with your team, review work, iterate in real-time.' },
    { n: '03', t: 'Ship', d: 'Production-ready delivery with docs & handover. Pay on approval.' },
];

const Home = () => {
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const authed = Boolean(user);

    const { data: liveServices = [] } = useQuery(
        ['home-services'],
        async () => { const r = await api.get('/services'); return r.data?.services || []; },
        { staleTime: 30_000 }
    );

    const cards = useMemo(() => {
        const order = ['app-development', 'web-development', 'branding-creative'];
        const live = liveServices.reduce((m, s) => {
            const prev = m.get(s.category);
            if (!prev || new Date(s.updatedAt || 0) >= new Date(prev.updatedAt || 0)) m.set(s.category, s);
            return m;
        }, new Map());
        return order.map(slug => {
            const c = SERVICES[slug], l = live.get(slug);
            return { ...c, slug, title: l?.name || c.title, desc: l?.description || c.desc, price: Number(l?.basePrice ?? 0) };
        });
    }, [liveServices]);

    const doLogout = async () => { await logout(); navigate('/', { replace: true }); };

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div className="hp">

            {/* ── NAV ── */}
            <nav className={`hp-nav ${scrolled ? 'hp-nav--s' : ''}`}>
                <div className="hp-nav__in">
                    <Link to="/" className="hp-nav__brand">
                        <img src="/wordmark_logo_white_.png" alt="SkyWorld" className="hp-nav__logo" style={{ opacity: scrolled ? 0 : 1, position: scrolled ? 'absolute' : 'relative' }} />
                        <img src="/wordmark_logo_coloured_.png" alt="SkyWorld" className="hp-nav__logo" style={{ opacity: scrolled ? 1 : 0, position: scrolled ? 'relative' : 'absolute' }} />
                    </Link>
                    <div className="hp-nav__r">
                        {authed ? (
                            <>
                                <Link to={`/dashboard/${user?.role || 'client'}`}
                                    className={`hp-nav__link hidden sm:block ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/50 hover:text-white'}`}>
                                    Dashboard
                                </Link>
                                <button onClick={doLogout} className="hp-nav__cta">Sign Out</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={`hp-nav__link hidden sm:block ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/50 hover:text-white'}`}>
                                    Log in
                                </Link>
                                <Link to="/register" className="hp-nav__cta">Get Started</Link>
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
                    <p className="hp-hero__pill" style={{ animationDelay: '.12s' }}>Digital Studio</p>

                    <h1 className="hp-hero__h1">
                        <span className="hp-hero__ln" style={{ animationDelay: '.2s' }}>We design &amp; build</span>
                        <br />
                        <span className="hp-hero__ln" style={{ animationDelay: '.34s' }}>digital products that</span>
                        <br />
                        <span className="hp-hero__ln hp-hero__ln--em" style={{ animationDelay: '.48s' }}>people love.</span>
                    </h1>

                    <p className="hp-hero__sub" style={{ animationDelay: '.62s' }}>
                        A transparent, milestone-based process — so you always know
                        what's happening, what's next, and what it costs.
                    </p>

                    <div className="hp-hero__btns" style={{ animationDelay: '.76s' }}>
                        {authed ? (
                            <>
                                <Link to={`/dashboard/${user?.role || 'client'}`} className="hp-btn hp-btn--primary">
                                    Open Dashboard <span className="hp-btn__arr">→</span>
                                </Link>
                                <Link to="/services/web-development" className="hp-btn hp-btn--ghost">Browse Services</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/register" className="hp-btn hp-btn--primary">
                                    Start a project <span className="hp-btn__arr">→</span>
                                </Link>
                                <Link to="/login" className="hp-btn hp-btn--ghost">Log in</Link>
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
                            <span className="hp-st__v"><Num end={d.v} suffix={d.s} /></span>
                            <span className="hp-st__l">{d.l}</span>
                        </div>
                    ))}
                </div>
            </header>

            {/* ── SERVICES ── */}
            <section className="hp-svc">
                {/* Subtle cross-hatch pattern */}
                <div className="hp-svc__pattern" />

                <div className="hp-wrap">
                    <FadeIn>
                        <span className="hp-lbl">Services</span>
                        <h2 className="hp-h2">What we do</h2>
                    </FadeIn>

                    <div className="hp-svc__grid">
                        {cards.map((c, i) => (
                            <FadeIn key={c.slug} delay={i * 90}>
                                <Link to={`/services/${c.slug}`} className="hp-svc__card group"
                                    style={{ '--c': c.color, '--g': c.gradient }}>
                                    <div className="hp-svc__accent" />
                                    <div className="hp-svc__card-top">
                                        <div className="hp-svc__icon">
                                            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">{c.icon}</svg>
                                        </div>
                                        <span className="hp-svc__num">0{i + 1}</span>
                                    </div>
                                    <h3 className="hp-svc__title">{c.title}</h3>
                                    <p className="hp-svc__desc">{c.desc}</p>
                                    <div className="hp-svc__bottom">
                                        <div className="hp-svc__tags">
                                            {c.tags.map(t => <span key={t} className="hp-svc__tag">{t}</span>)}
                                        </div>
                                        <svg className="hp-svc__arrow" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                        </svg>
                                    </div>
                                    {c.price > 0 && <p className="hp-svc__price">From {formatINR(c.price)}</p>}
                                </Link>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PROCESS ── */}
            <section className="hp-proc">
                <div className="hp-wrap">
                    <FadeIn>
                        <span className="hp-lbl">Process</span>
                        <h2 className="hp-h2">How it works</h2>
                    </FadeIn>

                    <div className="hp-proc__flow">
                        {STEPS.map((s, i) => (
                            <FadeIn key={s.n} delay={i * 120} className="hp-proc__step-wrap">
                                <div className="hp-proc__card">
                                    <div className="hp-proc__circle">
                                        <span>{s.n}</span>
                                    </div>
                                    <h3 className="hp-proc__t">{s.t}</h3>
                                    <p className="hp-proc__d">{s.d}</p>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="hp-proc__connector">
                                        <div className="hp-proc__line" />
                                        <svg className="hp-proc__arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M6 4l8 6-8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="hp-cta">
                {/* Dot grid echo from hero */}
                <div className="hp-cta__dots" />
                <div className="hp-cta__glow" />

                <FadeIn>
                    <div className="hp-cta__inner">
                        <h2 className="hp-cta__h2">Ready to start?</h2>
                        <p className="hp-cta__sub">No upfront fees — you pay only when milestones are approved.</p>
                        <div className="hp-cta__actions">
                            {authed ? (
                                <Link to={`/dashboard/${user?.role || 'client'}`} className="hp-btn hp-btn--primary hp-btn--lg">
                                    Open Dashboard <span className="hp-btn__arr">→</span>
                                </Link>
                            ) : (
                                <Link to="/register" className="hp-btn hp-btn--primary hp-btn--lg">
                                    Create your account <span className="hp-btn__arr">→</span>
                                </Link>
                            )}
                            <a href="mailto:ventures.skyworld@gmail.com" className="hp-btn hp-btn--ghost hp-btn--lg">Get in touch</a>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* ── FOOTER ── */}
            <footer className="hp-ft">
                <div className="hp-wrap hp-ft__inner">
                    <div className="hp-ft__left">
                        <img src="/wordmark_logo_white_fullname.png" alt="SkyWorld Ventures" className="hp-ft__logo" />
                        <span className="hp-ft__copy">&copy; 2026 SkyWorld Ventures</span>
                    </div>
                    <div className="hp-ft__social">
                        <a href="https://www.youtube.com/@SkyWorldVentures" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </a>
                        <a href="https://x.com/SkyWorldVenture" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                        <a href="https://www.instagram.com/skyworldventures/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                        </a>
                    </div>
                    <div className="hp-ft__links">
                        <Link to="/faq">FAQ</Link>
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/terms">Terms</Link>
                        <a href="mailto:ventures.skyworld@gmail.com">Contact</a>
                    </div>
                </div>
            </footer>

            {/* ═════════════════ STYLES ═════════════════ */}
            <style>{`
/* ──────── TOKENS (SkyWorld brand) ──────── */
.hp {
    --sky: #0ea5e9;       /* primary-500 */
    --sky-hover: #0284c7; /* primary-600 */
    --sky-glow: rgba(14,165,233,.18);
    --indigo: #6366f1;    /* accent-500 */
    --dark: #0f172a;      /* surface-900 */
    --dark-2: #1e293b;    /* surface-800 */
    --slate: #334155;     /* surface-700 */
    --muted: #64748b;
    --faint: #94a3b8;
    --border: rgba(14,165,233,.08);
    --bg: #f8fafc;        /* surface-50 */
    --card: #ffffff;
    --radius: 10px;

    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--dark);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
}

/* entrance anim */
._fi {
    opacity: 0; transform: translateY(24px);
    transition: opacity .7s cubic-bezier(.22,1,.36,1),
                transform .7s cubic-bezier(.22,1,.36,1);
}
._fi._fi-in { opacity: 1; transform: none; }

/* ──────── NAV ──────── */
.hp-nav {
    position: fixed; inset: 0 0 auto; z-index: 100;
    transition: background .35s, box-shadow .35s, backdrop-filter .35s;
}
.hp-nav--s {
    background: rgba(255,255,255,.86);
    backdrop-filter: blur(16px) saturate(1.6);
    -webkit-backdrop-filter: blur(16px) saturate(1.6);
    box-shadow: 0 1px 0 rgba(0,0,0,.05);
}
.hp-nav__in {
    max-width: 1100px; margin: 0 auto;
    padding: 0 24px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
}
.hp-nav__brand {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none; font-weight: 600;
    font-size: 15px; letter-spacing: -.01em;
    transition: color .35s;
}
.hp-nav__logo { height: 28px; width: auto; object-fit: contain; transition: opacity .35s; }
.hp-nav__r { display: flex; align-items: center; gap: 6px; }
.hp-nav__link {
    font-size: 13px; font-weight: 500;
    padding: 6px 12px; border-radius: 8px;
    text-decoration: none; transition: color .2s;
}
.hp-nav__cta {
    font-size: 13px; font-weight: 600; color: #fff;
    background: var(--sky); border: none; cursor: pointer;
    padding: 7px 16px; border-radius: 8px; text-decoration: none;
    transition: background .2s, transform .2s;
}
.hp-nav__cta:hover {
    background: var(--sky-hover); transform: translateY(-1px);
}

/* ──────── HERO ──────── */
.hp-hero {
    position: relative;
    background: var(--dark);
    padding: 152px 24px 0;
    display: flex; flex-direction: column; align-items: center;
    min-height: 100vh;
    overflow: hidden;
}

/* Dot grid */
.hp-hero__dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(14,165,233,.12) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%);
    pointer-events: none;
}

/* Soft brand glow */
.hp-hero__glow {
    position: absolute;
    width: 600px; height: 600px;
    top: -100px; left: 50%; transform: translateX(-50%);
    background: radial-gradient(circle, rgba(14,165,233,.06) 0%, rgba(99,102,241,.03) 50%, transparent 70%);
    pointer-events: none;
}

.hp-hero__content {
    position: relative;
    max-width: 780px; width: 100%;
    text-align: center;
}

/* Pill tag */
.hp-hero__pill {
    display: inline-block;
    font-size: 11px; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--sky);
    border: 1px solid rgba(14,165,233,.2);
    padding: 5px 16px; border-radius: 100px;
    margin-bottom: 40px;
    animation: _hup .7s cubic-bezier(.22,1,.36,1) both;
}

/* Headline */
.hp-hero__h1 {
    font-size: clamp(2.5rem, 6.2vw, 4.2rem);
    font-weight: 700; letter-spacing: -.035em;
    line-height: 1.08; color: #fff; margin: 0;
}
.hp-hero__ln {
    display: inline-block;
    animation: _hslide .8s cubic-bezier(.22,1,.36,1) both;
}
.hp-hero__ln--em { color: var(--sky); }

@keyframes _hslide {
    from { opacity:0; transform:translateY(32px); filter:blur(6px); }
    to   { opacity:1; transform:none; filter:none; }
}
@keyframes _hup {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:none; }
}

.hp-hero__sub {
    font-size: 16px; line-height: 1.7;
    color: rgba(148,163,184,.7);
    max-width: 460px; margin: 28px auto 0;
    animation: _hup .8s cubic-bezier(.22,1,.36,1) both;
}

.hp-hero__btns {
    display: flex; flex-wrap: wrap; gap: 12px;
    justify-content: center; margin-top: 40px;
    animation: _hup .8s cubic-bezier(.22,1,.36,1) both;
}

/* Stats */
.hp-hero__stats {
    display: flex; gap: 1px; margin-top: auto;
    border-top: 1px solid rgba(255,255,255,.06);
    width: 100%; max-width: 780px;
    animation: _hup .8s cubic-bezier(.22,1,.36,1) both;
}
.hp-st {
    flex: 1; text-align: center;
    padding: 32px 16px 42px;
}
.hp-st__v {
    display: block;
    font-size: 28px; font-weight: 700;
    letter-spacing: -.02em; color: #fff;
    font-variant-numeric: tabular-nums;
}
.hp-st__l {
    display: block; margin-top: 4px;
    font-size: 11px; font-weight: 500;
    letter-spacing: .06em; text-transform: uppercase;
    color: rgba(148,163,184,.35);
}

/* ──────── SHARED ──────── */
.hp-wrap { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.hp-lbl {
    display: block;
    font-size: 11px; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase;
    color: var(--sky); margin-bottom: 12px;
}
.hp-h2 {
    font-size: clamp(1.6rem, 3.4vw, 2.4rem);
    font-weight: 700; letter-spacing: -.03em;
    line-height: 1.15; color: var(--dark); margin: 0;
}

/* ──────── BUTTONS ──────── */
.hp-btn {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 14px; font-weight: 600;
    padding: 12px 22px; border-radius: var(--radius);
    text-decoration: none; cursor: pointer;
    transition: all .25s cubic-bezier(.22,1,.36,1);
}
.hp-btn--primary {
    color: #fff; background: var(--sky);
    border: 1px solid var(--sky);
}
.hp-btn--primary:hover {
    background: var(--sky-hover); border-color: var(--sky-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 24px var(--sky-glow);
}
.hp-btn--ghost {
    color: rgba(255,255,255,.5);
    border: 1px solid rgba(255,255,255,.1);
    background: transparent;
}
.hp-btn--ghost:hover {
    color: #fff; border-color: rgba(255,255,255,.25);
}
.hp-btn--lg { padding: 14px 28px; font-size: 15px; }
.hp-btn__arr {
    display: inline-block; transition: transform .25s ease; margin-left: 2px;
}
.hp-btn:hover .hp-btn__arr { transform: translateX(3px); }

/* contextual overrides for light sections */
.hp-cta .hp-btn--ghost,
.hp-svc .hp-btn--ghost,
.hp-proc .hp-btn--ghost {
    color: var(--muted); border-color: rgba(0,0,0,.1);
}
.hp-cta .hp-btn--ghost:hover,
.hp-svc .hp-btn--ghost:hover,
.hp-proc .hp-btn--ghost:hover {
    color: var(--dark); border-color: rgba(0,0,0,.2);
}

/* ──────── SERVICES ──────── */
.hp-svc {
    position: relative;
    padding: 100px 0 110px;
    background: #fafbfc;
    overflow: hidden;
}
/* Radial glow behind cards */
.hp-svc::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 800px; height: 500px;
    background: radial-gradient(ellipse, rgba(14,165,233,.04) 0%, transparent 70%);
    pointer-events: none;
}

/* Cross-hatch / fine lines pattern */
.hp-svc__pattern {
    position: absolute; inset: 0;
    background-image:
        linear-gradient(rgba(14,165,233,.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(14,165,233,.03) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: linear-gradient(180deg, transparent, rgba(0,0,0,.4) 30%, rgba(0,0,0,.4) 70%, transparent);
    -webkit-mask-image: linear-gradient(180deg, transparent, rgba(0,0,0,.4) 30%, rgba(0,0,0,.4) 70%, transparent);
    pointer-events: none;
}

.hp-svc__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px; margin-top: 52px;
}

.hp-svc__card {
    position: relative;
    display: flex; flex-direction: column;
    padding: 36px 32px 28px;
    background: #fff;
    text-decoration: none; color: inherit;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,.06);
    overflow: hidden;
    transition: transform .35s cubic-bezier(.22,1,.36,1),
                box-shadow .35s cubic-bezier(.22,1,.36,1),
                border-color .35s;
}
.hp-svc__card:hover {
    transform: translateY(-6px);
    box-shadow:
        0 12px 40px -8px rgba(var(--c), .15),
        0 4px 12px rgba(0,0,0,.05);
    border-color: rgba(var(--c), .2);
}

/* Gradient accent bar at top */
.hp-svc__accent {
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--g);
    opacity: 0;
    transition: opacity .35s;
}
.hp-svc__card:hover .hp-svc__accent { opacity: 1; }

.hp-svc__card-top {
    display: flex; justify-content: space-between;
    align-items: flex-start; margin-bottom: 24px;
}
.hp-svc__icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    color: #fff;
    background: var(--g);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px -2px rgba(var(--c), .3);
    transition: transform .35s, box-shadow .35s;
}
.hp-svc__card:hover .hp-svc__icon {
    transform: scale(1.08) rotate(-2deg);
    box-shadow: 0 6px 20px -4px rgba(var(--c), .4);
}
/* Numbered badge */
.hp-svc__num {
    font-size: 13px; font-weight: 700;
    color: rgba(var(--c), .25);
    letter-spacing: -.02em;
    transition: color .35s;
}
.hp-svc__card:hover .hp-svc__num { color: rgba(var(--c), .5); }

.hp-svc__title {
    font-size: 18px; font-weight: 650;
    letter-spacing: -.01em; margin-bottom: 8px;
    color: var(--dark);
}
.hp-svc__desc {
    font-size: 14px; line-height: 1.65;
    color: var(--muted); margin-bottom: 20px;
}

/* Bottom row: tags + arrow */
.hp-svc__bottom {
    display: flex; justify-content: space-between;
    align-items: flex-end; margin-top: auto;
}
.hp-svc__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.hp-svc__tag {
    font-size: 11px; font-weight: 600;
    color: rgb(var(--c));
    letter-spacing: .02em;
    background: rgba(var(--c), .08);
    padding: 4px 10px; border-radius: 6px;
    transition: background .3s;
}
.hp-svc__card:hover .hp-svc__tag {
    background: rgba(var(--c), .12);
}

.hp-svc__arrow {
    color: rgba(var(--c), .3);
    transition: color .3s, transform .3s;
    flex-shrink: 0;
}
.hp-svc__card:hover .hp-svc__arrow {
    color: rgb(var(--c));
    transform: translate(3px, -3px);
}

.hp-svc__price {
    font-size: 13px; font-weight: 600;
    color: var(--slate); margin-top: 14px;
}

/* ──────── PROCESS (horizontal flow) ──────── */
.hp-proc {
    padding: 100px 0 110px;
    background: var(--bg);
    border-top: 1px solid rgba(0,0,0,.04);
}
.hp-proc__flow {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin-top: 56px;
    gap: 0;
}
.hp-proc__step-wrap {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}
.hp-proc__step-wrap:last-child { flex: 0 0 auto; }
.hp-proc__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 20px;
    background: var(--card);
    border: 1px solid rgba(14,165,233,.08);
    border-radius: 16px;
    min-width: 200px;
    max-width: 260px;
    transition: border-color .3s, box-shadow .3s, transform .3s;
}
.hp-proc__card:hover {
    border-color: rgba(14,165,233,.2);
    box-shadow: 0 8px 30px rgba(14,165,233,.08);
    transform: translateY(-4px);
}
.hp-proc__circle {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--sky), var(--indigo));
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700;
    letter-spacing: .04em;
    margin-bottom: 18px;
    box-shadow: 0 4px 16px rgba(14,165,233,.25);
    flex-shrink: 0;
}
.hp-proc__t {
    font-size: 17px; font-weight: 700;
    letter-spacing: -.01em; margin-bottom: 8px;
}
.hp-proc__d {
    font-size: 13px; line-height: 1.65;
    color: var(--muted); max-width: 220px;
}
/* connector between cards */
.hp-proc__connector {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 4px;
    flex-shrink: 0;
    margin-bottom: 36px; /* align with card center */
}
.hp-proc__line {
    width: 40px; height: 2px;
    background: repeating-linear-gradient(
        90deg,
        rgba(14,165,233,.25) 0,
        rgba(14,165,233,.25) 6px,
        transparent 6px,
        transparent 12px
    );
    position: relative;
    overflow: hidden;
}
.hp-proc__line::after {
    content: '';
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, var(--sky), var(--indigo));
    animation: procSlide 2.5s ease-in-out infinite;
    transform: translateX(-100%);
}
@keyframes procSlide {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(0); }
    100% { transform: translateX(100%); }
}
.hp-proc__arrow {
    color: var(--sky);
    flex-shrink: 0;
    animation: arrowPulse 2.5s ease-in-out infinite;
}
@keyframes arrowPulse {
    0%, 100% { opacity: .3; transform: translateX(0); }
    50%      { opacity: 1; transform: translateX(3px); }
}

/* ──────── CTA ──────── */
.hp-cta {
    position: relative;
    padding: 120px 24px;
    background: var(--dark);
    text-align: center;
    overflow: hidden;
}
.hp-cta__dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(14,165,233,.1) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 65%);
    -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 65%);
    pointer-events: none;
}
.hp-cta__glow {
    position: absolute;
    width: 500px; height: 500px;
    bottom: -120px; left: 50%; transform: translateX(-50%);
    background: radial-gradient(circle, rgba(14,165,233,.05) 0%, rgba(99,102,241,.02) 50%, transparent 70%);
    pointer-events: none;
}
.hp-cta__inner { position: relative; max-width: 520px; margin: 0 auto; }
.hp-cta__h2 {
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    font-weight: 700; letter-spacing: -.03em;
    line-height: 1.12; color: #fff; margin: 0 0 16px;
}
.hp-cta__sub {
    font-size: 15px; line-height: 1.65;
    color: rgba(148,163,184,.55); margin-bottom: 36px;
}
.hp-cta__actions {
    display: flex; flex-wrap: wrap;
    gap: 12px; justify-content: center;
}

/* ──────── FOOTER ──────── */
.hp-ft {
    background: var(--dark);
    border-top: 1px solid rgba(14,165,233,.06);
    padding: 28px 0;
}
.hp-ft__inner {
    display: flex; justify-content: space-between;
    align-items: center; flex-wrap: wrap; gap: 16px;
}
.hp-ft__left { display: flex; align-items: center; gap: 10px; }
.hp-ft__logo { height: 24px; width: auto; opacity: .5; }
.hp-ft__copy { font-size: 12px; color: rgba(148,163,184,.3); }
.hp-ft__links { display: flex; gap: 24px; }
.hp-ft__links a {
    font-size: 12px; color: rgba(148,163,184,.35);
    text-decoration: none; transition: color .2s;
}
.hp-ft__links a:hover { color: rgba(255,255,255,.65); }
.hp-ft__social { display: flex; align-items: center; gap: 16px; }
.hp-ft__social a {
    color: rgba(148,163,184,.35);
    transition: color .2s, transform .2s;
    display: flex; align-items: center;
}
.hp-ft__social a:hover { color: rgba(255,255,255,.7); transform: translateY(-1px); }


/* ──────── RESPONSIVE ──────── */
@media (max-width: 768px) {
    .hp-hero { padding-top: 120px; min-height: auto; }
    .hp-hero__stats { flex-wrap: wrap; }
    .hp-st { flex: 0 0 50%; }
    .hp-svc__grid { grid-template-columns: 1fr; }
    .hp-proc__flow { flex-direction: column; align-items: center; gap: 0; }
    .hp-proc__step-wrap { flex-direction: column; align-items: center; flex: 0 0 auto; }
    .hp-proc__card { max-width: 320px; width: 100%; }
    .hp-proc__connector { flex-direction: column; padding: 4px 0; margin-bottom: 0; }
    .hp-proc__line { width: 2px; height: 32px; background: repeating-linear-gradient(180deg, rgba(14,165,233,.25) 0, rgba(14,165,233,.25) 6px, transparent 6px, transparent 12px); }
    .hp-proc__line::after { animation-name: procSlideV; }
    @keyframes procSlideV { 0% { transform: translateY(-100%); } 50% { transform: translateY(0); } 100% { transform: translateY(100%); } }
    .hp-proc__arrow { transform: rotate(90deg); animation: arrowPulseV 2.5s ease-in-out infinite; }
    @keyframes arrowPulseV { 0%, 100% { opacity: .3; transform: rotate(90deg) translateX(0); } 50% { opacity: 1; transform: rotate(90deg) translateX(3px); } }
    .hp-hero__btns { flex-direction: column; align-items: center; }
    .hp-cta__actions { flex-direction: column; align-items: center; }
    .hp-ft__inner { flex-direction: column; text-align: center; }
    .hp-ft__links { gap: 16px; }
}
@media (max-width: 480px) {
    .hp-hero__h1 { font-size: 2.1rem; }
    .hp-hero__sub { font-size: 14px; }
    .hp-svc__card { padding: 28px 24px 24px; }
}

/* ──────── DARK MODE ──────── */
.dark .hp-svc { background: #0f172a; }
.dark .hp-svc::before {
    background: radial-gradient(ellipse, rgba(14,165,233,.08) 0%, transparent 70%);
}
.dark .hp-svc__pattern {
    background-image:
        linear-gradient(rgba(14,165,233,.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(14,165,233,.05) 1px, transparent 1px);
}
.dark .hp-svc__card {
    background: linear-gradient(145deg, rgba(30,41,59,.95), rgba(15,23,42,.9));
    border-color: rgba(255,255,255,.06);
    backdrop-filter: blur(8px);
}
.dark .hp-svc__card:hover {
    border-color: rgba(var(--c), .35);
    box-shadow:
        0 0 0 1px rgba(var(--c), .1),
        0 16px 48px -8px rgba(var(--c), .2),
        0 4px 16px rgba(0,0,0,.4),
        inset 0 1px 0 rgba(255,255,255,.04);
}
.dark .hp-svc__title { color: #f1f5f9; }
.dark .hp-svc__desc { color: #94a3b8; }
.dark .hp-svc__num { color: rgba(var(--c), .3); }
.dark .hp-svc__card:hover .hp-svc__num { color: rgba(var(--c), .6); }
.dark .hp-svc__tag { background: rgba(var(--c), .12); }
.dark .hp-svc__card:hover .hp-svc__tag { background: rgba(var(--c), .2); }
.dark .hp-svc__price { color: #94a3b8; }

.dark .hp-lbl { color: var(--sky); }
.dark .hp-h2 { color: #f1f5f9; }

.dark .hp-proc {
    background: #0f172a;
    border-top-color: rgba(14,165,233,.06);
}
.dark .hp-proc__card {
    background: linear-gradient(145deg, rgba(30,41,59,.95), rgba(15,23,42,.85));
    border-color: rgba(14,165,233,.08);
    backdrop-filter: blur(8px);
    box-shadow:
        0 2px 8px rgba(0,0,0,.2),
        inset 0 1px 0 rgba(255,255,255,.03);
}
.dark .hp-proc__card:hover {
    border-color: rgba(14,165,233,.25);
    box-shadow:
        0 0 0 1px rgba(14,165,233,.08),
        0 12px 40px rgba(14,165,233,.12),
        0 4px 16px rgba(0,0,0,.3),
        inset 0 1px 0 rgba(255,255,255,.05);
    transform: translateY(-6px);
}
.dark .hp-proc__circle {
    box-shadow:
        0 4px 20px rgba(14,165,233,.35),
        0 0 0 4px rgba(14,165,233,.08);
}
.dark .hp-proc__card:hover .hp-proc__circle {
    box-shadow:
        0 4px 24px rgba(14,165,233,.45),
        0 0 0 6px rgba(14,165,233,.12);
}
.dark .hp-proc__t { color: #f1f5f9; }
.dark .hp-proc__d { color: #94a3b8; }
            `}</style>
        </div>
    );
};

export default Home;
