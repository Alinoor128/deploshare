import { MetadataRoute } from 'next';
import { BRAND_CONFIG } from '@/lib/config/brand';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = BRAND_CONFIG.url;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/settings/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
