import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  CurrencyRupeeIcon,
  TagIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon,
  CubeIcon,
  CalendarDaysIcon,
  PuzzlePieceIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { formatINR } from '../../utils/currency';

/* ── Constants ────────────────────────────────────── */

const TABS = [
  { key: 'plan', label: 'Plans', icon: WrenchScrewdriverIcon },
  { key: 'combo', label: 'Combos', icon: CubeIcon },
  { key: 'monthly', label: 'Monthly', icon: CalendarDaysIcon },
  { key: 'addon', label: 'Add-ons', icon: PuzzlePieceIcon },
];

const CATEGORIES = [
  { value: 'web-development', label: 'Web Development' },
  { value: 'branding-creative', label: 'Branding & Creative' },
  { value: 'app-development', label: 'App Development' },
];

const CATEGORY_STYLES = {
  'web-development': {
    border: 'border-violet-200 dark:border-violet-500/30',
    badge: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  },
  'branding-creative': {
    border: 'border-amber-200 dark:border-amber-500/30',
    badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  },
  'app-development': {
    border: 'border-sky-200 dark:border-sky-500/30',
    badge: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  },
};

const TYPE_COLORS = {
  plan: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  combo: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  monthly: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  addon: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
};

const EMPTY_FORM = {
  name: '',
  slug: '',
  type: 'plan',
  category: '',
  description: '',
  tagline: '',
  basePrice: '',
  offerPercent: '',
  sortOrder: '',
  delivery: '',
  bestFor: '',
  popular: false,
  highlights: '',
  support: '',
  features: '',
  excludes: '',
  originalPrice: '',
  discount: '',
  color: '',
  gradient: '',
  responseTime: '',
  updates: '',
  notIncluded: '',
  unit: '',
};

/* ── Helpers ──────────────────────────────────────── */

const toArr = (v) =>
  typeof v === 'string'
    ? v
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : v || [];
const toStr = (v) => (Array.isArray(v) ? v.join('\n') : v || '');

const ServiceManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('plan');
  const [showInactive, setShowInactive] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  /* ── Data fetch ─────────────────────────────────── */

  const { data: allServices, isLoading } = useQuery('admin-services', async () => {
    const [activeRes, inactiveRes] = await Promise.all([
      api.get('/services?isActive=true'),
      api.get('/services?isActive=false'),
    ]);
    return [...(activeRes.data.services || []), ...(inactiveRes.data.services || [])];
  });

  const filtered = useMemo(() => {
    if (!allServices) return [];
    let list = allServices.filter((s) => s.type === activeTab);
    if (!showInactive) list = list.filter((s) => s.isActive);
    return list.sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name)
    );
  }, [allServices, activeTab, showInactive]);

  const counts = useMemo(() => {
    const c = { plan: 0, combo: 0, monthly: 0, addon: 0, inactive: 0 };
    (allServices || []).forEach((s) => {
      if (c[s.type] !== undefined) c[s.type]++;
      if (!s.isActive) c.inactive++;
    });
    return c;
  }, [allServices]);

  /* ── Mutations ──────────────────────────────────── */

  const saveMutation = useMutation(
    async () => {
      const payload = buildPayload();
      if (editing) return api.put(`/services/${editing._id}`, payload);
      return api.post('/services', payload);
    },
    {
      onSuccess: () => {
        toast.success(editing ? 'Service updated' : 'Service created');
        queryClient.invalidateQueries('admin-services');
        queryClient.invalidateQueries('service-catalog');
        closeModal();
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
    }
  );

  const deleteMutation = useMutation((id) => api.delete(`/services/${id}`), {
    onSuccess: () => {
      toast.success('Service deactivated');
      queryClient.invalidateQueries('admin-services');
      queryClient.invalidateQueries('service-catalog');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const reactivateMutation = useMutation((id) => api.put(`/services/${id}`, { isActive: true }), {
    onSuccess: () => {
      toast.success('Service reactivated');
      queryClient.invalidateQueries('admin-services');
      queryClient.invalidateQueries('service-catalog');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const reseedMutation = useMutation(() => api.post('/services/reseed'), {
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Catalog re-seeded');
      queryClient.invalidateQueries('admin-services');
      queryClient.invalidateQueries('service-catalog');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Re-seed failed'),
  });

  /* ── Form helpers ───────────────────────────────── */

  const buildPayload = () => {
    const p = {
      name: formData.name.trim(),
      slug:
        formData.slug.trim() ||
        formData.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      type: formData.type,
      category: formData.type === 'plan' ? formData.category : null,
      description: formData.description.trim(),
      tagline: formData.tagline.trim(),
      basePrice: formData.basePrice ? Number(formData.basePrice) : 0,
      offerPercent: formData.offerPercent ? Number(formData.offerPercent) : 0,
      sortOrder: formData.sortOrder ? Number(formData.sortOrder) : 0,
      popular: formData.popular,
    };
    if (['plan', 'combo', 'monthly'].includes(formData.type)) {
      p.delivery = formData.delivery.trim();
      p.bestFor = formData.bestFor.trim();
      p.highlights = toArr(formData.highlights);
      p.features = toArr(formData.features);
    }
    if (formData.type === 'plan') {
      p.support = formData.support.trim();
      p.excludes = toArr(formData.excludes);
    }
    if (formData.type === 'combo') {
      p.originalPrice = formData.originalPrice ? Number(formData.originalPrice) : 0;
      p.discount = formData.discount ? Number(formData.discount) : 0;
      p.color = formData.color.trim();
      p.gradient = formData.gradient.trim();
    }
    if (formData.type === 'monthly') {
      p.responseTime = formData.responseTime.trim();
      p.updates = formData.updates.trim();
      p.notIncluded = toArr(formData.notIncluded);
    }
    if (formData.type === 'addon') {
      p.unit = formData.unit.trim();
    }
    return p;
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Required';
    if (formData.type === 'plan' && !formData.category) errs.category = 'Required';
    if (formData.basePrice && (isNaN(formData.basePrice) || Number(formData.basePrice) < 0))
      errs.basePrice = 'Invalid';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...EMPTY_FORM, type: activeTab });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (svc) => {
    setEditing(svc);
    setFormData({
      name: svc.name || '',
      slug: svc.slug || '',
      type: svc.type || 'plan',
      category: svc.category || '',
      description: svc.description || '',
      tagline: svc.tagline || '',
      basePrice: svc.basePrice || '',
      offerPercent: svc.offerPercent || '',
      sortOrder: svc.sortOrder || '',
      delivery: svc.delivery || '',
      bestFor: svc.bestFor || '',
      popular: svc.popular || false,
      highlights: toStr(svc.highlights),
      support: svc.support || '',
      features: toStr(svc.features),
      excludes: toStr(svc.excludes),
      originalPrice: svc.originalPrice || '',
      discount: svc.discount || '',
      color: svc.color || '',
      gradient: svc.gradient || '',
      responseTime: svc.responseTime || '',
      updates: svc.updates || '',
      notIncluded: toStr(svc.notIncluded),
      unit: svc.unit || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    saveMutation.mutate();
  };

  const set = (key, val) => setFormData((fd) => ({ ...fd, [key]: val }));

  /* ── Render ─────────────────────────────────────── */

  const total = allServices?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} services total{counts.inactive > 0 ? ` · ${counts.inactive} inactive` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Re-seed will REPLACE all services with defaults. Continue?'))
                reseedMutation.mutate();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-600 transition-colors"
            title="Re-seed catalog from defaults"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Re-seed
          </button>
          {counts.inactive > 0 && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                showInactive
                  ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {showInactive ? (
                <EyeIcon className="w-3.5 h-3.5" />
              ) : (
                <EyeSlashIcon className="w-3.5 h-3.5" />
              )}
              {showInactive ? 'All' : 'Active'}
            </button>
          )}
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-1.5">
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                active
                  ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? TYPE_COLORS[t.key] : 'bg-gray-200 dark:bg-surface-600 text-gray-500 dark:text-gray-400'}`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card dark:bg-surface-800 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-surface-700 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-50 dark:bg-surface-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-50 dark:bg-surface-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card dark:bg-surface-800 text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-surface-700 flex items-center justify-center">
            <SparklesIcon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No {activeTab} services found
          </p>
          <button
            onClick={openCreate}
            className="btn-primary mt-4 inline-flex items-center gap-1.5 text-sm"
          >
            <PlusIcon className="w-4 h-4" /> Create One
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((svc) => (
            <ServiceCard
              key={svc._id}
              svc={svc}
              onEdit={openEdit}
              onDelete={deleteMutation}
              onReactivate={reactivateMutation}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ServiceModal
          formData={formData}
          errors={errors}
          editing={editing}
          saving={saveMutation.isLoading}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={set}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function ServiceCard({ svc, onEdit, onDelete, onReactivate }) {
  const inactive = !svc.isActive;
  const catStyle = CATEGORY_STYLES[svc.category] || {};
  const borderClass = catStyle.border || 'border-gray-200 dark:border-surface-700';

  return (
    <div
      className={`card dark:bg-surface-800 group relative border-l-4 ${borderClass} hover:shadow-md transition-all duration-200 ${inactive ? 'opacity-50 grayscale' : ''}`}
    >
      {inactive && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded-md">
          Inactive
        </div>
      )}
      {svc.popular && !inactive && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded-md flex items-center gap-0.5">
          <StarIcon className="w-3 h-3" /> Popular
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="pr-16">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
            {svc.name}
          </h3>
          {svc.slug && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
              {svc.slug}
            </p>
          )}
        </div>
        <div
          className={`flex gap-0.5 ${inactive ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
        >
          {inactive ? (
            <button
              onClick={() => onReactivate.mutate(svc._id)}
              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
              title="Reactivate"
            >
              <ArrowPathIcon className="w-4 h-4 text-emerald-500" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onEdit(svc)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg"
                title="Edit"
              >
                <PencilSquareIcon className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Deactivate "${svc.name}"?`)) onDelete.mutate(svc._id);
                }}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                title="Deactivate"
              >
                <TrashIcon className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {svc.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {svc.description}
        </p>
      )}
      {svc.tagline && !svc.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {svc.tagline}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-surface-700 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {svc.category && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${catStyle.badge || 'bg-gray-100 dark:bg-surface-600 text-gray-600 dark:text-gray-400'}`}
            >
              <TagIcon className="w-2.5 h-2.5 inline mr-0.5" />
              {svc.category.replace(/-/g, ' ')}
            </span>
          )}
          {svc.delivery && <span className="text-[10px] text-gray-400">{svc.delivery}</span>}
        </div>
        <div className="flex items-center gap-2">
          {svc.offerPercent > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {svc.offerPercent}% off
            </span>
          )}
          {svc.discount > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {svc.discount}% off
            </span>
          )}
          {svc.basePrice > 0 && (
            <span className="inline-flex items-center gap-0.5 text-sm font-bold text-gray-900 dark:text-white">
              <CurrencyRupeeIcon className="w-3.5 h-3.5 text-gray-400" />
              {svc.offerPercent > 0 ? (
                <>
                  <span className="line-through text-gray-400 text-xs font-normal mr-1">
                    {formatINR(svc.basePrice).replace('₹', '')}
                  </span>
                  {formatINR(Math.round(svc.basePrice * (1 - svc.offerPercent / 100))).replace('₹', '')}
                </>
              ) : (
                formatINR(svc.basePrice).replace('₹', '')
              )}
            </span>
          )}
        </div>
      </div>

      {/* Features preview */}
      {svc.features?.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-gray-50 dark:border-surface-700/50">
          <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wider">
            Features ({svc.features.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {svc.features.slice(0, 4).map((f, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 dark:bg-surface-700 text-gray-500 dark:text-gray-400 truncate max-w-[140px]"
              >
                {f}
              </span>
            ))}
            {svc.features.length > 4 && (
              <span className="text-[10px] text-gray-400">+{svc.features.length - 4} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────── */

function ServiceModal({ formData, errors, editing, saving, onClose, onSubmit, onChange }) {
  const type = formData.type;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh] overflow-y-auto"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in border border-gray-100 dark:border-surface-700 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editing ? 'Edit Service' : 'New Service'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Type: <span className="font-semibold capitalize">{type}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Type selector (only on create) */}
          {!editing && (
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => onChange('type', e.target.value)}
                className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
              >
                <option value="plan">Plan</option>
                <option value="combo">Combo</option>
                <option value="monthly">Monthly</option>
                <option value="addon">Add-on</option>
              </select>
            </Field>
          )}

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" error={errors.name} className="col-span-2">
              <input
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                className={`input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white ${errors.name ? 'border-red-400' : ''}`}
                maxLength={100}
                placeholder="Service name"
              />
            </Field>
            <Field label="Slug">
              <input
                value={formData.slug}
                onChange={(e) => onChange('slug', e.target.value)}
                className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white font-mono text-xs"
                placeholder="auto-generated"
              />
            </Field>
            <Field label="Sort Order">
              <input
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => onChange('sortOrder', e.target.value)}
                className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                placeholder="0"
              />
            </Field>
          </div>

          {type === 'plan' && (
            <Field label="Category" error={errors.category}>
              <select
                value={formData.category}
                onChange={(e) => onChange('category', e.target.value)}
                className={`input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white ${errors.category ? 'border-red-400' : ''}`}
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white resize-none"
              rows={2}
              placeholder="Brief description…"
            />
          </Field>

          {type !== 'addon' && (
            <Field label="Tagline">
              <input
                value={formData.tagline}
                onChange={(e) => onChange('tagline', e.target.value)}
                className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                placeholder="Short tagline"
              />
            </Field>
          )}

          {/* Price row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)" error={errors.basePrice}>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.basePrice}
                onChange={(e) => onChange('basePrice', e.target.value)}
                className={`input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white ${errors.basePrice ? 'border-red-400' : ''}`}
                placeholder="0"
              />
            </Field>
            <Field label="Offer %" error={errors.offerPercent}>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.offerPercent}
                onChange={(e) => onChange('offerPercent', e.target.value)}
                className={`input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white ${errors.offerPercent ? 'border-red-400' : ''}`}
                placeholder="0"
              />
              {formData.basePrice && formData.offerPercent > 0 && (
                <p className="mt-0.5 text-[11px] text-emerald-600">
                  Discounted: {formatINR(Math.round(Number(formData.basePrice) * (1 - Number(formData.offerPercent) / 100)))}
                </p>
              )}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {type === 'combo' && (
              <Field label="Original Price">
                <input
                  type="number"
                  min="0"
                  value={formData.originalPrice}
                  onChange={(e) => onChange('originalPrice', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                  placeholder="0"
                />
              </Field>
            )}
            {type === 'combo' && (
              <Field label="Discount %">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => onChange('discount', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                  placeholder="0"
                />
              </Field>
            )}
            {type === 'addon' && (
              <Field label="Unit">
                <input
                  value={formData.unit}
                  onChange={(e) => onChange('unit', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                  placeholder="/page, /month"
                />
              </Field>
            )}
          </div>

          {/* Plan / Combo / Monthly specific */}
          {['plan', 'combo', 'monthly'].includes(type) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Delivery">
                  <input
                    value={formData.delivery}
                    onChange={(e) => onChange('delivery', e.target.value)}
                    className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                    placeholder="2–3 days"
                  />
                </Field>
                <Field label="Best For">
                  <input
                    value={formData.bestFor}
                    onChange={(e) => onChange('bestFor', e.target.value)}
                    className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                    placeholder="Target audience"
                  />
                </Field>
              </div>

              <Field label="Highlights (one per line)">
                <textarea
                  value={formData.highlights}
                  onChange={(e) => onChange('highlights', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white resize-none text-xs"
                  rows={2}
                  placeholder="Unlimited revisions&#10;Chat support"
                />
              </Field>

              <Field label="Features (one per line)">
                <textarea
                  value={formData.features}
                  onChange={(e) => onChange('features', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white resize-none text-xs"
                  rows={4}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </Field>
            </>
          )}

          {type === 'plan' && (
            <>
              <Field label="Support">
                <input
                  value={formData.support}
                  onChange={(e) => onChange('support', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                  placeholder="7-day post-launch support"
                />
              </Field>
              <Field label="Excludes (one per line)">
                <textarea
                  value={formData.excludes}
                  onChange={(e) => onChange('excludes', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white resize-none text-xs"
                  rows={2}
                  placeholder="E-commerce features&#10;Custom animations"
                />
              </Field>
            </>
          )}

          {type === 'monthly' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Response Time">
                  <input
                    value={formData.responseTime}
                    onChange={(e) => onChange('responseTime', e.target.value)}
                    className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                    placeholder="Within 48 hours"
                  />
                </Field>
                <Field label="Updates">
                  <input
                    value={formData.updates}
                    onChange={(e) => onChange('updates', e.target.value)}
                    className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white"
                    placeholder="2 minor updates/month"
                  />
                </Field>
              </div>
              <Field label="Not Included (one per line)">
                <textarea
                  value={formData.notIncluded}
                  onChange={(e) => onChange('notIncluded', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white resize-none text-xs"
                  rows={2}
                  placeholder="Design changes&#10;SEO optimization"
                />
              </Field>
            </>
          )}

          {type === 'combo' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color (RGB)">
                <input
                  value={formData.color}
                  onChange={(e) => onChange('color', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white font-mono text-xs"
                  placeholder="245,158,11"
                />
              </Field>
              <Field label="Gradient">
                <input
                  value={formData.gradient}
                  onChange={(e) => onChange('gradient', e.target.value)}
                  className="input-field dark:bg-surface-700 dark:border-surface-600 dark:text-white font-mono text-xs"
                  placeholder="from-amber-500 to-orange-500"
                />
              </Field>
            </div>
          )}

          {/* Popular toggle */}
          {type !== 'addon' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.popular}
                onChange={(e) => onChange('popular', e.target.checked)}
                className="rounded border-gray-300 dark:border-surface-600 text-sky-500 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Mark as popular</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-surface-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary dark:bg-surface-700 dark:text-gray-300 dark:border-surface-600 dark:hover:bg-surface-600"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-0.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export default ServiceManagement;
