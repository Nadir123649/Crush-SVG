import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://crushsvg.net";
  const now = new Date();

  const routes = [
    { url: base, priority: 1.0 },
    { url: `${base}/svg-guides`, priority: 0.9 },
    { url: `${base}/about`, priority: 0.8 },
    { url: `${base}/contact-us`, priority: 0.8 },
    { url: `${base}/support`, priority: 0.7 },
    { url: `${base}/help`, priority: 0.7 },
    { url: `${base}/login`, priority: 0.6 },
    { url: `${base}/signup`, priority: 0.6 },
    { url: `${base}/forgot-password`, priority: 0.5 },
    { url: `${base}/privacy-policy`, priority: 0.5 },
    { url: `${base}/terms`, priority: 0.5 },
    { url: `${base}/cookies`, priority: 0.5 },
  ];

  return routes.map((route) => ({
    url: route.url,
    lastModified: now,
    changeFrequency: route.priority >= 0.8 ? "weekly" : "monthly",
    priority: route.priority,
  }));
}
