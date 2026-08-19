import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify",
          "/email-verification",
        ],
      },
    ],
    sitemap: "https://crush-svg.vercel.app/sitemap.xml",
  };
}
