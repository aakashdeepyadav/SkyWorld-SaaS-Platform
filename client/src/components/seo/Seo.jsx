import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_NAME = 'SkyWorld Ventures';
export const SITE_URL = (import.meta.env.VITE_WEBSITE_URL?.trim() || 'https://skyworld.buzz').replace(
  /\/+$/,
  ''
);
export const DEFAULT_TITLE = `${SITE_NAME} | Web Development, Branding & App Services`;
export const DEFAULT_DESCRIPTION =
  'SkyWorld Ventures builds websites, branding systems, app experiences, combo packages, and monthly maintenance plans for growing businesses.';
export const DEFAULT_IMAGE_PATH = '/wordmark_logo_coloured_fullname.png';
export const DEFAULT_KEYWORDS = [
  'SkyWorld Ventures',
  'web development',
  'website design',
  'branding services',
  'app development',
  'business website packages',
  'monthly website maintenance',
  'digital services India',
];

const STRUCTURED_DATA_ATTR = 'data-skyworld-seo-script';

const upsertMetaTag = (attribute, key, content) => {
  if (!content) return;

  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
};

const upsertLinkTag = (rel, href) => {
  if (!href) return;

  let tag = document.head.querySelector(`link[rel="${rel}"]`);

  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }

  tag.setAttribute('href', href);
};

const clearStructuredData = () => {
  document.head.querySelectorAll(`script[${STRUCTURED_DATA_ATTR}]`).forEach((tag) => tag.remove());
};

const setStructuredData = (structuredData) => {
  clearStructuredData();

  const payloads = Array.isArray(structuredData)
    ? structuredData.filter(Boolean)
    : structuredData
      ? [structuredData]
      : [];

  payloads.forEach((payload, index) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(STRUCTURED_DATA_ATTR, String(index));
    script.text = JSON.stringify(payload);
    document.head.appendChild(script);
  });
};

const normalizeKeywords = (keywords) =>
  Array.from(new Set([...DEFAULT_KEYWORDS, ...(keywords || [])].filter(Boolean)));

export const absoluteUrl = (path = '/') => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};

export const buildOffer = ({ path, price, priceCurrency = 'INR' }) => ({
  '@type': 'Offer',
  priceCurrency,
  price: String(price),
  availability: 'https://schema.org/InStock',
  url: absoluteUrl(path),
});

export const buildAggregateOffer = ({
  path,
  lowPrice,
  highPrice,
  offerCount,
  priceCurrency = 'INR',
}) => ({
  '@type': 'AggregateOffer',
  priceCurrency,
  lowPrice: String(lowPrice),
  highPrice: String(highPrice),
  offerCount,
  url: absoluteUrl(path),
});

export const buildOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/logo.png'),
  email: 'support@skyworld.buzz',
});

export const buildWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
});

export const buildBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const buildServiceSchema = ({
  name,
  description,
  path,
  serviceType,
  offers,
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  description,
  serviceType,
  url: absoluteUrl(path),
  provider: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
  areaServed: 'Worldwide',
  offers,
});

export const buildFaqSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
});

export const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path,
  canonicalPath,
  image = DEFAULT_IMAGE_PATH,
  type = 'website',
  noIndex = false,
  keywords = [],
  structuredData,
}) => {
  const location = useLocation();
  const resolvedPath = useMemo(
    () => canonicalPath || path || location.pathname,
    [canonicalPath, location.pathname, path]
  );
  const canonicalUrl = useMemo(() => absoluteUrl(resolvedPath), [resolvedPath]);
  const imageUrl = useMemo(() => absoluteUrl(image), [image]);
  const keywordsContent = useMemo(() => normalizeKeywords(keywords).join(', '), [keywords]);
  const robots = noIndex ? 'noindex,nofollow' : 'index,follow';

  useEffect(() => {
    document.title = title;

    upsertMetaTag('name', 'description', description);
    upsertMetaTag('name', 'keywords', keywordsContent);
    upsertMetaTag('name', 'robots', robots);

    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('property', 'og:type', type);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', imageUrl);

    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', title);
    upsertMetaTag('name', 'twitter:description', description);
    upsertMetaTag('name', 'twitter:image', imageUrl);

    upsertLinkTag('canonical', canonicalUrl);
    setStructuredData(structuredData);

    return () => {
      clearStructuredData();
    };
  }, [canonicalUrl, description, imageUrl, keywordsContent, robots, structuredData, title, type]);

  return null;
};

const INDEXABLE_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/website$/,
  /^\/faq$/,
  /^\/contact$/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/addons$/,
  /^\/plans\/monthly$/,
  /^\/plans\/monthly\/[^/]+$/,
  /^\/services\/[^/]+$/,
  /^\/services\/[^/]+\/[^/]+$/,
  /^\/combos\/[^/]+$/,
];

export const RouteSeoDefaults = () => {
  const location = useLocation();
  const staticPublicMeta = {
    '/privacy': {
      title: 'Privacy Policy | SkyWorld Ventures',
      description:
        'Read the SkyWorld Ventures privacy policy covering account data, payments, Google OAuth, cookies, and platform security.',
    },
    '/terms': {
      title: 'Terms of Service | SkyWorld Ventures',
      description:
        'Review SkyWorld Ventures terms of service for pricing, payments, revisions, user responsibilities, account rules, and delivery terms.',
    },
  };
  const staticMeta = staticPublicMeta[location.pathname];
  const isIndexableRoute = INDEXABLE_ROUTE_PATTERNS.some((pattern) => pattern.test(location.pathname));

  if (staticMeta) {
    return <Seo path={location.pathname} title={staticMeta.title} description={staticMeta.description} />;
  }

  if (isIndexableRoute) {
    return null;
  }

  return <Seo path={location.pathname} noIndex title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} />;
};
