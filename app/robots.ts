import type { MetadataRoute } from 'next'

const BASE_URL = 'https://anjinrally.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/checkpoint'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
