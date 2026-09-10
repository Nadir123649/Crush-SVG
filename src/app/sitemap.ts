import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";
import { Blog } from "@/lib/database/models/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL || "https://www.crushsvg.net";
  const currentDate = new Date().toISOString().split("T")[0];

  const staticRoutes = [
    { path: "", priority: 1.0, freq: "daily" },
    { path: "/about", priority: 0.8, freq: "weekly" },
    { path: "/png-to-svg", priority: 0.9, freq: "weekly" },
    { path: "/background-remover", priority: 0.9, freq: "weekly" },
    { path: "/image-resizer", priority: 0.9, freq: "weekly" },
    { path: "/raster-to-svg", priority: 0.9, freq: "weekly" },
    { path: "/team", priority: 0.7, freq: "monthly" },
    { path: "/changelog", priority: 0.7, freq: "weekly" },
    { path: "/svg-guides", priority: 0.8, freq: "weekly" },
    { path: "/blog", priority: 0.9, freq: "daily" },
    { path: "/contact-us", priority: 0.6, freq: "monthly" },
    { path: "/help", priority: 0.6, freq: "monthly" },
    { path: "/support", priority: 0.6, freq: "monthly" },
    { path: "/terms", priority: 0.4, freq: "yearly" },
    { path: "/privacy-policy", priority: 0.4, freq: "yearly" },
    { path: "/cookies", priority: 0.4, freq: "yearly" },
  ];

  const staticUrls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.freq as any,
    priority: route.priority,
  }));

  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const posts = await Blog.find({ published: true })
      .select("slug createdAt")
      .sort({ createdAt: -1 })
      .lean();
    blogUrls = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.createdAt instanceof Date
        ? post.createdAt.toISOString().split("T")[0]
        : currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to fetch blog posts for sitemap:", error);
  }

  const useCaseUrls: MetadataRoute.Sitemap = useCases.map((uc) => ({
    url: `${baseUrl}/use-case/${uc.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticUrls, ...blogUrls, ...useCaseUrls];
}

