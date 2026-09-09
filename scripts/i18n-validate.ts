/**
 * i18n-validate — Translation validation tool for CrushSVG
 *
 * Validates all locale JSON files against en.json for:
 * - JSON syntax validity
 * - Key parity (missing/extra keys)
 * - Placeholder consistency (ICU message format)
 * - Interpolation variable preservation
 * - No untranslated keys (English values left as-is)
 *
 * Usage:
 *   npx tsx scripts/i18n-validate.ts           # validate all locales
 *   npx tsx scripts/i18n-validate.ts --locale es  # validate single locale
 *
 * Exit code: 0 = all valid, 1 = errors found
 */

import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ValidationError {
  locale: string;
  key: string;
  type: "missing" | "extra" | "placeholder_mismatch" | "untranslated" | "invalid_json" | "invalid_icu";
  message: string;
}

interface ValidationReport {
  locale: string;
  valid: boolean;
  errors: ValidationError[];
  stats: {
    totalKeys: number;
    missingKeys: number;
    extraKeys: number;
    placeholderMismatches: number;
    untranslatedKeys: number;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MESSAGES_DIR = resolve(__dirname, "../messages");
const SOURCE_FILE = join(MESSAGES_DIR, "en.json");
const TARGET_LOCALES = ["es", "de", "fr", "pt", "ja"];

/** Flatten a nested object into dot-notation keys */
function flatten(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (key === "_reviewed") continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value);
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

/** Extract ICU placeholders from a message: "{count} items" → ["count"] */
function extractPlaceholders(message: string): string[] {
  const matches = message.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

/** Validate ICU message syntax (basic checks) */
function validateIcuSyntax(message: string): string[] {
  const errors: string[] = [];

  // Check balanced braces
  let braceCount = 0;
  for (const char of message) {
    if (char === "{") braceCount++;
    if (char === "}") braceCount--;
    if (braceCount < 0) {
      errors.push("Unmatched closing brace");
      break;
    }
  }
  if (braceCount > 0) {
    errors.push(`Unmatched opening brace (${braceCount} unclosed)`);
  }

  // Check for common ICU patterns
  const selectMatches = message.match(/\{(\w+),\s*select/);
  if (selectMatches) {
    // Basic select validation
    const selectContent = message.substring(
      message.indexOf(`{${selectMatches[1]}, select`)
    );
    if (!selectContent.includes("other")) {
      errors.push(`Select statement missing required "other" variant`);
    }
  }

  const pluralMatches = message.match(/\{(\w+),\s*plural/);
  if (pluralMatches) {
    const pluralContent = message.substring(
      message.indexOf(`{${pluralMatches[1]}, plural`)
    );
    if (!pluralContent.includes("other")) {
      errors.push(`Plural statement missing required "other" variant`);
    }
  }

  return errors;
}

/** Read and parse a JSON file */
function readJsonFile(filePath: string): { data: Record<string, any> | null; error?: string } {
  try {
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return { data };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateLocale(
  locale: string,
  sourceFlat: Record<string, string>,
  sourceData: Record<string, any>
): ValidationReport {
  const localeFile = join(MESSAGES_DIR, `${locale}.json`);
  const errors: ValidationError[] = [];

  // 1. Check file exists
  if (!existsSync(localeFile)) {
    return {
      locale,
      valid: false,
      errors: [
        {
          locale,
          key: "",
          type: "invalid_json",
          message: `File not found: ${locale}.json`,
        },
      ],
      stats: { totalKeys: 0, missingKeys: Object.keys(sourceFlat).length, extraKeys: 0, placeholderMismatches: 0, untranslatedKeys: 0 },
    };
  }

  // 2. Parse JSON
  const { data: localeData, error: parseError } = readJsonFile(localeFile);
  if (!localeData || parseError) {
    return {
      locale,
      valid: false,
      errors: [
        {
          locale,
          key: "",
          type: "invalid_json",
          message: `JSON parse error: ${parseError}`,
        },
      ],
      stats: { totalKeys: 0, missingKeys: 0, extraKeys: 0, placeholderMismatches: 0, untranslatedKeys: 0 },
    };
  }

  const localeFlat = flatten(localeData);

  // 3. Missing keys (in source but not in locale)
  for (const key of Object.keys(sourceFlat)) {
    if (!(key in localeFlat)) {
      errors.push({
        locale,
        key,
        type: "missing",
        message: `Missing translation key`,
      });
    }
  }

  // 4. Extra keys (in locale but not in source)
  for (const key of Object.keys(localeFlat)) {
    if (!(key in sourceFlat)) {
      errors.push({
        locale,
        key,
        type: "extra",
        message: `Stale/extra key not in source`,
      });
    }
  }

  // 5. Placeholder consistency
  let placeholderMismatches = 0;
  for (const key of Object.keys(sourceFlat)) {
    if (key in localeFlat) {
      const sourcePhs = extractPlaceholders(sourceFlat[key]);
      const localePhs = extractPlaceholders(localeFlat[key]);
      if (JSON.stringify(sourcePhs.sort()) !== JSON.stringify(localePhs.sort())) {
        placeholderMismatches++;
        errors.push({
          locale,
          key,
          type: "placeholder_mismatch",
          message: `Placeholders differ: source=[${sourcePhs}] locale=[${localePhs}]`,
        });
      }
    }
  }

  // 6. ICU syntax validation
  for (const [key, value] of Object.entries(localeFlat)) {
    const icuErrors = validateIcuSyntax(value);
    for (const icuError of icuErrors) {
      errors.push({
        locale,
        key,
        type: "invalid_icu",
        message: icuError,
      });
    }
  }

  // 7. Untranslated keys (value identical to English source)
  let untranslatedCount = 0;
  for (const key of Object.keys(sourceFlat)) {
    if (key in localeFlat && locale === "ja") {
      // Japanese uses different script, so identical values are fine
      // Only flag for Latin-script locales
    }
    if (key in localeFlat && locale !== "ja" && localeFlat[key] === sourceFlat[key]) {
      // Don't flag technical values (numbers, URLs, CSS, etc.)
      const value = localeFlat[key];
      if (value.match(/^[\d\s.,:;!?@#%^&*()+=\[\]{}|\\/<>~`-]+$/)) continue;
      if (value.match(/^https?:\/\//)) continue;
      if (value.match(/^[A-Z]{2,}$/)) continue; // Acronyms
      if (value.length < 3) continue; // Very short strings

      untranslatedCount++;
      errors.push({
        locale,
        key,
        type: "untranslated",
        message: `Value identical to English source`,
      });
    }
  }

  // Stats
  const stats = {
    totalKeys: Object.keys(localeFlat).length,
    missingKeys: errors.filter((e) => e.type === "missing").length,
    extraKeys: errors.filter((e) => e.type === "extra").length,
    placeholderMismatches,
    untranslatedKeys: untranslatedCount,
  };

  return {
    locale,
    valid: errors.filter((e) => e.type !== "extra" && e.type !== "untranslated").length === 0,
    errors,
    stats,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const singleLocale = args.includes("--locale")
    ? args[args.indexOf("--locale") + 1]
    : null;

  console.log("🔍 i18n-validate — Translation Validation");
  console.log("━".repeat(50));

  // 1. Load source
  if (!existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const { data: sourceData, error: sourceError } = readJsonFile(SOURCE_FILE);
  if (!sourceData || sourceError) {
    console.error(`❌ Failed to parse source: ${sourceError}`);
    process.exit(1);
  }

  const sourceFlat = flatten(sourceData);
  console.log(`\n📄 Source (en.json): ${Object.keys(sourceFlat).length} keys`);

  // 2. Validate each locale
  const locales = singleLocale ? [singleLocale] : TARGET_LOCALES;
  const reports: ValidationReport[] = [];
  let totalErrors = 0;

  for (const locale of locales) {
    console.log(`\n${"─".repeat(50)}`);
    const report = validateLocale(locale, sourceFlat, sourceData);
    reports.push(report);

    const icon = report.valid ? "✅" : "❌";
    console.log(`${icon} ${locale.toUpperCase()}`);
    console.log(`   Keys: ${report.stats.totalKeys}`);
    console.log(`   Missing: ${report.stats.missingKeys}`);
    console.log(`   Extra: ${report.stats.extraKeys}`);
    console.log(`   Placeholder mismatches: ${report.stats.placeholderMismatches}`);
    console.log(`   Untranslated: ${report.stats.untranslatedKeys}`);

    if (!report.valid) {
      const criticalErrors = report.errors.filter(
        (e) => e.type === "missing" || e.type === "placeholder_mismatch" || e.type === "invalid_json" || e.type === "invalid_icu"
      );
      totalErrors += criticalErrors.length;

      if (criticalErrors.length > 0) {
        console.log(`\n   Critical errors:`);
        for (const error of criticalErrors.slice(0, 20)) {
          console.log(`     ${error.type}: ${error.key || "(root)"} — ${error.message}`);
        }
        if (criticalErrors.length > 20) {
          console.log(`     ... and ${criticalErrors.length - 20} more`);
        }
      }
    }
  }

  // 3. Summary
  console.log(`\n${"━".repeat(50)}`);
  console.log("📊 Summary");
  console.log(`  Locales validated: ${locales.length}`);
  console.log(`  Total critical errors: ${totalErrors}`);

  if (totalErrors === 0) {
    console.log(`\n✅ All locales pass validation`);
  } else {
    console.log(`\n❌ Validation failed — fix errors before deploying`);
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
