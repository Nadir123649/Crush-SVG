const CORS_ORIGINS = [
  "https://crushsvg.net",
  "https://www.crushsvg.net",
  "https://staging.crushsvg.net",
];

const CRUSHSVG_VERCEL_PREVIEW_ORIGIN =
  /^https:\/\/crush-[a-z0-9-]+-nadir123649s-projects\.vercel\.app$/i;

export function isAllowedCorsOrigin(origin: string): boolean {
  return (
    CORS_ORIGINS.includes(origin) ||
    CRUSHSVG_VERCEL_PREVIEW_ORIGIN.test(origin)
  );
}
