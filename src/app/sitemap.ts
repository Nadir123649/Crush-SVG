import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";

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

  const useCaseUrls: MetadataRoute.Sitemap = useCases.map((uc) => ({
    url: `${SITE_URL}/use-case/${uc.slug}`,
    lastModified: "2026-08-28",
    changeFrequency: "weekly",
    priority: 0.8,
  }));


  return [
    {
      url: `${SITE_URL}`,
      lastModified: "2026-08-27",
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: "2026-08-27",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...blogUrls,
    ...useCaseUrls,
    {
      url: `${SITE_URL}/png-to-svg`,
      lastModified: "2026-08-27",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/team`,
      lastModified: "2026-08-27",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: "2026-08-27",
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/svg-guides`,
      lastModified: "2026-08-27",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact-us`,
      lastModified: "2026-08-27",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: "2026-08-27",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: "2026-08-27",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: "2026-08-27",
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: "2026-08-27",
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/cookies`,
      lastModified: "2026-08-27",
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
  return staticUrls;
}
