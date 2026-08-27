import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
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
}
