import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/verify", "/reset-password"],
      },
    ],
    sitemap: "https://crush-svg.vercel.app/sitemap.xml",
  };
}
