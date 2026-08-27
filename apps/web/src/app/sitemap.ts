import { MetadataRoute } from 'next';
import { liveCalculators } from '@/lib/calculators';
import { SITE_URL, calculatorPath, categoryPath } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Calculators are addressed by SLUG. A previous revision emitted the internal
  // id (/calculators/TAX-001), so every one of the 55 canonical URLs in the
  // sitemap pointed somewhere other than the page users and links actually use.
  const calculators = liveCalculators.map((calc: any) => ({
    url: `${SITE_URL}${calculatorPath(calc.slug)}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category names contain spaces and ampersands, so they must be encoded to
  // be valid URLs inside the sitemap.
  const categories = Array.from(new Set(liveCalculators.map((c: any) => c.category))).map((cat) => ({
    url: `${SITE_URL}${categoryPath(cat)}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Governance pages carry a higher priority than the legal boilerplate:
  // /about, /how-we-check-our-figures and /editorial-policy are pages a reader
  // - or a search engine assessing whether this site can be trusted - has an
  // actual reason to read, whereas the terms are there because they must be.
  const governancePages = [
    '/about',
    '/for-organisations',
    '/how-we-check-our-figures',
    '/editorial-policy',
    '/updates',
    '/contact',
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const staticPages = ['', '/privacy', '/terms', '/disclaimer', '/commercial-disclosure', '/accessibility'].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.5,
  }));

  return [...staticPages, ...governancePages, ...categories, ...calculators];
}
