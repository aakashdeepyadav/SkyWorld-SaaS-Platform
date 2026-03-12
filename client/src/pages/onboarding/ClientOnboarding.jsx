import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderKanban,
  Headset,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserPlus,
  WalletCards,
  Trophy,
  Circle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navSections = [
  { id: 'overview', label: 'Overview', priority: 'essential' },
  { id: 'account', label: 'Account Setup', priority: 'essential' },
  { id: 'services', label: 'Service Selection', priority: 'essential' },
  { id: 'workflow', label: 'Order Workflow', priority: 'essential' },
  { id: 'projects', label: 'Project Tracking', priority: 'advanced' },
  { id: 'payments', label: 'Payments', priority: 'advanced' },
  { id: 'security', label: 'Security', priority: 'advanced' },
  { id: 'faq', label: 'FAQ', priority: 'support' },
];

const serviceCards = [
  {
    title: 'Web Development',
    text: 'Production websites, landing pages, and business platforms.',
    timeline: '2 to 9 days',
    link: '/services/web-development',
  },
  {
    title: 'Branding & Design',
    text: 'Identity systems, logos, and visual communication assets.',
    timeline: '2 to 7 days',
    link: '/services/branding-creative',
  },
  {
    title: 'App Development',
    text: 'PWA and app builds for feature-rich product workflows.',
    timeline: '10 days to 5 weeks',
    link: '/services/app-development',
  },
];

const faqItems = [
  {
    id: 'a1',
    q: 'I cannot log in after signup. What should I do?',
    a: 'Use Forgot Password first. If access still fails, contact support with your registered email for quick verification.',
  },
  {
    id: 'a2',
    q: 'How does the payment model work?',
    a: 'Projects run on a 50/50 model: 50% advance to start and 50% at final approval before completion.',
  },
  {
    id: 'a3',
    q: 'Where are milestones and files managed?',
    a: 'Open your project detail page from Projects. Milestone status, attachments, and review history are centralized there.',
  },
  {
    id: 'a4',
    q: 'Can I request revisions during delivery?',
    a: 'Yes. Minor revisions are generally included by plan. Major scope changes can require a revised quote and timeline.',
  },
];

const shellCard =
  'rounded-2xl border border-surface-200 bg-white p-6 shadow-card';
const innerCard =
  'rounded-xl border border-surface-200 bg-surface-50 p-4';

function SectionHeader({ title, subtitle }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-surface-900">{title}</h2>
      {subtitle && <p className="mt-2 text-surface-600">{subtitle}</p>}
    </>
  );
}

export default function ClientOnboarding() {
  const [openFaq, setOpenFaq] = useState(faqItems[0].id);
  const [viewedSections, setViewedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('clientOnboarding_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [scrollPosition, setScrollPosition] = useState(0);
  const { user } = useAuth();

  const isAuthed = Boolean(user);
  const dashboardLink = isAuthed ? `/dashboard/${user?.role || 'client'}` : '/login';
  const profileLink = isAuthed ? '/profile' : '/register';
  const settingsLink = isAuthed ? '/settings' : '/register';
  const projectsLink = isAuthed ? '/projects' : '/login';
  const requestLink = isAuthed ? '/request' : '/register';
  const paymentsLink = isAuthed && user?.role !== 'developer' ? '/payments' : '/login';

  // Save section views to localStorage
  const markSectionViewed = (sectionId) => {
    setViewedSections((prev) => {
      if (!prev.includes(sectionId)) {
        const updated = [...prev, sectionId];
        localStorage.setItem('clientOnboarding_viewed', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Detect when section comes into view
  useEffect(() => {
    const handleScroll = () => {
      navSections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.5) {
            markSectionViewed(section.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const essentialSections = navSections.filter((s) => s.priority === 'essential');
  const completedEssential = essentialSections.filter((s) => viewedSections.includes(s.id)).length;
  const progressPercent = Math.round((completedEssential / essentialSections.length) * 100);
  const allEssentialComplete = completedEssential === essentialSections.length;

  const supportLinks = [
    { title: 'Contact Page', desc: 'Open support form', to: '/contact', type: 'internal' },
    {
      title: 'Email Support',
      desc: 'support@skyworld.buzz',
      to: 'mailto:support@skyworld.buzz',
      type: 'external',
    },
    {
      title: 'Documentation',
      desc: 'docs.skyworld.com',
      to: 'https://docs.skyworld.com',
      type: 'external',
    },
  ];

  const jumpTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="relative overflow-hidden border-b border-primary-400/30 bg-[#37BBEC] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.25),transparent_58%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/">
              <img
                src="/wordmark_logo_white_fullname.png"
                alt="SkyWorld"
                className="h-8 w-auto sm:h-9"
              />
            </Link>
            <Link
              to="/onboarding/developer"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
            >
              Developer Guide
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <span className="inline-flex rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                Client Onboarding
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Production-ready onboarding for SkyWorld clients.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-primary-100 sm:text-lg">
                Every section below includes direct links, expected flow, and decision points from
                signup to final delivery.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                >
                  Create Account
                  <UserPlus className="h-4 w-4" />
                </Link>
                <Link
                  to={dashboardLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Open Dashboard
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">First 30-minute checklist</p>
              <ul className="mt-4 space-y-3 text-sm text-primary-50">
                {[
                  'Register and verify your account.',
                  'Complete profile before creating requests.',
                  'Choose a fixed package or submit custom scope.',
                  'Track milestones from dashboard and projects.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-200" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Progress Banner */}
        {isAuthed && (
          <div className="mb-8 rounded-2xl border border-primary-200 bg-primary-50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {allEssentialComplete ? (
                    <Trophy className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-primary-600" />
                  )}
                  <p className="font-semibold text-primary-900">
                    {allEssentialComplete ? '✨ Onboarding Complete!' : `Complete Your Onboarding`}
                  </p>
                </div>
                <p className="text-sm text-primary-700">
                  {allEssentialComplete
                    ? 'You have completed all essential steps. Ready to submit your first request!'
                    : `You have reviewed ${completedEssential} of ${essentialSections.length} essential sections`}
                </p>
              </div>
              <Link
                to={requestLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4" />
                Start First Request
              </Link>
            </div>
            {!allEssentialComplete && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary-700">
                    Essential Progress
                  </span>
                  <span className="text-xs font-semibold text-primary-800">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        <div className="lg:grid lg:grid-cols-[280px,1fr] lg:gap-8">
          <aside className="mb-8 lg:mb-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className={shellCard}>
                <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">
                  Guide Navigation
                </p>
                <nav className="mt-4 space-y-1">
                  {navSections.map((item) => {
                    const isViewed = viewedSections.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => jumpTo(item.id)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-surface-700 transition hover:bg-primary-50 hover:text-primary-700:bg-surface-700:text-primary-300 flex items-center justify-between group"
                      >
                        <span>{item.label}</span>
                        {isViewed && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className={shellCard}>
                <p className="text-sm font-semibold text-surface-900 mb-3">
                  Progress Summary
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-surface-600">
                        Essential Steps
                      </span>
                      <span className="font-semibold text-surface-900">
                        {completedEssential}/{essentialSections.length}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  {allEssentialComplete && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Ready to start!
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className={shellCard}>
                <p className="text-sm font-semibold text-surface-900">
                  Quick access
                </p>
                <div className="mt-3 space-y-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                  >
                    Contact Support
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/faq"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                  >
                    Platform FAQ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-8">
            <section id="overview" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader
                title="Platform Overview"
                subtitle="SkyWorld centralizes service selection, delivery tracking, collaboration, and payment closure."
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Project tracking',
                    text: 'Milestones, status, and files in one workspace.',
                    icon: FolderKanban,
                  },
                  {
                    title: 'Real-time collaboration',
                    text: 'Project-level communication for faster decisions.',
                    icon: MessageSquare,
                  },
                  {
                    title: 'Payment visibility',
                    text: 'Clear 50/50 payment structure with invoice records.',
                    icon: WalletCards,
                  },
                  {
                    title: 'Secure controls',
                    text: 'Profile and account-level security management.',
                    icon: ShieldCheck,
                  },
                ].map((block) => (
                  <div key={block.title} className={innerCard}>
                    <block.icon className="h-5 w-5 text-primary-600" />
                    <p className="mt-3 text-sm font-semibold text-surface-900">
                      {block.title}
                    </p>
                    <p className="mt-1 text-sm text-surface-600">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="account" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader
                title="Account Setup"
                subtitle="Finish setup before placing your first paid request."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Register',
                    text: 'Create your account from Register or use Google signin.',
                    link: '/register',
                  },
                  {
                    title: 'Verify',
                    text: 'Confirm your email and recover access from Forgot Password if needed.',
                    link: '/forgot-password',
                  },
                  {
                    title: 'Complete profile',
                    text: 'Update name, company, phone, and avatar for delivery communication.',
                    link: profileLink,
                  },
                ].map((step) => (
                  <div key={step.title} className={innerCard}>
                    <p className="text-sm font-semibold text-surface-900">
                      {step.title}
                    </p>
                    <p className="mt-2 text-sm text-surface-600">
                      {step.text}
                    </p>
                    <Link
                      to={step.link}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                    >
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section id="services" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader
                title="Service Selection"
                subtitle="Select the closest fixed plan, or send a custom request for non-standard scope."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {serviceCards.map((service) => (
                  <div key={service.title} className={innerCard}>
                    <p className="text-sm font-semibold text-surface-900">
                      {service.title}
                    </p>
                    <p className="mt-2 text-sm text-surface-600">
                      {service.text}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-surface-500">
                      Timeline: {service.timeline}
                    </p>
                    <Link
                      to={service.link}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                    >
                      View Plans
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900">
                Need custom scope? Submit details through{' '}
                <Link to={requestLink} className="font-semibold underline underline-offset-4">
                  Request Form
                </Link>
                .
              </div>
            </section>

            <section id="workflow" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader
                title="Order Workflow"
                subtitle="From checkout to closure, follow this operational sequence."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  { t: 'Finalize scope and package', i: Sparkles },
                  { t: 'Pay 50% advance to begin', i: WalletCards },
                  { t: 'Review milestone updates', i: FileText },
                  { t: 'Approve final delivery and close', i: CheckCircle2 },
                ].map((row) => (
                  <div key={row.t} className={innerCard}>
                    <row.i className="h-5 w-5 text-primary-600" />
                    <p className="mt-3 text-sm font-semibold text-surface-900">
                      {row.t}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="projects" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader
                title="Project Tracking"
                subtitle="Use these views to control feedback loops and reduce delays."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900">
                    Where to manage delivery
                  </p>
                  <div className="mt-3 space-y-2">
                    <Link
                      to={dashboardLink}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                    >
                      Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to={projectsLink}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                    >
                      Projects
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900">
                    Execution practices
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-surface-600">
                    <li>Keep all approvals in project messages.</li>
                    <li>Review milestone files quickly to avoid timeline drift.</li>
                    <li>Escalate blockers through support early.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="payments" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader
                title="Payments and Invoices"
                subtitle="Track every payment and invoice from the payments workspace."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Standard billing pattern</p>
                  <p className="mt-2">
                    50% at kickoff and 50% at final approval. Invoices are generated per successful
                    transaction.
                  </p>
                </div>
                <div className={innerCard}>
                  <div className="space-y-2">
                    <Link
                      to={paymentsLink}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                    >
                      Open Payments
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/terms"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                    >
                      Terms of Service
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/privacy"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                    >
                      Privacy Policy
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section id="security" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader
                title="Security and Preferences"
                subtitle="Maintain profile quality and account security before each project cycle."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900">Profile</p>
                  <Link
                    to={profileLink}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                  >
                    Open Profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900">
                    Security settings
                  </p>
                  <Link
                    to={settingsLink}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                  >
                    Open Settings
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            <section id="faq" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="FAQ" />
              <div className="mt-6 space-y-3">
                {faqItems.map((item) => {
                  const isOpen = openFaq === item.id;
                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-surface-200"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? '' : item.id)}
                        className="flex w-full items-center justify-between bg-white px-4 py-3 text-left text-sm font-semibold text-surface-900 hover:bg-surface-50:bg-surface-700"
                        aria-expanded={isOpen}
                      >
                        {item.q}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-600">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-primary-200 bg-primary-50 p-6">
              <SectionHeader
                title="Support and Next Action"
                subtitle="Start your first project today with full workflow visibility from kickoff to delivery."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {supportLinks.map((item) => (
                  <div key={item.title} className={innerCard}>
                    <p className="text-sm font-semibold text-surface-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-surface-600">
                      {item.desc}
                    </p>
                    {item.type === 'internal' ? (
                      <Link
                        to={item.to}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <a
                        href={item.to}
                        target={item.to.startsWith('http') ? '_blank' : undefined}
                        rel={item.to.startsWith('http') ? 'noreferrer' : undefined}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600"
                      >
                        Open
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                  Start Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="btn-secondary inline-flex items-center gap-2">
                  Talk to Support
                  <Headset className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
