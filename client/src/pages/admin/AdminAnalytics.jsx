import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ArrowPathIcon, CalendarDaysIcon, CreditCardIcon, EnvelopeIcon,
  ServerIcon, GlobeAltIcon, CircleStackIcon, UserGroupIcon,
  ClipboardDocumentListIcon, VideoCameraIcon, CheckCircleIcon,
  XCircleIcon, ChartBarIcon, ArrowTrendingUpIcon, CloudArrowUpIcon,
  PresentationChartBarIcon, BoltIcon, ShieldCheckIcon,
  InboxStackIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

// ─── Lookup tables ───────────────────────────────────────────────────────────

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const HEALTH_CFG = {
  up:           { label: 'Online',       clr: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  down:         { label: 'Offline',      clr: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
  degraded:     { label: 'Degraded',     clr: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  connected:    { label: 'Connected',    clr: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  disconnected: { label: 'Disconnected', clr: 'text-slate-500 dark:text-slate-400',     dot: 'bg-slate-400',   bg: 'bg-slate-50 dark:bg-slate-500/10' },
  error:        { label: 'Error',        clr: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
};

const QUOTA_BG = { sky: 'bg-sky-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500' };

const BADGE = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  completed: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
  pending:   'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
};

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};
const fmtINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, accent = 'sky' }) => {
  const map = {
    sky:    { border: 'border-sky-200/60 dark:border-sky-500/20',       icon: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
    green:  { border: 'border-emerald-200/60 dark:border-emerald-500/20', icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
    amber:  { border: 'border-amber-200/60 dark:border-amber-500/20',   icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
    red:    { border: 'border-red-200/60 dark:border-red-500/20',       icon: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
    violet: { border: 'border-violet-200/60 dark:border-violet-500/20', icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
    slate:  { border: 'border-slate-200/60 dark:border-slate-500/20',   icon: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' },
  };
  const s = map[accent] || map.sky;
  return (
    <div className={`bg-white dark:bg-slate-800/60 border ${s.border} rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${s.icon}`}><Icon className="h-5 w-5" /></div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
    </div>
  );
};

const HealthRow = ({ icon: Icon, label, status }) => {
  const c = HEALTH_CFG[status] || HEALTH_CFG.disconnected;
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${c.bg}`}><Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${c.dot} animate-pulse`} />
        <span className={`text-xs font-semibold ${c.clr}`}>{c.label}</span>
      </div>
    </div>
  );
};

const QuotaBar = ({
  label,
  sent,
  limit,
  remaining,
  color = 'sky',
  sentCaption = 'sent today',
  remainingCaption = 'remaining',
}) => {
  const p = pct(sent, limit);
  const bar = p > 85 ? 'bg-red-500' : p > 60 ? 'bg-amber-500' : (QUOTA_BG[color] || 'bg-sky-500');
  const valClr = p > 85 ? 'text-red-600 dark:text-red-400' : p > 60 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300';
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold tabular-nums ${valClr}`}>{p}%</span>
          <span className="text-xs text-slate-400 tabular-nums">{sent}/{limit}</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${bar}`}
          style={{ width: `${Math.max(Math.min(p, 100), p > 0 ? 2 : 0)}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{sent} {sentCaption}</span>
        <span className="font-medium">{remaining} {remainingCaption}</span>
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, title, children, className = '', right }) => (
  <div className={`bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h2>
      </div>
      {right}
    </div>
    {children}
  </div>
);

const MiniStat = ({ label, value, color = 'text-slate-900 dark:text-white' }) => (
  <div className="text-center">
    <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{label}</p>
  </div>
);

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: e.color }} />
          {e.name}: <span className="font-semibold text-slate-700 dark:text-slate-200">{e.value}</span>
        </p>
      ))}
    </div>
  );
};

const Spinner = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700" />
      <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
    </div>
    <p className="text-sm text-slate-500 mt-4">{text}</p>
  </div>
);

const Empty = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
    <Icon className="h-10 w-10 mb-2 opacity-40" />
    <p className="text-sm font-medium">{title}</p>
    {desc && <p className="text-xs mt-1 opacity-70">{desc}</p>}
  </div>
);

// ─── Main ────────────────────────────────────────────────────────────────────

const AdminAnalytics = () => {
  const [tab, setTab] = useState('live');
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const pushToSheet = useMutation(
    () => api.post('/admin/dashboard/push-to-sheet').then((r) => r.data),
    { onSuccess: (d) => toast.success(d.message || 'Exported'), onError: () => toast.error('Export failed') },
  );
  const setupDashboard = useMutation(
    () => api.post('/admin/dashboard/setup-sheet-dashboard').then((r) => r.data),
    { onSuccess: (d) => toast.success(d.message || 'Dashboard created'), onError: (e) => toast.error(e?.response?.data?.message || 'Setup failed') },
  );

  const { data: liveData, isLoading, refetch, isFetching } = useQuery(
    'admin-dashboard-live',
    () => api.get('/admin/dashboard').then((r) => r.data.data),
    { refetchInterval: 5 * 60_000, staleTime: 4 * 60_000, retry: 2, onError: () => toast.error('Failed to load dashboard') },
  );

  const { data: historyResult, isLoading: historyLoading, refetch: refetchHistory } = useQuery(
    ['admin-dashboard-history', historyStart, historyEnd, historyPage],
    () => {
      const q = new URLSearchParams();
      if (historyStart) q.set('start', historyStart);
      if (historyEnd) q.set('end', historyEnd);
      q.set('page', historyPage);
      q.set('limit', 30);
      return api.get(`/admin/dashboard/history?${q}`).then((r) => r.data.data);
    },
    { enabled: tab === 'history', staleTime: 120_000, keepPreviousData: true, retry: 1 },
  );

  const rows = historyResult?.rows || [];
  const hTotal = historyResult?.total || 0;
  const hPages = historyResult?.totalPages || 0;

  // Destructure
  const d  = liveData || {};
  const m  = d.meetings || {};
  const p  = d.payments || {};
  const eb = d.emails?.brevo || {};
  const er = d.emails?.resend || {};
  const em = d.emails?.mailersend || {};
  const hl = d.health || {};
  const sr = d.serviceRequests || {};
  const cr = d.customRequests || {};
  const pj = d.projects || {};
  const us = d.users || {};

  const totalEmails  = (eb.sent || 0) + (er.sent || 0) + (em.sent || 0);
  const totalReqs    = (sr.total || 0) + (cr.total || 0);
  const healthArr    = [hl.backend, hl.frontend, hl.database, hl.googleOAuth];
  const healthUp     = healthArr.filter((s) => s === 'up' || s === 'connected').length;
  const healthPct    = pct(healthUp, healthArr.length);
  const mailerLimit = em.monthlyLimit || em.limit || 500;
  const mailerUsed = em.monthlyUsed ?? em.sent ?? 0;
  const mailerRemaining = em.monthlyRemaining ?? em.remaining ?? Math.max(mailerLimit - mailerUsed, 0);
  const emailCap = pct(mailerRemaining, mailerLimit);
  const overallUsage = pct(mailerUsed, mailerLimit);

  const payPie = useMemo(() => [
    { name: 'Completed', value: p.completed || 0 },
    { name: 'Pending',   value: p.pending || 0 },
    { name: 'Failed',    value: p.failed || 0 },
    { name: 'Refunded',  value: p.refunded || 0 },
  ].filter((x) => x.value > 0), [p.completed, p.pending, p.failed, p.refunded]);

  const mtgBar = useMemo(() => [
    { name: 'Confirmed', count: m.confirmed || 0 },
    { name: 'Cancelled', count: m.cancelled || 0 },
    { name: 'Completed', count: m.completed || 0 },
  ], [m.confirmed, m.cancelled, m.completed]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tab === 'live'
              ? `Real-time data for ${d.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
              : `Historical snapshots · ${hTotal} record${hTotal !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {[{ k: 'live', l: 'Today', I: BoltIcon }, { k: 'history', l: 'History', I: ChartBarIcon }].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === t.k ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
                <t.I className="h-3.5 w-3.5" />{t.l}
              </button>
            ))}
          </div>
          {tab === 'live' && (
            <>
              <button onClick={() => setupDashboard.mutate()} disabled={setupDashboard.isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50">
                <PresentationChartBarIcon className={`h-3.5 w-3.5 ${setupDashboard.isLoading ? 'animate-pulse' : ''}`} />
                {setupDashboard.isLoading ? 'Building…' : 'Sheet Dashboard'}
              </button>
              <button onClick={() => pushToSheet.mutate()} disabled={pushToSheet.isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                <CloudArrowUpIcon className={`h-3.5 w-3.5 ${pushToSheet.isLoading ? 'animate-bounce' : ''}`} />
                {pushToSheet.isLoading ? 'Exporting…' : 'Export'}
              </button>
              <button onClick={() => refetch()} disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 transition-colors disabled:opacity-50">
                <ArrowPathIcon className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══ LIVE TAB ═══ */}
      {tab === 'live' && (
        <>
          {isLoading ? <Spinner text="Loading analytics…" /> : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard icon={CalendarDaysIcon} label="Meetings Today" value={m.total || 0}
                  sub={`${m.confirmed || 0} confirmed · ${m.completed || 0} done`} accent="sky" />
                <StatCard icon={CreditCardIcon} label="Today's Revenue" value={fmtINR(p.revenue)}
                  sub={`${p.total || 0} txns · ${p.completed || 0} completed`} accent="green" />
                <StatCard icon={EnvelopeIcon} label="Emails Sent" value={totalEmails}
                  sub={`Brevo ${eb.sent || 0} · Resend ${er.sent || 0} · MailerSend ${em.sent || 0}`} accent="violet" />
                <StatCard icon={ClipboardDocumentListIcon} label="Requests" value={totalReqs}
                  sub={`${sr.pending || 0} service · ${cr.pending || 0} custom pending`} accent="amber" />
                <StatCard icon={UserGroupIcon} label="Total Users" value={us.total || 0}
                  sub={us.newToday > 0 ? `+${us.newToday} joined today` : 'No new signups today'} accent="slate" />
                <StatCard icon={ArrowTrendingUpIcon} label="Projects" value={pj.total || 0}
                  sub={`${pj.active || 0} active · ${pj.completed || 0} delivered`} accent="sky" />
              </div>

              {/* Health + Quotas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <Card icon={ShieldCheckIcon} title="System Health" className="lg:col-span-4"
                  right={<span className={`text-xs font-bold px-2.5 py-1 rounded-full ${healthPct === 100 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : healthPct >= 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>{healthPct}% up</span>}>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    <HealthRow icon={ServerIcon} label="Backend API" status={hl.backend} />
                    <HealthRow icon={GlobeAltIcon} label="Frontend" status={hl.frontend} />
                    <HealthRow icon={CircleStackIcon} label="Database" status={hl.database} />
                    <HealthRow icon={VideoCameraIcon} label="Google OAuth" status={hl.googleOAuth} />
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">{healthUp}/{healthArr.length} services operational</p>
                    {hl.lastCheckedAt && <p className="text-[11px] text-slate-400">Checked {new Date(hl.lastCheckedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                </Card>

                <Card icon={EnvelopeIcon} title="Email Quotas" className="lg:col-span-8"
                  right={<span className="text-[11px] text-slate-400">Brevo/Resend daily · MailerSend monthly</span>}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <QuotaBar label="Brevo (SMTP)" sent={eb.sent || 0} limit={eb.limit || 300} remaining={eb.remaining ?? 300} color="sky" />
                    <QuotaBar label="Resend (Meetings)" sent={er.sent || 0} limit={er.limit || 100} remaining={er.remaining ?? 100} color="violet" />
                    <QuotaBar
                      label="MailerSend (Docs)"
                      sent={mailerUsed}
                      limit={mailerLimit}
                      remaining={mailerRemaining}
                      sentCaption="used this month"
                      remainingCaption="monthly remaining"
                      color="amber"
                    />
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/40 grid grid-cols-4 gap-4">
                    <MiniStat label="Total Sent" value={totalEmails} color="text-violet-600 dark:text-violet-400" />
                    <MiniStat label="MailerSend Used" value={mailerUsed} />
                    <MiniStat label="MailerSend Cap" value={mailerLimit} />
                    <MiniStat label="Usage" value={`${overallUsage}%`}
                      color={overallUsage > 80 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'} />
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card icon={CalendarDaysIcon} title="Meetings Breakdown">
                  {m.total > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={mtgBar} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TT />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                        <Bar dataKey="count" name="Count" radius={[8, 8, 0, 0]}>
                          {mtgBar.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty icon={CalendarDaysIcon} title="No meetings today" />}
                </Card>

                <Card icon={CreditCardIcon} title="Payment Status"
                  right={p.total > 0 && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{fmtINR(p.revenue)} earned</span>}>
                  {payPie.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={payPie} cx="50%" cy="50%" outerRadius={85} innerRadius={50}
                          dataKey="value" paddingAngle={4} strokeWidth={0}
                          label={({ name, value }) => `${name} (${value})`}>
                          {payPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip content={<TT />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className="text-slate-600 dark:text-slate-400">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <Empty icon={CreditCardIcon} title="No payments today" />}
                </Card>
              </div>

              {/* Requests + Projects + Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card icon={InboxStackIcon} title="Request Pipeline">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { n: sr.pending || 0, l: 'Service Pending', c: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/5' },
                        { n: sr.approved || 0, l: 'Service Approved', c: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/5' },
                        { n: cr.pending || 0, l: 'Custom Pending', c: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/5' },
                        { n: totalReqs, l: 'Total Today', c: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/5' },
                      ].map((b) => (
                        <div key={b.l} className={`${b.bg} rounded-xl p-3.5 text-center`}>
                          <p className={`text-xl font-bold ${b.c}`}>{b.n}</p>
                          <p className={`text-[11px] font-medium ${b.c} opacity-70 mt-0.5`}>{b.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card icon={DocumentTextIcon} title="Project Overview">
                  <div className="space-y-3">
                    {[
                      { l: 'Active', v: pj.active || 0, cls: 'bg-sky-500' },
                      { l: 'Completed', v: pj.completed || 0, cls: 'bg-emerald-500' },
                      { l: 'Other', v: Math.max((pj.total || 0) - (pj.active || 0) - (pj.completed || 0), 0), cls: 'bg-slate-300 dark:bg-slate-600' },
                    ].map((item) => {
                      const w = pct(item.v, pj.total || 1);
                      return (
                        <div key={item.l}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{item.l}</span>
                            <span className="tabular-nums text-slate-500">{item.v} <span className="text-slate-400">({w}%)</span></span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${item.cls}`}
                              style={{ width: `${Math.max(w, item.v > 0 ? 3 : 0)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/40 flex justify-between">
                    <MiniStat label="Total" value={pj.total || 0} />
                    <MiniStat label="Active" value={pj.active || 0} color="text-sky-600 dark:text-sky-400" />
                    <MiniStat label="Delivered" value={pj.completed || 0} color="text-emerald-600 dark:text-emerald-400" />
                  </div>
                </Card>

                <Card icon={BoltIcon} title="Quick Insights">
                  <div className="space-y-3">
                    {[
                      { l: 'Meeting Fill Rate', v: m.total > 0 ? `${pct(m.confirmed || 0, m.total)}%` : '—', d: 'Confirmed vs total bookings', I: CalendarDaysIcon, c: 'text-sky-600 dark:text-sky-400' },
                      { l: 'Payment Success', v: p.total > 0 ? `${pct(p.completed || 0, p.total)}%` : '—', d: 'Completed vs total payments', I: CreditCardIcon, c: 'text-emerald-600 dark:text-emerald-400' },
                      { l: 'Request Approval', v: totalReqs > 0 ? `${pct(sr.approved || 0, totalReqs)}%` : '—', d: 'Approved service requests', I: ClipboardDocumentListIcon, c: 'text-amber-600 dark:text-amber-400' },
                      { l: 'Email Capacity', v: `${emailCap}%`, d: 'MailerSend monthly remaining', I: EnvelopeIcon, c: 'text-violet-600 dark:text-violet-400' },
                    ].map((ins) => (
                      <div key={ins.l} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="shrink-0 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                          <ins.I className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{ins.l}</p>
                            <p className={`text-sm font-bold tabular-nums ${ins.c}`}>{ins.v}</p>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ins.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Meetings table */}
              <Card icon={VideoCameraIcon} title={`Today's Meetings (${m.total || 0})`}
                right={m.total > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />{m.confirmed || 0} confirmed</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" />{m.completed || 0} done</span>
                  </div>
                )}>
                {m.list?.length > 0 ? (
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          {['Client', 'Email', 'Time', 'Meet Link', 'Status'].map((c) => (
                            <th key={c} className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider first:pl-0">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                        {m.list.map((mtg, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="py-3 px-3 first:pl-0 font-medium text-slate-800 dark:text-slate-200">{mtg.clientName}</td>
                            <td className="py-3 px-3 text-slate-500 text-xs">{mtg.clientEmail}</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">{fmt12(mtg.startTime)} – {fmt12(mtg.endTime)}</td>
                            <td className="py-3 px-3">
                              {mtg.meetLink
                                ? <a href={mtg.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 dark:text-sky-400 text-xs font-semibold"><VideoCameraIcon className="h-3.5 w-3.5" />Join</a>
                                : <span className="text-slate-400 text-xs">—</span>}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ring-1 ring-inset ${BADGE[mtg.status] || 'bg-slate-100 text-slate-500 ring-slate-200'}`}>{mtg.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty icon={VideoCameraIcon} title="No meetings scheduled for today" desc="Meetings will appear here once booked" />}
              </Card>
            </>
          )}
        </>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === 'history' && (
        <div className="space-y-4">
          <Card icon={ChartBarIcon} title="Filter Snapshots">
            <div className="flex flex-wrap items-end gap-3">
              {[
                { l: 'From', v: historyStart, fn: (e) => { setHistoryStart(e.target.value); setHistoryPage(1); } },
                { l: 'To', v: historyEnd, fn: (e) => { setHistoryEnd(e.target.value); setHistoryPage(1); } },
              ].map((f) => (
                <div key={f.l}>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{f.l}</label>
                  <input type="date" value={f.v} onChange={f.fn}
                    className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 outline-none transition-shadow" />
                </div>
              ))}
              <button onClick={() => { setHistoryPage(1); refetchHistory(); }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-xl bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-500/20 transition-all">
                <ArrowPathIcon className="h-3.5 w-3.5" />Load
              </button>
              {(historyStart || historyEnd) && (
                <button onClick={() => { setHistoryStart(''); setHistoryEnd(''); setHistoryPage(1); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 transition-colors">
                  <XCircleIcon className="h-3.5 w-3.5" />Clear
                </button>
              )}
            </div>
          </Card>

          {historyLoading ? <Spinner text="Loading snapshots…" /> : rows.length > 0 ? (
            <>
              <div className="bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                        {['Date', 'Meetings', 'Payments', 'Revenue', 'Emails', 'Backend', 'Frontend', 'Requests', 'Projects', 'New Users'].map((c) => (
                          <th key={c} className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-slate-500 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                      {rows.map((s) => {
                        const sm = s.meetings || {}, sp = s.payments || {}, se = s.emails || {}, sh = s.health || {};
                        const te = (se.brevo?.sent || 0) + (se.resend?.sent || 0) + (se.mailersend?.sent || 0);
                        return (
                          <tr key={s.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap text-xs">
                              {new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{sm.total || 0}</span>
                              {sm.confirmed > 0 && <span className="text-[11px] text-emerald-500 ml-1">({sm.confirmed} conf.)</span>}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{sp.total || 0}</span>
                              {sp.completed > 0 && <span className="text-[11px] text-emerald-500 ml-1">({sp.completed} done)</span>}
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtINR(sp.revenue)}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {te > 0 ? <span className="text-xs"><span className="font-semibold">{te}</span> sent</span> : <span className="text-slate-400">—</span>}
                            </td>
                            {[{ k: 'backend' }, { k: 'frontend' }].map(({ k }) => (
                              <td key={k} className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${sh[k] === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {sh[k] === 'up' ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <XCircleIcon className="h-3.5 w-3.5" />}
                                  {sh[k] === 'up' ? 'Up' : sh[k] || '—'}
                                </span>
                              </td>
                            ))}
                            <td className="py-3 px-4 text-slate-700 font-medium">{(s.serviceRequests?.total || 0) + (s.customRequests?.total || 0)}</td>
                            <td className="py-3 px-4 text-slate-700">{s.projects?.active || 0}<span className="text-[11px] text-slate-400 ml-0.5">active</span></td>
                            <td className="py-3 px-4">
                              {(s.users?.newToday || 0) > 0
                                ? <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">+{s.users.newToday}</span>
                                : <span className="text-slate-400">0</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {hPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl px-5 py-3">
                  <p className="text-xs text-slate-500">Page {historyPage} of {hPages} · {hTotal} snapshots</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHistoryPage((v) => Math.max(v - 1, 1))} disabled={historyPage <= 1}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                    <button onClick={() => setHistoryPage((v) => Math.min(v + 1, hPages))} disabled={historyPage >= hPages}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl">
              <ChartBarIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No snapshots found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">Snapshots are recorded daily. Adjust the date range or check back tomorrow.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
