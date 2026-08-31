import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const baseUrl = SITE_URL || "https://www.crushsvg.net";
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  const staticRoutes = [
    { path: '', priority: 1.0, freq: 'daily' },
    { path: '/about', priority: 0.8, freq: 'weekly' },
    { path: '/png-to-svg', priority: 0.9, freq: 'weekly' },
    { path: '/team', priority: 0.7, freq: 'monthly' },
    { path: '/changelog', priority: 0.7, freq: 'weekly' },
    { path: '/svg-guides', priority: 0.8, freq: 'weekly' },
    { path: '/contact-us', priority: 0.6, freq: 'monthly' },
    { path: '/help', priority: 0.6, freq: 'monthly' },
    { path: '/support', priority: 0.6, freq: 'monthly' },
    { path: '/terms', priority: 0.4, freq: 'yearly' },
    { path: '/privacy-policy', priority: 0.4, freq: 'yearly' },
    { path: '/cookies', priority: 0.4, freq: 'yearly' },
  ];

  const staticUrls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.freq as any,
    priority: route.priority,
  }));

  return staticUrls;
}
