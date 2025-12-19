import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://institutopaidek.com' // Reemplaza con tu dominio real

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
