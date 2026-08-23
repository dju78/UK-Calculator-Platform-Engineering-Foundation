import { MetadataRoute } from 'next';
import { wave1Registry } from '../../../../dist/packages/calculator-registry/src/index.js';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ukcalculatorplatform.co.uk';

  const calculators = wave1Registry.map((calc) => ({
    url: `${baseUrl}/calculators/${calc.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categories = Array.from(new Set(wave1Registry.map(c => c.category))).map((cat) => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const staticPages = [
    '',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/accessibility',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.5,
  }));

  return [...staticPages, ...categories, ...calculators];
}
