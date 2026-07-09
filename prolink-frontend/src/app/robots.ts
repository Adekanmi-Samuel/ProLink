import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/api/', '/profile/edit', '/chat/'],
    },
    sitemap: (process.env.NEXT_PUBLIC_SITE_URL || 'https://prolink-eight.vercel.app') + '/sitemap.xml',
  };
}
