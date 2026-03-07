import { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatINR } from '../../utils/currency';
import { useCatalog } from '../../context/CatalogContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckIcon,
  TagIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/* ─── Flatten every purchasable option into a single array ─── */
const buildOptions = (CATEGORY_ORDER, PLAN_CATALOG, COMBO_PACKAGES, MONTHLY_PLANS, ADD_ONS) => {
  const options = [];

  /* Service plans */
  CATEGORY_ORDER.forEach((catSlug) => {
    const cat = PLAN_CATALOG[catSlug];
    if (!cat) return;
    cat.plans.forEach((plan) => {
      options.push({
        id: `plan-${catSlug}-${plan.slug}`,
        group: cat.name,
        type: 'plan',
        label: plan.name,
        sublabel: plan.bestFor,
        price: plan.price,
        delivery: plan.delivery,
        serviceType: catSlug,
        plan: plan.slug,
      });
    });
  });

  /* Combo packages */
  COMBO_PACKAGES.forEach((combo) => {
    options.push({
      id: `combo-${combo.slug}`,
      group: 'Combo Packages',
      type: 'combo',
      label: combo.name,
      sublabel: combo.tagline,
      price: combo.price,
      originalPrice: combo.originalPrice,
      discount: combo.discount,
      delivery: combo.delivery,
      serviceType: 'combo',
      plan: combo.slug,
    });
  });

  /* Monthly plans */
  MONTHLY_PLANS.forEach((mp) => {
    options.push({
      id: `monthly-${mp.slug}`,
      group: 'Monthly Maintenance',
      type: 'monthly',
      label: mp.name,
      sublabel: mp.tagline,
      price: mp.price,
      recurring: true,
      serviceType: 'monthly',
      plan: mp.slug,
    });
  });

  /* Add-ons */
  ADD_ONS.forEach((addon) => {
    options.push({
      id: `addon-${addon.label}`,
      group: 'Add-On Services',
      type: 'addon',
      label: addon.label,
      sublabel: addon.description,
      price: addon.price,
      unit: addon.unit,
      serviceType: 'addon',
      plan: addon.label,
    });
  });

  /* Custom / freestyle (always last) */
  options.push({
    id: 'custom',
    group: 'Custom',
    type: 'custom',
    label: 'Custom project',
    sublabel: 'Describe your project and get a tailored quote',
    price: null,
    serviceType: null,
    plan: null,
  });

  return options;
};

/* Group labels are ordered for the picker */
const GROUP_ORDER = [
  'Web Development',
  'Branding & Design',
  'App Development',
  'Combo Packages',
  'Monthly Maintenance',
  'Add-On Services',
  'Custom',
];

const SERVICE_OPTIONS = [
  { value: 'web-development', label: 'Web Development' },
  { value: 'app-development', label: 'App Development' },
  { value: 'branding-creative', label: 'Branding' },
];

const RequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { PLAN_CATALOG, COMBO_PACKAGES, MONTHLY_PLANS, ADD_ONS, CATEGORY_ORDER } = useCatalog();

  const ALL_OPTIONS = useMemo(
    () => buildOptions(CATEGORY_ORDER, PLAN_CATALOG, COMBO_PACKAGES, MONTHLY_PLANS, ADD_ONS),
    [CATEGORY_ORDER, PLAN_CATALOG, COMBO_PACKAGES, MONTHLY_PLANS, ADD_ONS]
  );

  /* Pre-select from URL: ?service=web-development or ?plan=combo-restaurant-starter */
  const urlService = searchParams.get('service') || '';
  const urlPlan = searchParams.get('plan') || '';

  const defaultSelection = useMemo(() => {
    if (urlPlan) {
      const found = ALL_OPTIONS.find((o) => o.id === urlPlan || o.plan === urlPlan);
      if (found) return found.id;
    }
    if (urlService) {
      const found = ALL_OPTIONS.find((o) => o.type === 'plan' && o.serviceType === urlService);
      if (found) return found.id;
    }
    return '';
  }, [urlService, urlPlan, ALL_OPTIONS]);

  const [selectedId, setSelectedId] = useState(defaultSelection);
  const [loading, setLoading] = useState(false);

  const selectedOption = useMemo(
    () => ALL_OPTIONS.find((o) => o.id === selectedId) || null,
    [selectedId, ALL_OPTIONS]
  );

  const isCustom = selectedId === 'custom';

  const [formData, setFormData] = useState({
    serviceType: urlService || 'web-development',
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    businessName: '',
    projectDescription: '',
    requiredFeatures: '',
    deadline: '',
    budgetRange: '',
    expectedPrice: '',
  });
  const [file, setFile] = useState(null);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSelectPlan = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? '' : id));
  }, []);

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    /* If a fixed-price plan/combo/monthly is selected, route to its checkout page */
    if (selectedOption && selectedOption.type !== 'custom') {
      const { type, serviceType, plan } = selectedOption;

      if (type === 'plan') {
        navigate(`/checkout?service=${serviceType}&plan=${plan}`);
        return;
      }
      if (type === 'combo') {
        navigate(`/checkout/combo/${plan}`);
        return;
      }
      if (type === 'monthly') {
        navigate(`/checkout/monthly/${plan}`);
        return;
      }
      if (type === 'addon') {
        navigate(`/checkout/addons?selected=${encodeURIComponent(plan)}`);
        return;
      }
    }

    /* Custom / freestyle → submit via API */
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const normalized = typeof value === 'string' ? value.trim() : value;
        if (normalized === '') return;
        payload.append(key, normalized);
      });
      if (file) payload.append('file', file);

      await api.post('/custom-requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Request submitted');
      navigate('/request/thanks');
    } catch (error) {
      const msg = error.response?.data?.errors?.[0]?.message;
      toast.error(msg || error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Grouped options for the picker ─── */
  const grouped = useMemo(() => {
    const map = {};
    ALL_OPTIONS.forEach((o) => {
      if (!map[o.group]) map[o.group] = [];
      map[o.group].push(o);
    });
    return GROUP_ORDER.filter((g) => map[g]).map((g) => ({ group: g, items: map[g] }));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-3"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 mr-1" /> Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Request</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pick a plan below or describe a custom project.
          </p>
        </div>
      </div>

      {/* ─── Plan Picker ─── */}
      <div className="card dark:bg-surface-800 dark:border-surface-700">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Choose a plan or service
        </h2>

        <div className="space-y-6">
          {grouped.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {group}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {items.map((opt) => {
                  const active = selectedId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectPlan(opt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                        active
                          ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 ring-1 ring-sky-200 dark:ring-sky-500/20'
                          : 'bg-gray-50 dark:bg-surface-700 border-gray-100 dark:border-surface-600 hover:border-gray-200 dark:hover:border-surface-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                            active ? 'bg-sky-500 text-white' : 'bg-gray-200 dark:bg-surface-600'
                          }`}
                        >
                          {active && <CheckIcon className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-medium ${
                                active
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {opt.label}
                            </span>
                            {opt.type === 'combo' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <TagIcon className="w-3 h-3" /> {opt.discount}% off
                              </span>
                            )}
                            {opt.recurring && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                                <CalendarDaysIcon className="w-3 h-3" /> Monthly
                              </span>
                            )}
                            {opt.type === 'custom' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <SparklesIcon className="w-3 h-3" /> Flexible
                              </span>
                            )}
                          </div>
                          {opt.sublabel && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                              {opt.sublabel}
                            </p>
                          )}
                        </div>
                        {opt.price != null && (
                          <div className="text-right flex-shrink-0 ml-2">
                            {opt.originalPrice && (
                              <span className="block text-[10px] text-gray-400 line-through">
                                {formatINR(opt.originalPrice)}
                              </span>
                            )}
                            <span
                              className={`text-sm font-bold ${
                                active
                                  ? 'text-sky-600 dark:text-sky-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {formatINR(opt.price)}
                            </span>
                            {opt.recurring && (
                              <span className="block text-[10px] text-gray-400">/mo</span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected summary */}
        {selectedOption && selectedOption.type !== 'custom' && (
          <div className="mt-5 p-4 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedOption.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedOption.delivery ? `Delivery: ${selectedOption.delivery}` : ''}
                  {selectedOption.recurring ? 'Billed monthly · Cancel anytime' : ''}
                </p>
              </div>
              <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">
                {formatINR(selectedOption.price)}
                {selectedOption.recurring ? '/mo' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Action for fixed plans: go to checkout ─── */}
      {selectedOption && selectedOption.type !== 'custom' && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="btn-primary inline-flex items-center gap-2 !py-3 !px-8"
          >
            Continue to Checkout <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* ─── Custom project form ─── */}
      {isCustom && (
        <form
          onSubmit={handleSubmit}
          className="card dark:bg-surface-800 dark:border-surface-700 space-y-5"
        >
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Tell us about your project
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-3">
            Fill in the details below and our team will send you a tailored proposal within 24
            hours.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service type
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="input-field"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full name
              </label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Business name
            </label>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project description
            </label>
            <textarea
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleChange}
              className="input-field min-h-[120px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Required features
            </label>
            <textarea
              name="requiredFeatures"
              value={formData.requiredFeatures}
              onChange={handleChange}
              className="input-field min-h-[100px]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deadline
              </label>
              <input
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget range
              </label>
              <input
                name="budgetRange"
                value={formData.budgetRange}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. ₹50,000 – ₹1,00,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your expected price (INR)
            </label>
            <input
              name="expectedPrice"
              type="number"
              min="0"
              step="1"
              value={formData.expectedPrice}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. 75000"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              This is your offer. Admin will review and approve a final payable amount.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Optional file upload
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-500/10 file:text-primary-600 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-500/20"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary !py-2.5 !px-6 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RequestForm;
