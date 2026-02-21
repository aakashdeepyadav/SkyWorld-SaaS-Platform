import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/* ——— Scroll-triggered fade-in ——— */
const Reveal = ({ children, className = '', delay = 0 }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold: 0.12 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div
            ref={ref}
            className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >{children}</div>
    );
};

/* ——— Animated number counter ——— */
const Counter = ({ end, suffix = '', duration = 1600 }) => {
    const ref = useRef(null);
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
        }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
            setCount(Math.floor(eased * end));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [started, end, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
};

/* ——— Infinite marquee ——— */
const Marquee = ({ items }) => (
    <div className="overflow-hidden relative">
        <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap">
            {[...items, ...items].map((item, i) => (
                <span key={i} className="mx-8 text-sm font-medium text-gray-400/60 select-none">{item}</span>
            ))}
        </div>
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface-900 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface-900 to-transparent pointer-events-none" />
    </div>
);

const Home = () => {
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAuthenticated = Boolean(user);

    const handleLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div className="min-h-screen bg-surface-50 font-sans">

            {/* ═══ NAV — clean, just logo + auth ═══ */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : ''
                }`}>
                <div className="max-w-6xl mx-auto px-6 lg:px-8 flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2.5" title="Go to Home">
                        <img src="/logo.png" alt="SkyWorld" className="w-7 h-7 object-contain" />
                        <span className={`text-base font-semibold transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                            SkyWorld
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <Link to={`/dashboard/${user?.role || 'client'}`} className={`text-sm transition-colors duration-300 hidden sm:inline ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-primary-500/20"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={`text-sm transition-colors duration-300 hidden sm:inline ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                                    Sign in
                                </Link>
                                <Link to="/register" className="text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-primary-500/20">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ═══ HERO ═══ */}
            <section className="relative bg-surface-900 overflow-hidden">
                {/* Dot grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }} />
                {/* Top accent */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />
                {/* Radial glow — subtle, single, centered */}
                <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

                <div className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-36 sm:pt-44 pb-20 sm:pb-28">
                    <div className="max-w-3xl">
                        {/* Staggered headline animation */}
                        <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold text-white leading-[1.1] tracking-tight">
                            <span className="inline-block animate-[slideUp_0.6s_ease-out_0.1s_both]">We craft digital</span>
                            <br />
                            <span className="inline-block animate-[slideUp_0.6s_ease-out_0.25s_both]">products that</span>
                            <br />
                            <span className="inline-block animate-[slideUp_0.6s_ease-out_0.4s_both] text-primary-400">people love.</span>
                        </h1>

                        <p className="mt-7 text-lg text-gray-400 max-w-xl leading-relaxed animate-[fadeIn_0.8s_ease-out_0.6s_both]">
                            SkyWorld is a premium digital studio. We design and build apps, websites, and brands — with a transparent process you can track every step of the way.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4 animate-[fadeIn_0.8s_ease-out_0.8s_both]">
                            {isAuthenticated ? (
                                <>
                                    <Link to={`/dashboard/${user?.role || 'client'}`} className="group text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 pl-6 pr-5 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/25 inline-flex items-center gap-2">
                                        Open Dashboard
                                        <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                    </Link>
                                    <Link to="/services/web-development" className="text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:text-white px-6 py-3 rounded-xl transition-all duration-200">
                                        Browse Services
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/register" className="group text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 pl-6 pr-5 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/25 inline-flex items-center gap-2">
                                        Start your project
                                        <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                    </Link>
                                    <Link to="/login" className="text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:text-white px-6 py-3 rounded-xl transition-all duration-200">
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-24 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/[0.06] animate-[fadeIn_1s_ease-out_1s_both]">
                        {[
                            { end: 150, suffix: '+', label: 'Projects shipped' },
                            { end: 80, suffix: '+', label: 'Clients worldwide' },
                            { end: 99, suffix: '%', label: 'Satisfaction' },
                            { end: 24, suffix: 'h', label: 'Avg. response' },
                        ].map((s) => (
                            <div key={s.label}>
                                <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                                    <Counter end={s.end} suffix={s.suffix} />
                                </p>
                                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tech marquee */}
                <div className="pb-8">
                    <Marquee items={['React', 'Node.js', 'Flutter', 'Next.js', 'AWS', 'MongoDB', 'Figma', 'TypeScript', 'Swift', 'Kubernetes']} />
                </div>
            </section>

            {/* ═══ SERVICES ═══ */}
            <section className="py-24 sm:py-32 px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <p className="text-sm font-semibold text-primary-500 mb-2 tracking-wide uppercase">What we do</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 max-w-lg leading-snug">
                            Three things we do really, really well.
                        </h2>
                    </Reveal>

                    <div className="mt-14 grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'App Development',
                                desc: 'iOS, Android, and cross-platform apps. From MVP to enterprise scale — we ship experiences users keep coming back to.',
                                tags: ['Flutter', 'React Native', 'Swift'],
                                slug: 'app-development',
                                iconBg: 'bg-blue-500',
                                hoverBorder: 'hover:border-blue-200',
                                tagStyle: 'bg-blue-50 text-blue-600',
                                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />,
                            },
                            {
                                title: 'Web Development',
                                desc: 'SaaS platforms, marketing sites, web apps. React, Node.js, and the best of modern tooling — fast, accessible, scalable.',
                                tags: ['React', 'Node.js', 'Next.js'],
                                slug: 'web-development',
                                iconBg: 'bg-emerald-500',
                                hoverBorder: 'hover:border-emerald-200',
                                tagStyle: 'bg-emerald-50 text-emerald-600',
                                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8" />,
                            },
                            {
                                title: 'Branding & Design',
                                desc: 'Logos, identity systems, UI/UX, and creative direction. We build brands that people recognize and trust.',
                                tags: ['Figma', 'UI/UX', 'Identity'],
                                slug: 'branding-creative',
                                iconBg: 'bg-violet-500',
                                hoverBorder: 'hover:border-violet-200',
                                tagStyle: 'bg-violet-50 text-violet-600',
                                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />,
                            },
                        ].map((s, i) => (
                            <Reveal key={s.title} delay={i * 120}>
                                <Link to={`/services/${s.slug}`} className={`h-full p-8 rounded-2xl bg-white border border-gray-100 ${s.hoverBorder} hover:shadow-xl hover:shadow-gray-900/[0.06] transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden block`}>
                                    {/* Subtle gradient on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50/0 to-gray-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center mb-6 shadow-lg shadow-gray-900/[0.08] group-hover:scale-110 transition-transform duration-300`}>
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">{s.icon}</svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed mb-5">{s.desc}</p>
                                        <div className="flex flex-wrap gap-2 mb-5">
                                            {s.tags.map(tag => (
                                                <span key={tag} className={`text-xs font-medium px-2.5 py-1 rounded-md ${s.tagStyle}`}>{tag}</span>
                                            ))}
                                        </div>
                                        <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-primary-500 transition-colors duration-300">
                                            Learn more
                                            <svg className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ PRODUCT PREVIEW ═══ */}
            <section className="py-24 sm:py-32 px-6 lg:px-8 bg-surface-50 border-y border-gray-100">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <p className="text-sm font-semibold text-primary-500 mb-2 tracking-wide uppercase">The platform</p>
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-snug mb-6">
                                    Your project,<br />completely transparent.
                                </h2>
                                <p className="text-gray-500 leading-relaxed mb-8">
                                    No black boxes. Track milestones, chat with your team, review deliverables, and manage payments — all from one clean dashboard.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Real-time tracking', desc: 'See progress as it happens' },
                                        { label: 'Team messaging', desc: 'Chat directly with devs' },
                                        { label: 'Milestone payments', desc: 'Pay only on approval' },
                                        { label: 'File sharing', desc: 'Assets in one place' },
                                    ].map((f) => (
                                        <div key={f.label} className="p-4 rounded-xl bg-white border border-gray-100">
                                            <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dashboard preview cards */}
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl" />
                                <div className="relative space-y-3">
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center text-xs font-bold">NX</div>
                                                <div><p className="text-sm font-semibold text-gray-900">Nexava Mobile App</p><p className="text-xs text-gray-400">In progress · 4 milestones</p></div>
                                            </div>
                                            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">78%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: '78%' }} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                                            <p className="text-2xl font-bold text-gray-900">₹10.2L</p>
                                            <p className="text-xs text-gray-400 mt-1">Revenue this month</p>
                                        </div>
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                                            <p className="text-2xl font-bold text-gray-900">23</p>
                                            <p className="text-xs text-gray-400 mt-1">Active projects</p>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">GL</div>
                                            <div className="flex-1"><p className="text-sm font-semibold text-gray-900">GreenLeaf E-commerce</p><p className="text-xs text-gray-400">Delivered · Dec 2025</p></div>
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Complete</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ PROCESS ═══ */}
            <section className="py-24 sm:py-32 px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <p className="text-sm font-semibold text-primary-500 mb-2 tracking-wide uppercase">How it works</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 max-w-lg leading-snug mb-14">
                            Three steps. Zero guesswork.
                        </h2>
                    </Reveal>

                    <div className="grid sm:grid-cols-3 gap-0 relative">
                        {/* Connecting line */}
                        <div className="hidden sm:block absolute top-6 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gray-200" />

                        {[
                            { n: '01', title: 'Brief', desc: 'Tell us what you need. We scope it, price it, and assign a dedicated team — usually within 24 hours.' },
                            { n: '02', title: 'Build', desc: 'Track every milestone in your dashboard. Chat with developers, review work in progress, iterate fast.' },
                            { n: '03', title: 'Ship', desc: 'We deliver production-ready code with docs and handover. Pay on approval. We support you post-launch.' },
                        ].map((s, i) => (
                            <Reveal key={s.n} delay={i * 150} className="text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-surface-900 text-white text-sm font-bold flex items-center justify-center mx-auto mb-6 relative z-10 ring-4 ring-white">
                                    {s.n}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="relative py-28 sm:py-36 px-6 lg:px-8 bg-surface-900 overflow-hidden">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }} />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-400/30 to-transparent" />

                <Reveal>
                    <div className="relative max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                            Let's build something<br /><span className="text-primary-400">together.</span>
                        </h2>
                        <p className="mt-5 text-gray-400 max-w-md mx-auto">
                            No upfront fees. You pay only when milestones are delivered and approved by you.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                            {isAuthenticated ? (
                                <Link to={`/dashboard/${user?.role || 'client'}`} className="group text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 pl-6 pr-5 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/25 inline-flex items-center justify-center gap-2">
                                    Go to dashboard
                                    <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                </Link>
                            ) : (
                                <Link to="/register" className="group text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 pl-6 pr-5 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/25 inline-flex items-center justify-center gap-2">
                                    Create your account
                                    <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                </Link>
                            )}
                            <a href="mailto:ventures.skyworld@gmail.com" className="text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:text-white px-6 py-3.5 rounded-xl transition-all duration-200">
                                Get in touch
                            </a>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="bg-surface-900 border-t border-white/5 py-8 px-6 lg:px-8">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="SkyWorld" className="w-5 h-5 object-contain opacity-50" />
                        <span className="text-sm text-gray-600">&copy; 2026 SkyWorld Ventures</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <Link to="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy</Link>
                        <Link to="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">Terms</Link>
                        <a href="mailto:ventures.skyworld@gmail.com" className="text-gray-500 hover:text-gray-300 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>

            {/* Marquee keyframe */}
            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
};

export default Home;
