import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ServerIcon,
  GlobeAltIcon,
  CircleStackIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const healthLabel = {
  up: 'Online',
  down: 'Offline',
  degraded: 'Degraded',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
};
const healthColor = {
  up: 'text-green-500',
  down: 'text-red-500',
  degraded: 'text-amber-500',
  connected: 'text-green-500',
  disconnected: 'text-slate-400',
  error: 'text-red-500',
};
const healthDot = {
  up: 'bg-green-500',
  down: 'bg-red-500',
  degraded: 'bg-amber-500',
  connected: 'bg-green-500',
  disconnected: 'bg-slate-400',
  error: 'bg-red-500',
};

const formatTime12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, accent = 'sky' }) => {
  const accents = {
    sky: 'from-sky-500/10 to-sky-500/5 border-sky-200 dark:border-sky-500/20',
    green: 'from-green-500/10 to-green-500/5 border-green-200 dark:border-green-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-500/20',
    red: 'from-red-500/10 to-red-500/5 border-red-200 dark:border-red-500/20',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-200 dark:border-violet-500/20',
    slate: 'from-slate-500/10 to-slate-500/5 border-slate-200 dark:border-slate-500/20',
  };
  const iconAccent = {
    sky: 'text-sky-500',
    green: 'text-green-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    violet: 'text-violet-500',
    slate: 'text-slate-500',
  };

  return (
    <div
      className={`bg-gradient-to-br ${accents[accent]} border rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-md`}
    >
      <div className={`shrink-0 mt-0.5 ${iconAccent[accent]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
};

// ─── Health Indicator ────────────────────────────────────────────────────────

const HealthRow = ({ icon: Icon, label, status }) => (
  <div className="flex items-center justify-between py-2.5">
    <div className="flex items-center gap-2.5">
      <Icon className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-2 w-2 rounded-full ${healthDot[status] || 'bg-slate-400'}`}
      />
      <span className={`text-xs font-semibold ${healthColor[status] || 'text-slate-400'}`}>
        {healthLabel[status] || status}
      </span>
    </div>
  </div>
);

// ─── Quota Bar ───────────────────────────────────────────────────────────────

const QuotaBar = ({ label, sent, limit, remaining, color = 'sky' }) => {
  const pct = limit > 0 ? Math.round((sent / limit) * 100) : 0;
  const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : `bg-${color}-500`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {sent} / {limit} &middot; <span className="font-semibold">{remaining} left</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
};

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, children }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-slate-400" />
      <h2 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h2>
    </div>
    {children}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminAnalytics = () => {
  const [tab, setTab] = useState('live');
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');

  // Push to sheet mutation
  const pushToSheet = useMutation(
    async () => {
      const res = await api.post('/admin/dashboard/push-to-sheet');
      return res.data;
    },
    {
      onSuccess: (data) => toast.success(data.message || 'Pushed to Google Sheets'),
      onError: () => toast.error('Failed to push to Google Sheets'),
    },
  );

  // Live dashboard
  const {
    data: liveData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery(
    'admin-dashboard-live',
    async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    },
    {
      refetchInterval: 5 * 60_000, // auto-refresh every 5 min (server caches too)
      staleTime: 4 * 60_000,
      retry: 2,
      onError: () => toast.error('Failed to load dashboard'),
    }
  );

  // History
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery(
    ['admin-dashboard-history', historyStart, historyEnd],
    async () => {
      const params = new URLSearchParams();
      if (historyStart) params.set('start', historyStart);
      if (historyEnd) params.set('end', historyEnd);
      const res = await api.get(`/admin/dashboard/history?${params.toString()}`);
      return res.data.data;
    },
    {
      enabled: tab === 'history',
      staleTime: 120_000,
      retry: 1,
    }
  );

  const d = liveData || {};
  const m = d.meetings || {};
  const p = d.payments || {};
  const eb = d.emails?.brevo || {};
  const er = d.emails?.resend || {};
  const h = d.health || {};

  // Charts data
  const paymentPieData = [
    { name: 'Completed', value: p.completed || 0 },
    { name: 'Pending', value: p.pending || 0 },
    { name: 'Failed', value: p.failed || 0 },
    { name: 'Refunded', value: p.refunded || 0 },
  ].filter((i) => i.value > 0);

  const meetingBarData = [
    { name: 'Confirmed', count: m.confirmed || 0 },
    { name: 'Cancelled', count: m.cancelled || 0 },
    { name: 'Completed', count: m.completed || 0 },
  ];

  const meetingStatusStyle = {
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    completed: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tab === 'live'
              ? `Live insights for ${d.date || 'today'}`
              : 'Historical analytics from daily snapshots'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {['live', 'history'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                  tab === t
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t === 'live' ? 'Today' : 'History'}
              </button>
            ))}
          </div>
          {tab === 'live' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => pushToSheet.mutate()}
                disabled={pushToSheet.isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                <CloudArrowUpIcon className={`h-3.5 w-3.5 ${pushToSheet.isLoading ? 'animate-bounce' : ''}`} />
                {pushToSheet.isLoading ? 'Pushing...' : 'Push to Sheet'}
              </button>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── LIVE TAB ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === 'live' && (
        <>
          {isLoading ? (
            <div className="text-center py-24">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* ── Top Stat Cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard
                  icon={CalendarDaysIcon}
                  label="Meetings"
                  value={m.total || 0}
                  sub={`${m.confirmed || 0} confirmed`}
                  accent="sky"
                />
                <StatCard
                  icon={CreditCardIcon}
                  label="Payments"
                  value={p.total || 0}
                  sub={`₹${(p.revenue || 0).toLocaleString('en-IN')} revenue`}
                  accent="green"
                />
                <StatCard
                  icon={EnvelopeIcon}
                  label="Emails Sent"
                  value={(eb.sent || 0) + (er.sent || 0)}
                  sub={`Brevo ${eb.sent || 0} · Resend ${er.sent || 0}`}
                  accent="violet"
                />
                <StatCard
                  icon={ClipboardDocumentListIcon}
                  label="Requests"
                  value={(d.serviceRequests?.total || 0) + (d.customRequests?.total || 0)}
                  sub={`${d.serviceRequests?.pending || 0} pending`}
                  accent="amber"
                />
                <StatCard
                  icon={UserGroupIcon}
                  label="Users"
                  value={d.users?.total || 0}
                  sub={`+${d.users?.newToday || 0} today`}
                  accent="slate"
                />
                <StatCard
                  icon={ArrowTrendingUpIcon}
                  label="Projects"
                  value={d.projects?.total || 0}
                  sub={`${d.projects?.active || 0} active`}
                  accent="sky"
                />
              </div>

              {/* ── System Health + Emails ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Health Panel */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
                  <SectionHeader icon={ServerIcon} title="System Health" />
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    <HealthRow icon={ServerIcon} label="Backend API" status={h.backend} />
                    <HealthRow icon={GlobeAltIcon} label="Frontend" status={h.frontend} />
                    <HealthRow icon={CircleStackIcon} label="Database" status={h.database} />
                    <HealthRow icon={VideoCameraIcon} label="Google OAuth" status={h.googleOAuth} />
                  </div>
                  {h.lastCheckedAt && (
                    <p className="text-[11px] text-slate-400 mt-3">
                      Last checked {new Date(h.lastCheckedAt).toLocaleTimeString('en-IN')}
                    </p>
                  )}
                </div>

                {/* Email Quotas */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
                  <SectionHeader icon={EnvelopeIcon} title="Email Quotas" />
                  <div className="space-y-5">
                    <QuotaBar
                      label="Brevo (SMTP)"
                      sent={eb.sent || 0}
                      limit={eb.limit || 300}
                      remaining={eb.remaining ?? 300}
                      color="sky"
                    />
                    <QuotaBar
                      label="Resend (Meeting Emails)"
                      sent={er.sent || 0}
                      limit={er.limit || 100}
                      remaining={er.remaining ?? 100}
                      color="violet"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-4">
                    Quotas reset at midnight. Data based on today's usage.
                  </p>
                </div>
              </div>

              {/* ── Charts Row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Meetings Bar Chart */}
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
                  <SectionHeader icon={CalendarDaysIcon} title="Meetings Breakdown" />
                  {m.total > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={meetingBarData} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {meetingBarData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-slate-400 py-12 text-center">No meetings today</p>
                  )}
                </div>

                {/* Payments Pie Chart */}
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
                  <SectionHeader icon={CreditCardIcon} title="Payment Status" />
                  {paymentPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={paymentPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={45}
                          dataKey="value"
                          paddingAngle={3}
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {paymentPieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-slate-400 py-12 text-center">No payments today</p>
                  )}
                </div>
              </div>

              {/* ── Meetings Table ── */}
              <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
                <SectionHeader
                  icon={VideoCameraIcon}
                  title={`Today's Meetings (${m.total || 0})`}
                />
                {m.list && m.list.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                            Client
                          </th>
                          <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                            Email
                          </th>
                          <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                            Time
                          </th>
                          <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                            Meet Link
                          </th>
                          <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {m.list.map((mtg, i) => (
                          <tr
                            key={i}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {mtg.clientName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                              {mtg.clientEmail}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {formatTime12(mtg.startTime)} – {formatTime12(mtg.endTime)}
                            </td>
                            <td className="py-2.5 px-3">
                              {mtg.meetLink ? (
                                <a
                                  href={mtg.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-500 hover:underline text-xs font-medium"
                                >
                                  Join
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${meetingStatusStyle[mtg.status] || 'bg-slate-100 text-slate-500'}`}
                              >
                                {mtg.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">
                    No meetings scheduled for today
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── HISTORY TAB ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Date Range Filter */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
            <SectionHeader icon={ChartBarIcon} title="Historical Snapshots" />
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={historyStart}
                  onChange={(e) => setHistoryStart(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={historyEnd}
                  onChange={(e) => setHistoryEnd(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/30 outline-none"
                />
              </div>
              <button
                onClick={() => refetchHistory()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Load
              </button>
            </div>
          </div>

          {/* History Table */}
          {historyLoading ? (
            <div className="text-center py-16">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading history from Google Sheets...</p>
            </div>
          ) : historyData && historyData.length > 0 ? (
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
                      {[
                        'Date',
                        'Meetings',
                        'Payments',
                        'Revenue',
                        'Brevo',
                        'Resend',
                        'Backend',
                        'Frontend',
                        'New Users',
                      ].map((col) => (
                        <th
                          key={col}
                          className="py-3 px-4 font-semibold text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {historyData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {row.Date || row.date}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                          {row['Meetings Total'] ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                          {row['Payments Total'] ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-green-600 dark:text-green-400">
                          ₹{Number(row['Revenue (₹)'] || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {row['Brevo Sent'] ?? '—'} / {row['Brevo Remaining'] ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {row['Resend Sent'] ?? '—'} / {row['Resend Remaining'] ?? '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${row.Backend === 'up' ? 'text-green-500' : 'text-red-500'}`}
                          >
                            {row.Backend === 'up' ? (
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                            ) : (
                              <XCircleIcon className="h-3.5 w-3.5" />
                            )}
                            {row.Backend || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${row.Frontend === 'up' ? 'text-green-500' : 'text-red-500'}`}
                          >
                            {row.Frontend === 'up' ? (
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                            ) : (
                              <XCircleIcon className="h-3.5 w-3.5" />
                            )}
                            {row.Frontend || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                          {row['New Users'] ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
              <ChartBarIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                No historical data yet. Snapshots are saved nightly at 11:59 PM IST.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Select a date range and click Load, or wait for the first nightly flush.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
