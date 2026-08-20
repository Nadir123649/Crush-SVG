import "server-only";
import fs from "fs";
import path from "path";
import os from "os";

let fontConfigInitialized = false;

export function ensureFontConfig(): void {
  if (fontConfigInitialized) return;

  try {
    const fontsDir = path.join(process.cwd(), "src/lib/svg/fonts");
    const cacheDir = path.join(os.tmpdir(), "crushsvg-fontconfig-cache");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const confDir = path.join(os.tmpdir(), "crushsvg-fontconfig");
    if (!fs.existsSync(confDir)) {
      fs.mkdirSync(confDir, { recursive: true });
    }

    const confFilePath = path.join(confDir, "fonts.conf");

    const normalizedFontsDir = fontsDir.replace(/\\/g, "/");
    const normalizedCacheDir = cacheDir.replace(/\\/g, "/");

    const xml = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- Bundled application fonts -->
  <dir>${normalizedFontsDir}</dir>

  <!-- Standard system font directories -->
  <dir>/usr/share/fonts</dir>
  <dir>/usr/local/share/fonts</dir>
  <dir prefix="xdg">fonts</dir>
  <dir>C:/Windows/Fonts</dir>
  <dir>/System/Library/Fonts</dir>
  <dir>/Library/Fonts</dir>

  <!-- Font cache directory -->
  <cachedir>${normalizedCacheDir}</cachedir>

  <!-- Generic sans-serif and Arial mappings -->
  <match target="pattern">
    <test qual="any" name="family">
      <string>sans-serif</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Geist</string>
    </edit>
  </match>

  <match target="pattern">
    <test qual="any" name="family">
      <string>Arial</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Geist</string>
    </edit>
  </match>

  <match target="pattern">
    <test qual="any" name="family">
      <string>Helvetica</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Geist</string>
    </edit>
  </match>

  <!-- Global fallback for any uninstalled font family -->
  <match target="pattern">
    <edit name="family" mode="append_last">
      <string>Geist</string>
    </edit>
  </match>
</fontconfig>`;

    fs.writeFileSync(confFilePath, xml, "utf-8");

    process.env.FONTCONFIG_PATH = confDir;
    process.env.FONTCONFIG_FILE = confFilePath;

    fontConfigInitialized = true;
  } catch (err) {
    console.error("[crushsvg] Failed to initialize Fontconfig for SVG text rendering:", err);
  }
}

// Auto-initialize on server import
ensureFontConfig();
