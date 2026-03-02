/**
 * SkyWorld Plan Catalog
 * ─────────────────────
 * Single source of truth for all service plans, combos, and monthly plans.
 * Mirrors the pricing in docs/BUSINESS_PRICING_PLAYBOOK.md
 * Backend validates prices independently via PLAN_PRICES in server/utils/constants.js
 */

/* ═══════════════════════════════════════════════════════════════════
   SERVICE PLANS — grouped by category
   ═══════════════════════════════════════════════════════════════════ */

export const PLAN_CATALOG = {
  'web-development': {
    name: 'Web Development',
    tagline: 'Professional websites that bring customers to your door.',
    icon: 'web',
    color: '139,92,246',
    gradient: 'from-violet-500 to-purple-600',
    gradientCSS: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    lightBg: 'bg-violet-50 dark:bg-violet-500/10',
    accentText: 'text-violet-600 dark:text-violet-400',
    plans: [
      {
        slug: 'launch',
        name: 'Launch Page',
        price: 3999,
        delivery: '2–3 days',
        bestFor: 'Very small shops starting online',
        popular: false,
        features: [
          'Single-page website',
          'Phone & WhatsApp CTA',
          'Google Maps integration',
          'Opening hours display',
          'Photo gallery',
          'Basic SEO tags',
          'Mobile responsive',
        ],
        excludes: [
          'Multi-page navigation',
          'Contact / inquiry forms',
          'Analytics dashboard',
          'Custom design work',
        ],
      },
      {
        slug: 'starter',
        name: 'Starter Website',
        price: 7499,
        delivery: '4–6 days',
        bestFor: 'Shops & restaurants wanting credibility + leads',
        popular: true,
        features: [
          '4–5 page website',
          'Inquiry / contact form',
          'WhatsApp integration',
          'Google Maps embed',
          'Service or menu listing',
          'Mobile optimized layout',
          'Basic SEO setup',
        ],
        excludes: [
          'Custom animations',
          'Advanced integrations',
          'E-commerce features',
        ],
      },
      {
        slug: 'growth',
        name: 'Growth Website',
        price: 11999,
        delivery: '6–9 days',
        bestFor: 'Businesses wanting lead capture + better branding',
        popular: false,
        features: [
          '6–8 page website',
          'Lead form with Google Sheets',
          'Basic analytics setup',
          'WhatsApp & social links',
          'Service / product showcase',
          'Performance optimization',
          '1 month free support',
        ],
        excludes: [
          'E-commerce / payments',
          'Complex backend workflows',
          'Custom admin panel',
        ],
      },
    ],
  },

  'branding-creative': {
    name: 'Branding & Design',
    tagline: 'Stand out with a professional identity your customers remember.',
    icon: 'brand',
    color: '245,158,11',
    gradient: 'from-amber-500 to-orange-600',
    gradientCSS: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    lightBg: 'bg-amber-50 dark:bg-amber-500/10',
    accentText: 'text-amber-600 dark:text-amber-400',
    plans: [
      {
        slug: 'starter',
        name: 'Starter Branding Kit',
        price: 2499,
        delivery: '2–4 days',
        bestFor: 'New businesses needing a quick professional look',
        popular: false,
        features: [
          '1 logo concept',
          '2 revision rounds',
          'Color palette selection',
          'Basic social media kit',
          'PNG + SVG file delivery',
        ],
        excludes: [
          'Multiple logo directions',
          'Brand strategy session',
          'Print-ready templates',
          'Extended collateral design',
        ],
      },
      {
        slug: 'plus',
        name: 'Branding Plus',
        price: 4999,
        delivery: '4–7 days',
        bestFor: 'Growing businesses building brand identity',
        popular: true,
        features: [
          '2 logo directions',
          '4 revision rounds',
          'Business card design',
          'Poster / flyer template',
          'Mini brand guide',
          'All file formats included',
        ],
        excludes: [
          'Full brand strategy workshop',
          'Packaging design',
          'Photography / video production',
        ],
      },
    ],
  },

  'app-development': {
    name: 'App Development',
    tagline: 'Take your business mobile with apps customers love to use.',
    icon: 'app',
    color: '14,165,233',
    gradient: 'from-sky-500 to-blue-600',
    gradientCSS: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    lightBg: 'bg-sky-50 dark:bg-sky-500/10',
    accentText: 'text-sky-600 dark:text-sky-400',
    plans: [
      {
        slug: 'mini',
        name: 'Mini App / PWA',
        price: 18999,
        delivery: '10–14 days',
        bestFor: 'Catalog, service booking, or simple business app',
        popular: true,
        features: [
          'Progressive Web App',
          'Product / service catalog',
          'Inquiry & booking flow',
          'Admin-lite edit panel',
          'Works on all devices',
          'No app store needed',
        ],
        excludes: [
          'Complex backend systems',
          'Multi-role dashboards',
          'Real-time features',
          'App store publishing',
        ],
      },
      {
        slug: 'lite',
        name: 'App Lite + Dashboard',
        price: 34999,
        delivery: '3–5 weeks',
        bestFor: 'Businesses needing login, admin, and reports',
        popular: false,
        features: [
          'User authentication',
          'Admin panel & dashboard',
          'Customer forms & data',
          'Reports & CSV export',
          'Deployment support',
          'Push notifications setup',
        ],
        excludes: [
          'App store publishing fees',
          'Ongoing maintenance plan',
          'Third-party licensing fees',
        ],
      },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════
   COMBO PACKAGES — bundled deals (flow through custom request)
   ═══════════════════════════════════════════════════════════════════ */

export const COMBO_PACKAGES = [
  {
    slug: 'restaurant-starter',
    name: 'Restaurant Starter',
    tagline: 'Everything a restaurant needs to get online',
    originalPrice: 11498,
    price: 10099,
    discount: 12,
    includes: [
      { category: 'web-development', plan: 'starter', label: 'Starter Website' },
      { category: 'branding-creative', plan: 'starter', label: 'Starter Branding Kit' },
      { addOn: true, label: 'Google Business Profile setup' },
    ],
    delivery: '7–10 days',
    bestFor: 'Restaurants, cafés, food businesses',
    color: '245,158,11',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    slug: 'medical-growth',
    name: 'Medical Growth',
    tagline: 'Credibility & reach for clinics and medical shops',
    originalPrice: 20598,
    price: 17508,
    discount: 15,
    includes: [
      { category: 'web-development', plan: 'growth', label: 'Growth Website' },
      { category: 'branding-creative', plan: 'plus', label: 'Branding Plus' },
      { addOn: true, label: '2 extra website pages' },
      { addOn: true, label: 'Basic local SEO setup' },
    ],
    delivery: '10–14 days',
    bestFor: 'Medical shops, clinics, pharmacies',
    color: '16,185,129',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    slug: 'premium-business',
    name: 'Premium Business',
    tagline: 'Complete digital package with web, brand & app',
    originalPrice: 40494,
    price: 33205,
    discount: 18,
    includes: [
      { category: 'web-development', plan: 'growth', label: 'Growth Website' },
      { category: 'branding-creative', plan: 'plus', label: 'Branding Plus' },
      { category: 'app-development', plan: 'mini', label: 'Mini App / PWA' },
      { addOn: true, label: '3 months Care Plan Lite' },
    ],
    delivery: '3–4 weeks',
    bestFor: 'Service businesses going all-in on digital',
    color: '139,92,246',
    gradient: 'from-violet-500 to-purple-600',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   MONTHLY PLANS — recurring maintenance
   ═══════════════════════════════════════════════════════════════════ */

export const MONTHLY_PLANS = [
  {
    slug: 'care-lite',
    name: 'Care Plan Lite',
    price: 1499,
    features: [
      'Minor text & image updates',
      'Uptime monitoring',
      'Monthly backup',
    ],
  },
  {
    slug: 'growth',
    name: 'Growth Plan',
    price: 3499,
    popular: true,
    features: [
      'Everything in Lite',
      'Up to 4 updates/month',
      'Basic analytics report',
      '1 promotional creative/month',
    ],
  },
  {
    slug: 'growth-plus',
    name: 'Local Growth Plus',
    price: 6999,
    features: [
      'Everything in Growth',
      'Up to 8 updates/month',
      'Lead handling optimization',
      '2 creatives/month',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   ADD-ONS — upsell items
   ═══════════════════════════════════════════════════════════════════ */

export const ADD_ONS = [
  { label: 'Google Business Profile setup', price: 1500 },
  { label: 'Extra page', price: 800, unit: '/page' },
  { label: 'Extra revision round', price: 500 },
  { label: 'Product upload support', price: 1500 },
  { label: 'Basic local SEO setup', price: 2000 },
  { label: 'Priority 48-hour updates', price: 1200, unit: '/month' },
];

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

/** Find a specific plan by category slug + plan slug */
export const findPlan = (category, planSlug) => {
  const service = PLAN_CATALOG[category];
  if (!service) return null;
  return service.plans.find((p) => p.slug === planSlug) || null;
};

/** Find a combo by slug */
export const findCombo = (comboSlug) =>
  COMBO_PACKAGES.find((c) => c.slug === comboSlug) || null;

/** Get all plan slugs for a category */
export const getPlanSlugs = (category) => {
  const service = PLAN_CATALOG[category];
  if (!service) return [];
  return service.plans.map((p) => p.slug);
};

/** Order in which categories appear on the home page */
export const CATEGORY_ORDER = ['web-development', 'branding-creative', 'app-development'];
