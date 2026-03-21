import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PLAN_CATALOG, COMBO_PACKAGES, MONTHLY_PLANS } from '../src/utils/planCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const siteUrl = (process.env.VITE_WEBSITE_URL?.trim() || 'https://skyworld.buzz').replace(/\/+$/, '');
const lastModified = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  '/',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
  '/addons',
  '/plans/monthly',
];

const serviceRoutes = Object.entries(PLAN_CATALOG).flatMap(([slug, category]) => [
  `/services/${slug}`,
  ...category.plans.map((plan) => `/services/${slug}/${plan.slug}`),
]);

const comboRoutes = COMBO_PACKAGES.map((combo) => `/combos/${combo.slug}`);
const monthlyRoutes = MONTHLY_PLANS.map((plan) => `/plans/monthly/${plan.slug}`);

const allRoutes = Array.from(
  new Set([...staticRoutes, ...serviceRoutes, ...comboRoutes, ...monthlyRoutes])
);

const getPriority = (route) => {
  if (route === '/') return '1.0';
  if (route.startsWith('/services/') && route.split('/').length === 3) return '0.9';
  if (route.startsWith('/services/') || route.startsWith('/combos/')) return '0.8';
  if (route.startsWith('/plans/monthly')) return '0.8';
  if (route === '/addons') return '0.7';
  if (route === '/faq' || route === '/contact') return '0.6';
  return '0.4';
};

const getChangeFrequency = (route) => {
  if (route === '/') return 'weekly';
  if (route.startsWith('/services/') || route.startsWith('/combos/')) return 'weekly';
  if (route.startsWith('/plans/monthly') || route === '/addons') return 'monthly';
  return 'yearly';
};

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${getChangeFrequency(route)}</changefreq>
    <priority>${getPriority(route)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /profile
Disallow: /settings
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /auth/
Disallow: /checkout
Disallow: /payments
Disallow: /projects
Disallow: /requests
Disallow: /custom-requests
Disallow: /book-meeting
Disallow: /onboarding/

Sitemap: ${siteUrl}/sitemap.xml
`;

await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
await fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

console.log(`Generated SEO assets for ${allRoutes.length} public routes.`);
