import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (SITE_URL || "https://www.crushsvg.net").replace(/\/$/, "");

  const disallowList = [
    // Disallow private user states and dashboards
    "/dashboard/",
    "/dashboard",
    "/account/",
    "/account",
    "/settings/",
    "/settings",
    "/billing/",
    "/billing",
    "/subscription/",
    "/subscription",
    "/history/",
    "/history",
    "/my-files/",
    "/my-files",
    "/profile/",
    "/profile",

    // Disallow API and administrative routes
    "/api/",
    "/admin/",
    "/admin",
    "/webhooks/",

    // Disallow checkout and transactional callback states
    "/checkout/",
    "/checkout",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowList,
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
          "Cohere-ai",
          "Bytespider",
        ],
        allow: "/",
        disallow: disallowList,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
