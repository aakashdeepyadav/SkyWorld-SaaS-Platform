import Service from '../models/Service.js';
import { createAuditLog } from '../middleware/auth.js';
import { CATEGORY_META, CATEGORY_ORDER } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/* ═══════════════════════════════════════════════════════════════════
   SEED DATA — mirrors planCatalog.js  (22 items)
   ═══════════════════════════════════════════════════════════════════ */

const SEED_SERVICES = [
  /* ── Web Development plans ─────────────────────── */
  {
    type: 'plan', category: 'web-development', slug: 'launch', sortOrder: 1,
    name: 'Launch Page', basePrice: 3999, delivery: '2–3 days',
    bestFor: 'Very small shops starting online', popular: false,
    highlights: ['Unlimited revisions', 'Chat support'],
    support: '7-day post-launch support',
    features: [
      'Single-page website', 'Phone & WhatsApp CTA', 'Google Maps integration',
      'Opening hours display', 'Photo gallery', 'Basic SEO tags',
      'Mobile responsive', 'Unlimited revisions until satisfied',
      'Live chat support during project', 'Source code handover',
    ],
    excludes: ['Multi-page navigation', 'Contact / inquiry forms', 'Analytics dashboard', 'Custom design work'],
  },
  {
    type: 'plan', category: 'web-development', slug: 'starter', sortOrder: 2,
    name: 'Starter Website', basePrice: 7499, delivery: '4–6 days',
    bestFor: 'Shops & restaurants wanting credibility + leads', popular: true,
    highlights: ['Unlimited revisions', 'Chat support', 'Free domain help'],
    support: '14-day post-launch support',
    features: [
      '4–5 page website', 'Inquiry / contact form', 'WhatsApp integration',
      'Google Maps embed', 'Service or menu listing', 'Mobile optimized layout',
      'Basic SEO setup', 'Unlimited revisions until satisfied',
      'Live chat support during project', 'Domain & hosting setup assistance',
      'Social media link integration', 'Source code handover',
    ],
    excludes: ['Custom animations', 'Advanced integrations', 'E-commerce features'],
  },
  {
    type: 'plan', category: 'web-development', slug: 'growth', sortOrder: 3,
    name: 'Growth Website', basePrice: 11999, delivery: '6–9 days',
    bestFor: 'Businesses wanting lead capture + better branding', popular: false,
    highlights: ['Unlimited revisions', 'Priority chat support', '1 month free support'],
    support: '30-day post-launch support',
    features: [
      '6–8 page website', 'Lead form with Google Sheets', 'Basic analytics setup',
      'WhatsApp & social links', 'Service / product showcase', 'Performance optimization',
      'Unlimited revisions until satisfied', 'Priority live chat support',
      '1 month free maintenance support', 'Speed & Core Web Vitals optimization',
      'Domain & hosting setup assistance', 'Source code handover', 'Training walkthrough call',
    ],
    excludes: ['E-commerce / payments', 'Complex backend workflows', 'Custom admin panel'],
  },

  /* ── Branding & Design plans ───────────────────── */
  {
    type: 'plan', category: 'branding-creative', slug: 'starter', sortOrder: 1,
    name: 'Starter Branding Kit', basePrice: 2499, delivery: '2–4 days',
    bestFor: 'New businesses needing a quick professional look', popular: false,
    highlights: ['Unlimited revisions', 'Chat support'],
    support: '7-day post-delivery support',
    features: [
      '1 logo concept', 'Unlimited revision rounds until satisfied', 'Color palette selection',
      'Basic social media kit', 'PNG + SVG file delivery', 'Live chat support during project',
      'Favicon & watermark versions', 'Print-ready files',
    ],
    excludes: ['Multiple logo directions', 'Brand strategy session', 'Extended collateral design'],
  },
  {
    type: 'plan', category: 'branding-creative', slug: 'plus', sortOrder: 2,
    name: 'Branding Plus', basePrice: 4999, delivery: '4–7 days',
    bestFor: 'Growing businesses building brand identity', popular: true,
    highlights: ['Unlimited revisions', 'Priority chat support', 'Brand guide'],
    support: '14-day post-delivery support',
    features: [
      '2 logo directions', 'Unlimited revision rounds until satisfied', 'Business card design',
      'Poster / flyer template', 'Mini brand guide (colors, fonts, usage)',
      'All file formats included', 'Priority live chat support',
      'Social media profile & cover designs', 'Letterhead & invoice template', 'Brand asset handover kit',
    ],
    excludes: ['Full brand strategy workshop', 'Packaging design', 'Photography / video production'],
  },

  /* ── App Development plans ─────────────────────── */
  {
    type: 'plan', category: 'app-development', slug: 'mini', sortOrder: 1,
    name: 'Mini App / PWA', basePrice: 18999, delivery: '10–14 days',
    bestFor: 'Catalog, service booking, or simple business app', popular: true,
    highlights: ['Unlimited revisions', 'Chat support', 'Cross-platform'],
    support: '14-day post-launch support',
    features: [
      'Progressive Web App', 'Product / service catalog', 'Inquiry & booking flow',
      'Admin-lite edit panel', 'Works on all devices', 'No app store needed',
      'Unlimited revisions until satisfied', 'Live chat support during project',
      'Push notification ready', 'Offline mode support', 'Source code handover',
    ],
    excludes: ['Complex backend systems', 'Multi-role dashboards', 'Real-time features', 'App store publishing'],
  },
  {
    type: 'plan', category: 'app-development', slug: 'lite', sortOrder: 2,
    name: 'App Lite + Dashboard', basePrice: 34999, delivery: '3–5 weeks',
    bestFor: 'Businesses needing login, admin, and reports', popular: false,
    highlights: ['Unlimited revisions', 'Priority chat support', 'Dedicated PM'],
    support: '30-day post-launch support',
    features: [
      'User authentication', 'Admin panel & dashboard', 'Customer forms & data',
      'Reports & CSV export', 'Deployment support', 'Push notifications setup',
      'Unlimited revisions until satisfied', 'Priority live chat support',
      'Dedicated project manager', 'API documentation', 'Database backup setup',
      'Training walkthrough call', 'Source code handover',
    ],
    excludes: ['App store publishing fees', 'Ongoing maintenance plan', 'Third-party licensing fees'],
  },

  /* ── Combo packages ────────────────────────────── */
  {
    type: 'combo', category: null, slug: 'restaurant-starter', sortOrder: 1,
    name: 'Restaurant Starter',
    tagline: 'Everything a restaurant needs to get online',
    originalPrice: 11498, basePrice: 10099, discount: 12,
    includes: [
      { category: 'web-development', plan: 'starter', label: 'Starter Website' },
      { category: 'branding-creative', plan: 'starter', label: 'Starter Branding Kit' },
      { addOn: true, label: 'Google Business Profile setup' },
    ],
    delivery: '7–10 days', bestFor: 'Restaurants, cafés, food businesses',
    color: '245,158,11', gradient: 'from-amber-500 to-orange-500',
  },
  {
    type: 'combo', category: null, slug: 'medical-growth', sortOrder: 2,
    name: 'Medical Growth',
    tagline: 'Credibility & reach for clinics and medical shops',
    originalPrice: 20598, basePrice: 17508, discount: 15,
    includes: [
      { category: 'web-development', plan: 'growth', label: 'Growth Website' },
      { category: 'branding-creative', plan: 'plus', label: 'Branding Plus' },
      { addOn: true, label: '2 extra website pages' },
      { addOn: true, label: 'Basic local SEO setup' },
    ],
    delivery: '10–14 days', bestFor: 'Medical shops, clinics, pharmacies',
    color: '16,185,129', gradient: 'from-emerald-500 to-teal-600',
  },
  {
    type: 'combo', category: null, slug: 'premium-business', sortOrder: 3,
    name: 'Premium Business',
    tagline: 'Complete digital package with web, brand & app',
    originalPrice: 40494, basePrice: 33205, discount: 18,
    includes: [
      { category: 'web-development', plan: 'growth', label: 'Growth Website' },
      { category: 'branding-creative', plan: 'plus', label: 'Branding Plus' },
      { category: 'app-development', plan: 'mini', label: 'Mini App / PWA' },
      { addOn: true, label: '3 months Care Plan Lite' },
    ],
    delivery: '3–4 weeks', bestFor: 'Service businesses going all-in on digital',
    color: '139,92,246', gradient: 'from-violet-500 to-purple-600',
  },

  /* ── Monthly plans ─────────────────────────────── */
  {
    type: 'monthly', category: null, slug: 'care-lite', sortOrder: 1,
    name: 'Care Plan Lite', basePrice: 1499,
    tagline: 'Essential upkeep for your website',
    bestFor: 'Small businesses that need basic maintenance and peace of mind',
    responseTime: 'Within 48 hours', updates: '2 minor updates/month',
    highlights: ['Chat support'],
    features: [
      'Minor text & image updates', 'Uptime monitoring', 'Monthly backup',
      'Chat support for quick queries', 'Monthly health report',
    ],
    notIncluded: [
      'Design changes or new pages', 'Analytics or performance reports',
      'Promotional creatives', 'SEO optimization',
    ],
  },
  {
    type: 'monthly', category: null, slug: 'growth', sortOrder: 2,
    name: 'Growth Plan', basePrice: 3499, popular: true,
    tagline: 'Stay ahead with regular updates and insights',
    bestFor: 'Growing businesses that want consistent improvements and Marketing support',
    responseTime: 'Within 24 hours', updates: 'Up to 4 updates/month',
    highlights: ['Priority chat support', 'Analytics'],
    features: [
      'Everything in Lite', 'Up to 4 updates/month', 'Basic analytics report',
      '1 promotional creative/month', 'Priority chat support', 'Performance monitoring',
    ],
    notIncluded: [
      'Full redesign or rebuild', 'Dedicated support channel',
      'SEO review & optimization', 'Competitor analysis',
    ],
  },
  {
    type: 'monthly', category: null, slug: 'growth-plus', sortOrder: 3,
    name: 'Local Growth Plus', basePrice: 6999,
    tagline: 'Your complete digital growth partner',
    bestFor: 'Established businesses serious about local visibility and lead generation',
    responseTime: 'Within 12 hours', updates: 'Up to 8 updates/month',
    highlights: ['Dedicated support', 'SEO boost'],
    features: [
      'Everything in Growth', 'Up to 8 updates/month', 'Lead handling optimization',
      '2 creatives/month', 'Dedicated chat support channel',
      'Monthly SEO review', 'Competitor analysis snapshot',
    ],
    notIncluded: [
      'Full website rebuild', 'Paid ad management', 'Social media account management',
    ],
  },

  /* ── Add-ons ───────────────────────────────────── */
  { type: 'addon', category: null, slug: 'google-business-profile-setup', sortOrder: 1, name: 'Google Business Profile setup', basePrice: 1500, description: 'Get listed on Google Maps and Search with a fully optimized profile.' },
  { type: 'addon', category: null, slug: 'extra-page', sortOrder: 2, name: 'Extra page', basePrice: 800, unit: '/page', description: 'Add more pages to any website plan — services, gallery, team, etc.' },
  { type: 'addon', category: null, slug: 'extra-revision-round', sortOrder: 3, name: 'Extra revision round', basePrice: 500, description: 'Additional round of revisions beyond the unlimited scope.' },
  { type: 'addon', category: null, slug: 'product-upload-support', sortOrder: 4, name: 'Product upload support', basePrice: 1500, description: 'We upload and organize your product catalog with images and details.' },
  { type: 'addon', category: null, slug: 'basic-local-seo-setup', sortOrder: 5, name: 'Basic local SEO setup', basePrice: 2000, description: 'On-page SEO optimization, meta tags, sitemap & Google indexing.' },
  { type: 'addon', category: null, slug: 'priority-48-hour-updates', sortOrder: 6, name: 'Priority 48-hour updates', basePrice: 1200, unit: '/month', description: 'Get guaranteed updates within 48 hours for time-sensitive changes.' },
  { type: 'addon', category: null, slug: 'chatbot-integration', sortOrder: 7, name: 'Chatbot integration', basePrice: 2500, description: 'Automated chatbot on your website to handle FAQs and capture leads 24/7.' },
  { type: 'addon', category: null, slug: 'whatsapp-business-api-setup', sortOrder: 8, name: 'WhatsApp Business API setup', basePrice: 1800, description: 'Connect your WhatsApp Business for automated replies and notifications.' },
  { type: 'addon', category: null, slug: 'social-media-starter-kit', sortOrder: 9, name: 'Social media starter kit', basePrice: 1500, description: '5 branded post templates + 3 story templates for your social channels.' },
];

/* ═══════════════════════════════════════════════════════════════════
   SEED HELPER — runs once when DB has no typed services
   ═══════════════════════════════════════════════════════════════════ */

const seedCatalog = async () => {
  const count = await Service.countDocuments({ type: { $exists: true, $ne: null } });
  if (count > 0) return; // already seeded

  logger.info('Seeding service catalog into MongoDB…');

  // Drop old-format services that have no `type` field
  await Service.deleteMany({ type: { $exists: false } });

  // Drop outdated unique index on `name` if present
  try { await Service.collection.dropIndex('name_1'); } catch { /* noop */ }

  await Service.insertMany(SEED_SERVICES.map(s => ({ ...s, isActive: true })));
  logger.info(`Seeded ${SEED_SERVICES.length} services into MongoDB.`);
};

/* ═══════════════════════════════════════════════════════════════════
   GET /api/services              — list / filter services
   ═══════════════════════════════════════════════════════════════════ */

export const getServices = async (req, res, next) => {
  try {
    await seedCatalog();

    const { category, type, isActive = 'true' } = req.query;
    const query = {};

    if (isActive === 'all') { /* admin: return everything */ }
    else if (isActive === 'false') query.isActive = false;
    else query.isActive = true;

    if (category) query.category = category;
    if (type) query.type = type;

    const services = await Service.find(query).sort({ type: 1, category: 1, sortOrder: 1, name: 1 });
    res.json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════════════
   GET /api/services/catalog      — grouped catalog for frontend
   ═══════════════════════════════════════════════════════════════════ */

export const getCatalog = async (req, res, next) => {
  try {
    await seedCatalog();

    const allActive = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

    // Helper: ensure every item carries a `price` alias for frontend compat
    const withPrice = (doc) => ({ ...doc, price: doc.basePrice });

    // Group plans by category
    const planCatalog = {};
    for (const cat of CATEGORY_ORDER) {
      const meta = CATEGORY_META[cat];
      const plans = allActive
        .filter(s => s.type === 'plan' && s.category === cat)
        .map(withPrice);
      if (plans.length) planCatalog[cat] = { ...meta, plans };
    }

    const combos = allActive.filter(s => s.type === 'combo').map(withPrice);
    const monthlyPlans = allActive.filter(s => s.type === 'monthly').map(withPrice);
    const addOns = allActive
      .filter(s => s.type === 'addon')
      .map(a => ({ ...a, label: a.name, price: a.basePrice }));

    res.json({
      success: true,
      planCatalog,
      combos,
      monthlyPlans,
      addOns,
      categoryOrder: CATEGORY_ORDER,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════════════
   GET /api/services/:id          — single service by ID
   ═══════════════════════════════════════════════════════════════════ */

export const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════════════
   POST /api/services             — create service (Admin)
   ═══════════════════════════════════════════════════════════════════ */

export const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    await createAuditLog(req, 'service_created', 'service', service._id);
    res.status(201).json({ success: true, message: 'Service created', service });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════════════
   PUT /api/services/:id          — update service (Admin)
   ═══════════════════════════════════════════════════════════════════ */

export const updateService = async (req, res, next) => {
  try {
    const allowed = [
      'name', 'slug', 'type', 'category', 'description', 'tagline',
      'basePrice', 'isActive', 'sortOrder',
      'delivery', 'bestFor', 'popular', 'highlights', 'support',
      'features', 'excludes',
      'originalPrice', 'discount', 'includes', 'color', 'gradient',
      'responseTime', 'updates', 'notIncluded',
      'unit',
    ];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const service = await Service.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    await createAuditLog(req, 'service_updated', 'service', service._id);
    res.json({ success: true, message: 'Service updated', service });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════════════
   DELETE /api/services/:id       — soft-delete (Admin)
   ═══════════════════════════════════════════════════════════════════ */

export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    await createAuditLog(req, 'service_deleted', 'service', service._id);
    res.json({ success: true, message: 'Service deactivated' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════════════
   POST /api/services/reseed      — admin: wipe & re-seed catalog
   ═══════════════════════════════════════════════════════════════════ */

export const reseedCatalog = async (req, res, next) => {
  try {
    await Service.deleteMany({});
    try { await Service.collection.dropIndex('name_1'); } catch { /* noop */ }
    await Service.insertMany(SEED_SERVICES.map(s => ({ ...s, isActive: true })));
    await createAuditLog(req, 'catalog_reseeded', 'service', null);
    res.json({ success: true, message: `Re-seeded ${SEED_SERVICES.length} services.` });
  } catch (error) {
    next(error);
  }
};

