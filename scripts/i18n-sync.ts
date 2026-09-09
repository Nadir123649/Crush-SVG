/**
 * i18n-sync — Translation synchronization tool for CrushSVG
 *
 * Reads messages/en.json as the canonical source, compares against each target
 * locale, detects missing/extra/changed keys, and optionally generates
 * translations via a configurable API provider.
 *
 * Usage:
 *   npx tsx scripts/i18n-sync.ts              # detect only (no translation)
 *   npx tsx scripts/i18n-sync.ts --write      # write missing keys to locale files
 *   npx tsx scripts/i18n-sync.ts --translate  # translate missing keys via API
 *
 * Environment variables:
 *   I18N_SYNC_PROVIDER  — "openai" | "deepseek" | "google" (default: none = detect only)
 *   I18N_SYNC_API_KEY   — API key for the translation provider
 *   I18N_SYNC_MODEL     — Model name override (optional)
 *   I18N_SYNC_BASE_URL  — API base URL override (optional)
 *
 * Translation preservation:
 *   Keys marked with "_reviewed": true in the locale file are never overwritten.
 *   Keys not present in en.json (stale/extra) are reported but not removed.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SyncOptions {
  write: boolean;
  translate: boolean;
  verbose: boolean;
}

interface DiffReport {
  locale: string;
  missingKeys: string[];
  extraKeys: string[];
  changedKeys: string[];
  reviewedKeys: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MESSAGES_DIR = resolve(__dirname, "../messages");
const SOURCE_FILE = join(MESSAGES_DIR, "en.json");
const TARGET_LOCALES = ["es", "de", "fr", "pt", "ja"];

/** Flatten a nested object into dot-notation keys: { a: { b: 1 } } → { "a.b": 1 } */
function flatten(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (key === "_reviewed") continue; // skip metadata
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else if (Array.isArray(value)) {
      // Arrays are kept as-is (next-intl supports array messages)
      result[fullKey] = JSON.stringify(value);
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

/** Unflatten dot-notation keys back into a nested object */
function unflatten(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    const lastPart = parts[parts.length - 1];
    // Try to parse JSON arrays back
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        current[lastPart] = parsed;
        continue;
      }
    } catch {
      // Not JSON, keep as string
    }
    current[lastPart] = value;
  }
  return result;
}

/** Extract ICU placeholders from a message: "{count} items" → ["count"] */
function extractPlaceholders(message: string): string[] {
  const matches = message.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

/** Read and parse a JSON file, returning null on error */
function readJsonFile(filePath: string): Record<string, any> | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/** Write a JSON file with deterministic formatting */
function writeJsonFile(filePath: string, data: Record<string, any>): void {
  const content = JSON.stringify(data, null, 2) + "\n";
  writeFileSync(filePath, content, "utf-8");
}

// ─── Translation Validation ─────────────────────────────────────────────────

interface ValidationResult {
  emptyKeys: string[];
  untranslatedKeys: string[];
  brokenPlaceholderKeys: Array<{ key: string; expected: string[]; actual: string[] }>;
}

/** Validate translated values for quality issues */
function validateTranslations(
  sourceFlat: Record<string, string>,
  targetFlat: Record<string, string>,
  reviewedKeys: Set<string>
): ValidationResult {
  const emptyKeys: string[] = [];
  const untranslatedKeys: string[] = [];
  const brokenPlaceholderKeys: Array<{ key: string; expected: string[]; actual: string[] }> = [];

  for (const [key, targetValue] of Object.entries(targetFlat)) {
    if (key === "_reviewed") continue;

    const sourceValue = sourceFlat[key];
    // Skip keys not in source (extra/stale)
    if (sourceValue === undefined) continue;
    // Skip reviewed keys
    if (reviewedKeys.has(key)) continue;

    // Check for empty values
    if (targetValue === "") {
      emptyKeys.push(key);
      continue;
    }

    // Check for untranslated values (identical to English source)
    if (targetValue === sourceValue) {
      untranslatedKeys.push(key);
    }

    // Check for broken interpolation placeholders
    const sourcePlaceholders = extractPlaceholders(sourceValue);
    const targetPlaceholders = extractPlaceholders(targetValue);

    if (JSON.stringify(sourcePlaceholders) !== JSON.stringify(targetPlaceholders)) {
      brokenPlaceholderKeys.push({
        key,
        expected: sourcePlaceholders,
        actual: targetPlaceholders,
      });
    }
  }

  return {
    emptyKeys: emptyKeys.sort(),
    untranslatedKeys: untranslatedKeys.sort(),
    brokenPlaceholderKeys: brokenPlaceholderKeys.sort((a, b) => a.key.localeCompare(b.key)),
  };
}

// ─── Diff Detection ─────────────────────────────────────────────────────────

function computeDiff(
  sourceFlat: Record<string, string>,
  targetFlat: Record<string, string>,
  reviewedKeys: Set<string>
): DiffReport {
  const missingKeys: string[] = [];
  const extraKeys: string[] = [];
  const changedKeys: string[] = [];
  const foundReviewed: string[] = [];

  // Keys in source but not in target
  for (const key of Object.keys(sourceFlat)) {
    if (!(key in targetFlat)) {
      missingKeys.push(key);
    }
  }

  // Keys in target but not in source (stale)
  for (const key of Object.keys(targetFlat)) {
    if (key === "_reviewed") continue;
    if (!(key in sourceFlat)) {
      extraKeys.push(key);
    }
  }

  // Keys where source value changed (source timestamp check)
  for (const key of Object.keys(sourceFlat)) {
    if (key in targetFlat) {
      const sourcePhs = extractPlaceholders(sourceFlat[key]);
      const targetPhs = extractPlaceholders(targetFlat[key]);
      if (JSON.stringify(sourcePhs) !== JSON.stringify(targetPhs)) {
        changedKeys.push(key);
      }
    }
  }

  // Track reviewed keys
  for (const key of reviewedKeys) {
    foundReviewed.push(key);
  }

  return {
    locale: "",
    missingKeys: missingKeys.sort(),
    extraKeys: extraKeys.sort(),
    changedKeys: changedKeys.sort(),
    reviewedKeys: foundReviewed.sort(),
  };
}

// ─── Translation Provider ───────────────────────────────────────────────────

interface TranslationResult {
  key: string;
  value: string;
  reviewed: boolean;
}

async function translateBatch(
  keys: string[],
  values: Record<string, string>,
  targetLocale: string,
  sourceLocale: string
): Promise<TranslationResult[]> {
  const provider = process.env.I18N_SYNC_PROVIDER;
  const apiKey = process.env.I18N_SYNC_API_KEY;

  if (!provider || !apiKey) {
    // No provider configured — return empty (keys stay as English fallback)
    return keys.map((key) => ({
      key,
      value: values[key],
      reviewed: false,
    }));
  }

  const baseUrl =
    process.env.I18N_SYNC_BASE_URL ||
    (provider === "openai"
      ? "https://api.openai.com/v1"
      : provider === "deepseek"
        ? "https://api.deepseek.com/v1"
        : "");

  if (!baseUrl) {
    console.error(`  ⚠ Unknown provider "${provider}". Set I18N_SYNC_BASE_URL.`);
    return keys.map((key) => ({
      key,
      value: values[key],
      reviewed: false,
    }));
  }

  const localeNames: Record<string, string> = {
    es: "Spanish",
    de: "German",
    fr: "French",
    pt: "Portuguese (Brazilian)",
    ja: "Japanese",
  };

  const targetName = localeNames[targetLocale] || targetLocale;

  // Build a translation prompt
  const messagesToTranslate = keys.map((key) => ({
    key,
    english: values[key],
  }));

  const systemPrompt = `You are a professional translator for the CrushSVG web application. Translate the following English UI strings to ${targetName}.

Rules:
- Preserve ALL placeholders exactly (e.g., {count}, {name}, {sizeMB}). Do not translate placeholders.
- Preserve brand names: "CrushSVG", "The Nevon"
- Preserve technical terms that are commonly kept in English in ${targetName} contexts
- Keep the same tone and formality level
- For arrays (JSON format), translate each element
- Return ONLY valid JSON: {"translations": [{"key": "...", "value": "..."}]}
- Do NOT add explanations or markdown formatting`;

  const userPrompt = JSON.stringify({ translations: messagesToTranslate }, null, 2);

  try {
    const model = process.env.I18N_SYNC_MODEL || "gpt-4o-mini";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ⚠ API error (${response.status}): ${errorText}`);
      return keys.map((key) => ({
        key,
        value: values[key],
        reviewed: false,
      }));
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("  ⚠ Empty response from translation API");
      return keys.map((key) => ({
        key,
        value: values[key],
        reviewed: false,
      }));
    }

    const parsed = JSON.parse(content);
    const translations: Record<string, string> = {};
    for (const item of parsed.translations || []) {
      translations[item.key] = item.value;
    }

    return keys.map((key) => ({
      key,
      value: translations[key] || values[key],
      reviewed: false,
    }));
  } catch (error: any) {
    console.error(`  ⚠ Translation error: ${error.message}`);
    return keys.map((key) => ({
      key,
      value: values[key],
      reviewed: false,
    }));
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const translateMode = args.includes("--translate");
  const verbose = args.includes("--verbose") || args.includes("-v");

  const options: SyncOptions = {
    write: writeMode,
    translate: translateMode,
    verbose,
  };

  console.log("🔍 i18n-sync — Translation Synchronization");
  console.log("━".repeat(50));

  // 1. Load source
  if (!existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const source = readJsonFile(SOURCE_FILE);
  if (!source) {
    console.error(`❌ Failed to parse source file: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const sourceFlat = flatten(source);
  console.log(`\n📄 Source (en.json): ${Object.keys(sourceFlat).length} keys`);

  if (translateMode) {
    const provider = process.env.I18N_SYNC_PROVIDER || "none";
    console.log(`🤖 Translation provider: ${provider}`);
  }

  // 2. Process each target locale
  const allReports: DiffReport[] = [];
  let totalMissing = 0;
  let totalTranslated = 0;
  let totalEmptyErrors = 0;
  let totalBrokenErrors = 0;

  for (const locale of TARGET_LOCALES) {
    const localeFile = join(MESSAGES_DIR, `${locale}.json`);
    console.log(`\n${"─".repeat(50)}`);
    console.log(`🌍 ${locale.toUpperCase()} — ${localeFile}`);

    if (!existsSync(localeFile)) {
      console.log(`  ⚠ Locale file missing. Creating from source...`);
      if (options.write) {
        writeJsonFile(localeFile, source);
        console.log(`  ✅ Created ${locale}.json with source keys`);
      } else {
        console.log(`  ℹ Use --write to create the file`);
      }
      continue;
    }

    const localeData = readJsonFile(localeFile);
    if (!localeData) {
      console.error(`  ❌ Failed to parse ${locale}.json`);
      continue;
    }

    // Collect reviewed keys (marked with _reviewed: true)
    const reviewedKeys = new Set<string>();
    function collectReviewed(obj: Record<string, any>, prefix = "") {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (key === "_reviewed" && value === true) {
          reviewedKeys.add(fullKey);
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
          collectReviewed(value, fullKey);
        }
      }
    }
    collectReviewed(localeData);

    const targetFlat = flatten(localeData);
    const diff = computeDiff(sourceFlat, targetFlat, reviewedKeys);
    diff.locale = locale;

    // Report
    console.log(`  📊 Keys in locale: ${Object.keys(targetFlat).length}`);
    console.log(`  🔑 Keys in source: ${Object.keys(sourceFlat).length}`);

    if (diff.missingKeys.length > 0) {
      console.log(`  ❌ Missing keys: ${diff.missingKeys.length}`);
      if (options.verbose) {
        for (const key of diff.missingKeys) {
          console.log(`     - ${key}`);
        }
      }
      totalMissing += diff.missingKeys.length;
    }

    if (diff.extraKeys.length > 0) {
      console.log(`  ⚠️  Extra/stale keys: ${diff.extraKeys.length}`);
      if (options.verbose) {
        for (const key of diff.extraKeys) {
          console.log(`     - ${key}`);
        }
      }
    }

    if (diff.changedKeys.length > 0) {
      console.log(`  🔄 Placeholder mismatches: ${diff.changedKeys.length}`);
      if (options.verbose) {
        for (const key of diff.changedKeys) {
          console.log(`     - ${key}`);
        }
      }
    }

    if (diff.reviewedKeys.length > 0) {
      console.log(`  ✅ Reviewed keys (will not overwrite): ${diff.reviewedKeys.length}`);
    }

    if (diff.missingKeys.length === 0 && diff.extraKeys.length === 0 && diff.changedKeys.length === 0) {
      console.log(`  ✅ In sync with source`);
    }

    // Validate translation quality
    const validation = validateTranslations(sourceFlat, targetFlat, reviewedKeys);

    if (validation.emptyKeys.length > 0) {
      console.log(`  ❌ Empty translation values: ${validation.emptyKeys.length}`);
      if (options.verbose) {
        for (const key of validation.emptyKeys) {
          console.log(`     - ${key}`);
        }
      }
    }

    if (validation.untranslatedKeys.length > 0) {
      console.log(`  ⚠️  Untranslated (same as English): ${validation.untranslatedKeys.length}`);
      if (options.verbose) {
        for (const key of validation.untranslatedKeys) {
          console.log(`     - ${key}`);
        }
      }
    }

    if (validation.brokenPlaceholderKeys.length > 0) {
      console.log(`  ❌ Broken interpolation placeholders: ${validation.brokenPlaceholderKeys.length}`);
      if (options.verbose) {
        for (const { key, expected, actual } of validation.brokenPlaceholderKeys) {
          console.log(`     - ${key}: expected [${expected.join(", ")}], got [${actual.join(", ")}]`);
        }
      }
    }

    // Track validation errors for exit code
    totalEmptyErrors += validation.emptyKeys.length;
    totalBrokenErrors += validation.brokenPlaceholderKeys.length;

    // Translate missing keys
    if (options.translate && diff.missingKeys.length > 0) {
      console.log(`\n  🤖 Translating ${diff.missingKeys.length} missing keys...`);

      const translations = await translateBatch(
        diff.missingKeys,
        sourceFlat,
        locale,
        "en"
      );

      // Merge translations into locale data
      let updated = { ...localeData };
      let translatedCount = 0;

      for (const { key, value, reviewed } of translations) {
        if (reviewed) continue;
        const parts = key.split(".");
        let current: any = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        translatedCount++;
      }

      totalTranslated += translatedCount;
      console.log(`  ✅ Translated ${translatedCount} keys`);

      if (options.write) {
        writeJsonFile(localeFile, updated);
        console.log(`  💾 Written to ${locale}.json`);
      }
    } else if (options.write && diff.missingKeys.length > 0 && !options.translate) {
      // Write with English fallback values
      let updated = { ...localeData };
      for (const key of diff.missingKeys) {
        const parts = key.split(".");
        let current: any = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        // Set to English value as placeholder
        current[parts[parts.length - 1]] = sourceFlat[key];
      }

      writeJsonFile(localeFile, updated);
      console.log(`  💾 Written ${diff.missingKeys.length} placeholder keys to ${locale}.json`);
    }

    allReports.push(diff);
  }

  // 3. Summary
  console.log(`\n${"━".repeat(50)}`);
  console.log("📊 Summary");
  console.log(`  Locales checked: ${TARGET_LOCALES.length}`);
  console.log(`  Total missing keys: ${totalMissing}`);
  if (translateMode) {
    console.log(`  Total translated: ${totalTranslated}`);
  }

  if (totalEmptyErrors > 0) {
    console.log(`  ❌ Empty translation values: ${totalEmptyErrors}`);
  }
  if (totalBrokenErrors > 0) {
    console.log(`  ❌ Broken interpolation placeholders: ${totalBrokenErrors}`);
  }

  if (totalMissing > 0 && !options.write) {
    console.log(`\n⚠️  Run with --write to add missing keys (as English placeholders)`);
    console.log(`   Run with --translate to translate via API provider`);
  }

  if (totalMissing === 0 && totalEmptyErrors === 0 && totalBrokenErrors === 0) {
    console.log(`\n✅ All locales are in sync with en.json`);
  }

  // Exit code: 1 if missing keys or validation errors found
  if (totalMissing > 0 || totalEmptyErrors > 0 || totalBrokenErrors > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
