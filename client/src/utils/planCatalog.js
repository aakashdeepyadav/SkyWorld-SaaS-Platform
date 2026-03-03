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
        highlights: ['Unlimited revisions', 'Chat support'],
        support: '7-day post-launch support',
        features: [
          'Single-page website',
          'Phone & WhatsApp CTA',
          'Google Maps integration',
          'Opening hours display',
          'Photo gallery',
          'Basic SEO tags',
          'Mobile responsive',
          'Unlimited revisions until satisfied',
          'Live chat support during project',
          'Source code handover',
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
        highlights: ['Unlimited revisions', 'Chat support', 'Free domain help'],
        support: '14-day post-launch support',
        features: [
          '4–5 page website',
          'Inquiry / contact form',
          'WhatsApp integration',
          'Google Maps embed',
          'Service or menu listing',
          'Mobile optimized layout',
          'Basic SEO setup',
          'Unlimited revisions until satisfied',
          'Live chat support during project',
          'Domain & hosting setup assistance',
          'Social media link integration',
          'Source code handover',
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
        highlights: ['Unlimited revisions', 'Priority chat support', '1 month free support'],
        support: '30-day post-launch support',
        features: [
          '6–8 page website',
          'Lead form with Google Sheets',
          'Basic analytics setup',
          'WhatsApp & social links',
          'Service / product showcase',
          'Performance optimization',
          'Unlimited revisions until satisfied',
          'Priority live chat support',
          '1 month free maintenance support',
          'Speed & Core Web Vitals optimization',
          'Domain & hosting setup assistance',
          'Source code handover',
          'Training walkthrough call',
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
        highlights: ['Unlimited revisions', 'Chat support'],
        support: '7-day post-delivery support',
        features: [
          '1 logo concept',
          'Unlimited revision rounds until satisfied',
          'Color palette selection',
          'Basic social media kit',
          'PNG + SVG file delivery',
          'Live chat support during project',
          'Favicon & watermark versions',
          'Print-ready files',
        ],
        excludes: [
          'Multiple logo directions',
          'Brand strategy session',
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
        highlights: ['Unlimited revisions', 'Priority chat support', 'Brand guide'],
        support: '14-day post-delivery support',
        features: [
          '2 logo directions',
          'Unlimited revision rounds until satisfied',
          'Business card design',
          'Poster / flyer template',
          'Mini brand guide (colors, fonts, usage)',
          'All file formats included',
          'Priority live chat support',
          'Social media profile & cover designs',
          'Letterhead & invoice template',
          'Brand asset handover kit',
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
        highlights: ['Unlimited revisions', 'Chat support', 'Cross-platform'],
        support: '14-day post-launch support',
        features: [
          'Progressive Web App',
          'Product / service catalog',
          'Inquiry & booking flow',
          'Admin-lite edit panel',
          'Works on all devices',
          'No app store needed',
          'Unlimited revisions until satisfied',
          'Live chat support during project',
          'Push notification ready',
          'Offline mode support',
          'Source code handover',
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
        highlights: ['Unlimited revisions', 'Priority chat support', 'Dedicated PM'],
        support: '30-day post-launch support',
        features: [
          'User authentication',
          'Admin panel & dashboard',
          'Customer forms & data',
          'Reports & CSV export',
          'Deployment support',
          'Push notifications setup',
          'Unlimited revisions until satisfied',
          'Priority live chat support',
          'Dedicated project manager',
          'API documentation',
          'Database backup setup',
          'Training walkthrough call',
          'Source code handover',
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
    highlights: ['Chat support'],
    tagline: 'Essential upkeep for your website',
    bestFor: 'Small businesses that need basic maintenance and peace of mind',
    responseTime: 'Within 48 hours',
    updates: '2 minor updates/month',
    features: [
      'Minor text & image updates',
      'Uptime monitoring',
      'Monthly backup',
      'Chat support for quick queries',
      'Monthly health report',
    ],
    notIncluded: [
      'Design changes or new pages',
      'Analytics or performance reports',
      'Promotional creatives',
      'SEO optimization',
    ],
  },
  {
    slug: 'growth',
    name: 'Growth Plan',
    price: 3499,
    popular: true,
    highlights: ['Priority chat support', 'Analytics'],
    tagline: 'Stay ahead with regular updates and insights',
    bestFor: 'Growing businesses that want consistent improvements and Marketing support',
    responseTime: 'Within 24 hours',
    updates: 'Up to 4 updates/month',
    features: [
      'Everything in Lite',
      'Up to 4 updates/month',
      'Basic analytics report',
      '1 promotional creative/month',
      'Priority chat support',
      'Performance monitoring',
    ],
    notIncluded: [
      'Full redesign or rebuild',
      'Dedicated support channel',
      'SEO review & optimization',
      'Competitor analysis',
    ],
  },
  {
    slug: 'growth-plus',
    name: 'Local Growth Plus',
    price: 6999,
    highlights: ['Dedicated support', 'SEO boost'],
    tagline: 'Your complete digital growth partner',
    bestFor: 'Established businesses serious about local visibility and lead generation',
    responseTime: 'Within 12 hours',
    updates: 'Up to 8 updates/month',
    features: [
      'Everything in Growth',
      'Up to 8 updates/month',
      'Lead handling optimization',
      '2 creatives/month',
      'Dedicated chat support channel',
      'Monthly SEO review',
      'Competitor analysis snapshot',
    ],
    notIncluded: [
      'Full website rebuild',
      'Paid ad management',
      'Social media account management',
    ],
  },
];

/** Find a monthly plan by slug */
export const findMonthlyPlan = (planSlug) =>
  MONTHLY_PLANS.find((p) => p.slug === planSlug) || null;

/* ═══════════════════════════════════════════════════════════════════
   ADD-ONS — upsell items
   ═══════════════════════════════════════════════════════════════════ */

export const ADD_ONS = [
  { label: 'Google Business Profile setup', price: 1500, description: 'Get listed on Google Maps and Search with a fully optimized profile.' },
  { label: 'Extra page', price: 800, unit: '/page', description: 'Add more pages to any website plan — services, gallery, team, etc.' },
  { label: 'Extra revision round', price: 500, description: 'Additional round of revisions beyond the unlimited scope.' },
  { label: 'Product upload support', price: 1500, description: 'We upload and organize your product catalog with images and details.' },
  { label: 'Basic local SEO setup', price: 2000, description: 'On-page SEO optimization, meta tags, sitemap & Google indexing.' },
  { label: 'Priority 48-hour updates', price: 1200, unit: '/month', description: 'Get guaranteed updates within 48 hours for time-sensitive changes.' },
  { label: 'Chatbot integration', price: 2500, description: 'Automated chatbot on your website to handle FAQs and capture leads 24/7.' },
  { label: 'WhatsApp Business API setup', price: 1800, description: 'Connect your WhatsApp Business for automated replies and notifications.' },
  { label: 'Social media starter kit', price: 1500, description: '5 branded post templates + 3 story templates for your social channels.' },
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
