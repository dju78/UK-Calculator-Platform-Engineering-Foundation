import { MetadataRoute } from 'next';
import { wave1Registry } from '../../../../dist/packages/calculator-registry/src/index.js';
import { SITE_URL, calculatorPath, categoryPath } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Calculators are addressed by SLUG. A previous revision emitted the internal
  // id (/calculators/TAX-001), so every one of the 55 canonical URLs in the
  // sitemap pointed somewhere other than the page users and links actually use.
  const calculators = wave1Registry.map((calc) => ({
    url: `${SITE_URL}${calculatorPath(calc.slug)}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category names contain spaces and ampersands, so they must be encoded to
  // be valid URLs inside the sitemap.
  const categories = Array.from(new Set(wave1Registry.map((c) => c.category))).map((cat) => ({
    url: `${SITE_URL}${categoryPath(cat)}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const staticPages = ['', '/privacy', '/terms', '/disclaimer', '/accessibility'].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.5,
  }));

  return [...staticPages, ...categories, ...calculators];
}
