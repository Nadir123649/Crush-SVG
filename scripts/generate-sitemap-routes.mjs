import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localizedAppRoot = path.join(projectRoot, "src", "app", "[locale]");
const outputFile = path.join(projectRoot, "src", "app", "sitemap-routes.generated.ts");
const excludedRoutes = new Set([
  "forgot-password",
  "login",
  "profile",
  "reset-password",
  "signup",
]);

async function findPages(directory, segments = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    if (!entry.isDirectory() && entry.name !== "page.tsx" && entry.name !== "page.ts") continue;

    if (entry.isDirectory()) {
      if (entry.name.startsWith("[") || entry.name.startsWith("@")) continue;
      const nextSegments = entry.name.startsWith("(")
        ? segments
        : [...segments, entry.name];
      routes.push(...await findPages(path.join(directory, entry.name), nextSegments));
      continue;
    }

    const route = `/${segments.join("/")}`.replace(/\/$/, "") || "/";
    if (route !== "/" && excludedRoutes.has(route.slice(1))) continue;
    routes.push(route);
  }

  return routes;
}

const routes = [...new Set(await findPages(localizedAppRoot))].sort((a, b) =>
  a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)
);

const generated = [
  "// Generated from src/app/[locale] page files. Do not edit by hand.",
  `export const SITEMAP_STATIC_ROUTES = ${JSON.stringify(routes, null, 2)} as const;`,
  `export const SITEMAP_GENERATED_AT = ${JSON.stringify(new Date().toISOString())};`,
  "",
].join("\n");
await writeFile(outputFile, generated, "utf8");
console.log(`Generated sitemap route list with ${routes.length} routes.`);
