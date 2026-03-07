import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FolderKanban,
  Headset,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'activation', label: 'Account Activation' },
  { id: 'workflow', label: 'Project Workflow' },
  { id: 'delivery', label: 'Delivery Standards' },
  { id: 'communication', label: 'Communication' },
  { id: 'performance', label: 'Performance & Payouts' },
  { id: 'security', label: 'Security' },
  { id: 'faq', label: 'FAQ' },
];

const faqItems = [
  {
    id: 'd1',
    q: 'How do I start getting assigned to projects?',
    a: 'Complete your profile, keep availability updated, and stay responsive. Assignment readiness improves when profile quality and response time are strong.',
  },
  {
    id: 'd2',
    q: 'Where do I manage assigned requests?',
    a: 'Use Requests for assignment details and Projects for active execution. Keep all updates inside those records for audit clarity.',
  },
  {
    id: 'd3',
    q: 'How should files and delivery notes be shared?',
    a: 'Upload milestone assets in project context with clear version labels and concise notes about what changed and what requires review.',
  },
  {
    id: 'd4',
    q: 'How are payouts handled?',
    a: 'Payout actions are coordinated after completion and approval flow. Keep your account details and communication current to avoid delays.',
  },
];

const shellCard =
  'rounded-2xl border border-surface-200 bg-white p-6 shadow-card dark:border-surface-700 dark:bg-surface-800';
const innerCard =
  'rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-600 dark:bg-surface-700/40';

function SectionHeader({ title, subtitle }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white">{title}</h2>
      {subtitle && <p className="mt-2 text-surface-600 dark:text-surface-300">{subtitle}</p>}
    </>
  );
}

export default function DeveloperOnboarding() {
  const [openFaq, setOpenFaq] = useState(faqItems[0].id);
  const { user } = useAuth();

  const isAuthed = Boolean(user);
  const dashboardLink = isAuthed ? `/dashboard/${user?.role || 'developer'}` : '/login';
  const profileLink = isAuthed ? '/profile' : '/register';
  const settingsLink = isAuthed ? '/settings' : '/register';
  const requestsLink = isAuthed ? '/requests' : '/login';
  const projectsLink = isAuthed ? '/projects' : '/login';

  const supportLinks = [
    { title: 'Contact Page', desc: 'Reach support for role activation or blockers.', to: '/contact', type: 'internal' },
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
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <header className="relative overflow-hidden border-b border-accent-400/30 bg-[#0F1626] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.22),transparent_58%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/">
              <img src="/wordmark_logo_white_fullname.png" alt="SkyWorld" className="h-8 w-auto sm:h-9" />
            </Link>
            <Link
              to="/onboarding/client"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
            >
              Client Guide
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <span className="inline-flex rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                Developer Onboarding
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Professional operating guide for SkyWorld developers.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-accent-100 sm:text-lg">
                Use this page to align setup, execution standards, communication rules, and performance expectations.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-accent-700 hover:bg-accent-50">
                  Create Account
                  <UserPlus className="h-4 w-4" />
                </Link>
                <Link to={dashboardLink} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20">
                  Open Dashboard
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">First-week focus</p>
              <ul className="mt-4 space-y-3 text-sm text-accent-50">
                {[
                  'Create account and confirm access.',
                  'Complete profile and security settings.',
                  'Review assigned requests and active projects.',
                  'Maintain updates and milestone discipline.',
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
        <div className="lg:grid lg:grid-cols-[280px,1fr] lg:gap-8">
          <aside className="mb-8 lg:mb-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className={shellCard}>
                <p className="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-300">
                  Guide Navigation
                </p>
                <nav className="mt-4 space-y-1">
                  {navSections.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => jumpTo(item.id)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-surface-700 transition hover:bg-accent-50 hover:text-accent-700 dark:text-surface-200 dark:hover:bg-surface-700 dark:hover:text-accent-300"
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className={shellCard}>
                <p className="text-sm font-semibold text-surface-900 dark:text-white">Quick access</p>
                <div className="mt-3 space-y-2">
                  <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                    Contact Support
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                    Platform FAQ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-8">
            <section id="overview" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="Developer Operating Model" subtitle="SkyWorld developers execute through request alignment, project milestones, and accountable communication." />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { title: 'Assignment workflow', text: 'Handle assignment context in Requests and Projects.', icon: ClipboardList },
                  { title: 'Milestone execution', text: 'Work in clear stages with reviewable outputs.', icon: FolderKanban },
                  { title: 'Client communication', text: 'Use project messaging for all key updates.', icon: MessageSquare },
                  { title: 'Performance visibility', text: 'Delivery quality and responsiveness matter.', icon: TrendingUp },
                ].map((block) => (
                  <div key={block.title} className={innerCard}>
                    <block.icon className="h-5 w-5 text-accent-600 dark:text-accent-400" />
                    <p className="mt-3 text-sm font-semibold text-surface-900 dark:text-white">{block.title}</p>
                    <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">{block.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="activation" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="Account Activation and Role Readiness" subtitle="If your account does not yet have developer access, contact support after signup." />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  { title: 'Create account', text: 'Register or sign in to your existing profile.', link: '/register' },
                  { title: 'Complete profile', text: 'Add professional identity details in Profile.', link: profileLink },
                  { title: 'Role/access support', text: 'Reach support if role setup is pending.', link: '/contact' },
                ].map((step) => (
                  <div key={step.title} className={innerCard}>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{step.title}</p>
                    <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">{step.text}</p>
                    <Link to={step.link} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section id="workflow" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="Project Workflow" subtitle="Run every assignment through a consistent lifecycle for predictable outcomes." />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  { t: 'Review assigned request context', i: ClipboardList },
                  { t: 'Confirm scope and timeline assumptions', i: Sparkles },
                  { t: 'Execute milestones and publish progress', i: FolderKanban },
                  { t: 'Submit final deliverables and closure notes', i: CheckCircle2 },
                ].map((step) => (
                  <div key={step.t} className={innerCard}>
                    <step.i className="h-5 w-5 text-accent-600 dark:text-accent-400" />
                    <p className="mt-3 text-sm font-semibold text-surface-900 dark:text-white">{step.t}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Execution pages</p>
                  <div className="mt-3 space-y-2">
                    <Link to={requestsLink} className="inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                      Open Requests
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to={projectsLink} className="inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                      Open Projects
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Communication rule</p>
                  <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">
                    Keep technical decisions, change requests, and sign-offs inside project context for traceability.
                  </p>
                </div>
              </div>
            </section>

            <section id="delivery" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="Delivery Standards" subtitle="Consistent delivery quality improves trust, ratings, and repeat assignments." />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Required practices</p>
                  <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-300">
                    <li>Use clear milestone naming and date-tagged file versions.</li>
                    <li>Include setup notes and key assumptions for handoff.</li>
                    <li>Call out blockers immediately, not at deadline time.</li>
                  </ul>
                </div>
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Project discipline</p>
                  <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-300">
                    <li>Ship reviewable increments instead of large late bundles.</li>
                    <li>Confirm acceptance criteria before major changes.</li>
                    <li>Close milestones only after deliverable validation.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="communication" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="Communication Standards" subtitle="Reliable communication is part of delivery quality." />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  <p className="font-semibold">Do</p>
                  <ul className="mt-2 space-y-1">
                    <li>Post progress updates proactively.</li>
                    <li>Ask precise clarifying questions.</li>
                    <li>Share risk early with mitigation plan.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
                  <p className="font-semibold">Avoid</p>
                  <ul className="mt-2 space-y-1">
                    <li>Silent delays or hidden blockers.</li>
                    <li>Unapproved scope changes.</li>
                    <li>Off-platform delivery decisions.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="performance" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="Performance and Payout Readiness" subtitle="Strong delivery consistency directly impacts assignment quality and payout flow." />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Performance focus</p>
                  <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-300">
                    <li>Response speed and communication quality</li>
                    <li>On-time milestone completion</li>
                    <li>Revision discipline and closure quality</li>
                  </ul>
                </div>
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Payout alignment</p>
                  <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">
                    Keep profile and security details updated. Payout progression follows approved completion flow.
                  </p>
                  <div className="mt-3">
                    <Link to={dashboardLink} className="inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                      Open Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section id="security" className={`${shellCard} scroll-mt-24`}>
              <SectionHeader title="Security and Account Controls" subtitle="Use secure account operations as a default engineering standard." />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Profile controls</p>
                  <Link to={profileLink} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                    Open Profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className={innerCard}>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Security settings</p>
                  <Link to={settingsLink} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
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
                    <div key={item.id} className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-600">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? '' : item.id)}
                        className="flex w-full items-center justify-between bg-white px-4 py-3 text-left text-sm font-semibold text-surface-900 hover:bg-surface-50 dark:bg-surface-800 dark:text-white dark:hover:bg-surface-700"
                        aria-expanded={isOpen}
                      >
                        {item.q}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="border-t border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-600 dark:border-surface-600 dark:bg-surface-700/40 dark:text-surface-300">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-accent-200 bg-accent-50 p-6 dark:border-accent-500/30 dark:bg-accent-500/10">
              <SectionHeader title="Support and Next Action" subtitle="Move from onboarding to active delivery with clear process ownership." />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {supportLinks.map((item) => (
                  <div key={item.title} className={innerCard}>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">{item.desc}</p>
                    {item.type === 'internal' ? (
                      <Link to={item.to} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <a href={item.to} target={item.to.startsWith('http') ? '_blank' : undefined} rel={item.to.startsWith('http') ? 'noreferrer' : undefined} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400">
                        Open
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                  Start as Developer
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="btn-secondary inline-flex items-center gap-2">
                  Contact Support
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
