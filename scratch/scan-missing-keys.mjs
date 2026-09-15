import fs from "fs";
import path from "path";

const MESSAGES_FILE = path.resolve("messages/en.json");
const SRC_DIR = path.resolve("src");

const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));

function getAllFiles(dir, exts = [".ts", ".tsx"]) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getAllFiles(full, exts));
    } else if (exts.some((e) => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

function getObjectKey(obj, pathStr) {
  const parts = pathStr.split(".");
  let curr = obj;
  for (const p of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[p];
  }
  return curr;
}

const files = getAllFiles(SRC_DIR);
console.log(`Checking ${files.length} source files for missing translation keys...`);

const missingKeys = [];

for (const file of files) {
  const code = fs.readFileSync(file, "utf-8");

  // Find all useTranslations('namespace') or useTranslations()
  const hookRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:useTranslations|getTranslations)\s*\(\s*(?:\{[^}]*namespace:\s*['"]([^'"]+)['"][^}]*\}|['"]([^'"]+)['"]|\))/g;
  let match;
  const namespaces = {};

  while ((match = hookRegex.exec(code)) !== null) {
    const varName = match[1];
    const ns = match[2] || match[3] || "";
    namespaces[varName] = ns;
  }

  // Also check direct calls like t("key") or tNav("key")
  for (const [varName, ns] of Object.entries(namespaces)) {
    const callRegex = new RegExp(`\\b${varName}(?:\\.raw)?\\(\\s*['"]([^'"]+)['"]`, "g");
    let callMatch;
    while ((callMatch = callRegex.exec(code)) !== null) {
      const key = callMatch[1];
      const fullPath = ns ? `${ns}.${key}` : key;
      const val = getObjectKey(messages, fullPath);
      if (val === undefined) {
        missingKeys.push({
          file: path.relative(SRC_DIR, file),
          varName,
          namespace: ns,
          key,
          fullPath,
        });
      }
    }
  }
}

if (missingKeys.length === 0) {
  console.log("✅ No missing translation keys found across entire codebase!");
} else {
  console.log(`❌ Found ${missingKeys.length} missing translation keys:`);
  console.log(JSON.stringify(missingKeys, null, 2));
}
