// Silences: "using deprecated parameters for `initSync()`; pass a single object instead"
//
// @buzz-dee/vtrace is built with wasm-bindgen and calls its own initSync() with the
// deprecated positional argument at module-evaluation time. The one-line fix belongs in
// the call site inside the generated bundle:
//
//   initSync(decodeWasmBase64(VTRACER_WASM_BASE64));                  <- deprecated, warns
//   initSync({ module: decodeWasmBase64(VTRACER_WASM_BASE64) });     <- object form
//
// initSync() destructures a plain object as { module }, so wrapping the Uint8Array in an
// object takes the non-deprecated branch. Behaviour is otherwise identical.
//
// This patch is intentionally surgical: only that one call is rewritten. The ~182KB
// inline base64 WASM payload in the same file is never touched, and the file is never
// rewritten unless a replacement actually happens.
//
// Runs from `postinstall`, so it is re-applied deterministically on every npm install /
// npm ci / Vercel build. Always exits 0 so this cosmetic fix can never break an install.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const PKG = "@buzz-dee/vtrace";
const PREFIX = "[patch-vtrace]";

const TARGET = "initSync(decodeWasmBase64(VTRACER_WASM_BASE64));";
const REPLACEMENT = "initSync({ module: decodeWasmBase64(VTRACER_WASM_BASE64) });";

// Only patch the 1.x line. A future release may fix this upstream, and an unfamiliar
// bundle must never be rewritten on a blind string match.
const SUPPORTED_MAJOR = "1.";

const pkgDir = join(process.cwd(), "node_modules", ...PKG.split("/"));
const pkgJsonPath = join(pkgDir, "package.json");

if (!existsSync(pkgJsonPath)) {
  console.log(`${PREFIX} ${PKG} not installed, skipping`);
  process.exit(0);
}

let version;
try {
  version = JSON.parse(readFileSync(pkgJsonPath, "utf8")).version;
} catch {
  console.log(`${PREFIX} could not read ${PKG} package.json, skipping`);
  process.exit(0);
}

if (typeof version !== "string" || !version.startsWith(SUPPORTED_MAJOR)) {
  console.log(
    `${PREFIX} ${PKG}@${version} is not a ${SUPPORTED_MAJOR}x release, skipping`,
  );
  process.exit(0);
}

console.log(`${PREFIX} patching ${PKG}@${version}`);

for (const file of ["dist/index.js", "dist/index.cjs"]) {
  const filePath = join(pkgDir, ...file.split("/"));

  if (!existsSync(filePath)) {
    console.log(`${PREFIX} ${file} not found, skipping`);
    continue;
  }

  const source = readFileSync(filePath, "utf8");
  const occurrences = source.split(TARGET).length - 1;

  if (occurrences === 0) {
    console.log(`${PREFIX} ${file} already patched or fixed upstream, skipping`);
    continue;
  }

  if (occurrences > 1) {
    console.log(
      `${PREFIX} ${file}: found ${occurrences} occurrences (expected 1), refusing to patch`,
    );
    continue;
  }

  // Single occurrence, so replace() touches exactly that call and nothing else.
  writeFileSync(filePath, source.replace(TARGET, REPLACEMENT), "utf8");
  console.log(`${PREFIX} ${file} patched`);
}

process.exit(0);