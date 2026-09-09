import { MetadataRoute } from 'next';
import { INITIAL_CATEGORIES } from '../lib/initial-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://blogwithsports.com';
  const now = new Date();

  const categoryEntries: MetadataRoute.Sitemap = INITIAL_CATEGORIES.map((category) => ({
    url: `${baseUrl}/#category/${category.id}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...categoryEntries,
  ];
}
