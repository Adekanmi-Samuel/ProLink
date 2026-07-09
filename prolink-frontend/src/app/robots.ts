import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/api/', '/profile/edit', '/chat/'],
    },
    sitemap: 'https://prolink.vercel.app/sitemap.xml',
  };
}
