import { VTrace, type VTraceOptions } from "@buzz-dee/vtrace";

export type ConvertMode = "auto" | "pixel" | "vector";
export type QualityLevel = "low" | "standard" | "high";
export type BackgroundMode = "preserve" | "transparent" | "custom";

export interface ConvertOptions {
  mode?: ConvertMode;
  quality?: QualityLevel;
  background?: BackgroundMode;
  /** Hex color used when background === "custom". */
  backgroundColor?: string;
}

export interface ConvertResult {
  svg: string;
  modeUsed: "pixel" | "vector";
  qualityUsed: QualityLevel;
  backgroundUsed: BackgroundMode;
  backgroundColorUsed?: string;
  width: number;
  height: number;
  originalSize: number;
  outputSize: number;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_DIMENSION = 2000;
const UPSCALE_THRESHOLD = 1500;
const VECTOR_SIZE_RATIO_LIMIT = 2.5;

interface QualityPreset {
  vtraceOptions: VTraceOptions;
  maxDimension: number;
  doUpscale: boolean;
}

const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    vtraceOptions: {
      colorMode: "color",
      hierarchical: "stacked",
      mode: "spline",
      filterSpeckle: 10,
      colorPrecision: 6,
      layerDifference: 24,
      cornerThreshold: 75,
      lengthThreshold: 6.0,
      maxIterations: 6,
      spliceThreshold: 45,
      pathPrecision: 2,
      background: VTrace.COLOR_TRANSPARENT,
    },
    maxDimension: 1400,
    doUpscale: false,
  },
  standard: {
    vtraceOptions: {
      colorMode: "color",
      hierarchical: "stacked",
      mode: "spline",
      filterSpeckle: 4,
      colorPrecision: 8,
      layerDifference: 16,
      cornerThreshold: 60,
      lengthThreshold: 4.0,
      maxIterations: 10,
      spliceThreshold: 45,
      pathPrecision: 3,
      background: VTrace.COLOR_TRANSPARENT,
    },
    maxDimension: 2000,
    doUpscale: true,
  },
  high: {
    vtraceOptions: {
      colorMode: "color",
      hierarchical: "stacked",
      mode: "spline",
      filterSpeckle: 2,
      colorPrecision: 10,
      layerDifference: 10,
      cornerThreshold: 45,
      lengthThreshold: 2.5,
      maxIterations: 15,
      spliceThreshold: 45,
      pathPrecision: 4,
      background: VTrace.COLOR_TRANSPARENT,
    },
    maxDimension: 2500,
    doUpscale: true,
  },
};

function validateFile(file: File): void {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const typeOk = ACCEPTED_TYPES.includes(file.type);
  const extOk = ACCEPTED_EXTENSIONS.includes(ext);

  if (!typeOk && !extOk) {
    throw new Error("Unsupported file type. Please upload a PNG, JPG, or WebP image.");
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Image too large (${sizeMB}MB). Maximum size is 10MB.`);
  }
}

function loadImage(file: File): Promise<{ img: HTMLImageElement; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => resolve({ img, dataUrl });
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function clampDimension(
  w: number,
  h: number,
  maxDim: number = DEFAULT_MAX_DIMENSION
): { w: number; h: number } {
  if (w <= maxDim && h <= maxDim) return { w, h };
  const ratio = Math.min(maxDim / w, maxDim / h);
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

function drawToCanvas(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  transparent = false
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  if (!transparent) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetW, targetH);
  }
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return ctx.getImageData(0, 0, targetW, targetH);
}

/** Sample corners + edge pixels to detect dominant background color. */
function detectBackgroundColor(data: Uint8ClampedArray, w: number, h: number): { r: number; g: number; b: number; coverage: number } {
  const samples: { r: number; g: number; b: number }[] = [];

  // 4 corners
  const corners = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
  ];
  for (const [x, y] of corners) {
    const i = (y * w + x) * 4;
    samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

  // ~8 edge samples per side
  for (let i = 0; i < 8; i++) {
    const t = Math.floor((i + 1) / 9 * (w - 1));
    // top edge
    const ti = (0 * w + t) * 4;
    samples.push({ r: data[ti], g: data[ti + 1], b: data[ti + 2] });
    // bottom edge
    const bi = ((h - 1) * w + t) * 4;
    samples.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
    // left edge
    const li = (Math.floor(i * (h - 1) / 7) * w + 0) * 4;
    samples.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
    // right edge
    const ri = (Math.floor(i * (h - 1) / 7) * w + (w - 1)) * 4;
    samples.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
  }

  // Cluster samples: group by within ±10 RGB, pick largest cluster
  const clusters: { r: number; g: number; b: number; count: number }[] = [];
  for (const s of samples) {
    let merged = false;
    for (const c of clusters) {
      if (
        Math.abs(c.r - s.r) <= 10 &&
        Math.abs(c.g - s.g) <= 10 &&
        Math.abs(c.b - s.b) <= 10
      ) {
        c.r = (c.r * c.count + s.r) / (c.count + 1);
        c.g = (c.g * c.count + s.g) / (c.count + 1);
        c.b = (c.b * c.count + s.b) / (c.count + 1);
        c.count++;
        merged = true;
        break;
      }
    }
    if (!merged) clusters.push({ r: s.r, g: s.g, b: s.b, count: 1 });
  }

  clusters.sort((a, b) => b.count - a.count);
  const dominant = clusters[0];
  const coverage = dominant.count / samples.length;

  return {
    r: Math.round(dominant.r),
    g: Math.round(dominant.g),
    b: Math.round(dominant.b),
    coverage,
  };
}

/**
 * Remove background using chroma-key: set pixels close to detected bg → alpha 0.
 * Anti-black-blob: foreground pixels keep original RGB; background → transparent.
 */
function removeBackground(
  imageData: ImageData,
  threshold = 35
): ImageData {
  const { data, width: w, height: h } = imageData;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const od = out.data;

  const bg = detectBackgroundColor(data, w, h);

  // If bg coverage < 5% → complex photo, don't destroy it
  if (bg.coverage < 0.05) return out;

  const distSq = (r: number, g: number, b: number) =>
    (r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2;
  const thresholdSq = threshold * threshold;

  let fgCount = 0;
  let bgCount = 0;

  for (let i = 0; i < od.length; i += 4) {
    const r = od[i];
    const g = od[i + 1];
    const b = od[i + 2];
    const a = od[i + 3];

    // Already fully transparent → skip
    if (a === 0) continue;

    if (distSq(r, g, b) <= thresholdSq) {
      // Background pixel → make transparent
      od[i + 3] = 0;
      bgCount++;
    } else {
      fgCount++;
    }
  }

  // If almost everything was "bg" (fg < 10% of total), this isn't a simple bg — revert
  const total = fgCount + bgCount;
  if (total > 0 && fgCount / total < 0.1) {
    return imageData;
  }

  return out;
}

/**
 * Post-process SVG to strip any full-bleed black/white background rects
 * that vtrace might add. Also removes solid-color full-viewport fills
 * matching the detected background.
 */
function stripBlackPlate(svg: string): string {
  let result = svg;

  // Remove full-bleed solid black rect fills (vtrace artifact)
  // Match: <rect ... fill="#000" ... width="W" height="H" .../> covering full viewBox
  result = result.replace(
    /<rect[^>]*fill\s*=\s*["']#?0{3,6}["'][^>]*(?:width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["']|height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'])[^>]*\/>\s*/gi,
    ""
  );

  return result;
}

/** 1px mask dilation to reduce white halo around cutout edges. */
function dilateAlpha(imageData: ImageData, px = 1): ImageData {
  const { data, width: w, height: h } = imageData;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const od = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (od[i + 3] > 0) continue; // already opaque

      // Check neighbors within radius
      let maxAlpha = 0;
      for (let dy = -px; dy <= px; dy++) {
        for (let dx = -px; dx <= px; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const ni = (ny * w + nx) * 4;
          if (data[ni + 3] > maxAlpha) maxAlpha = data[ni + 3];
        }
      }
      if (maxAlpha > 0) {
        // Inherit color from nearest opaque neighbor, set alpha to dilated value
        od[i + 3] = Math.min(255, maxAlpha);
      }
    }
  }

  return out;
}

function normalizeHex(input: string): string {
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  // #RGB → #RRGGBB
  if (hex.length === 4) {
    hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();
  return "#FFFFFF";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/**
 * Fallback for complex photos: fill canvas with custom color, draw image on top.
 * Alpha regions in the source show the custom color through.
 */
function bakeCustomBgUnderImage(
  img: HTMLImageElement,
  w: number,
  h: number,
  hex: string
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const { r, g, b } = hexToRgb(hex);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  return ctx.getImageData(0, 0, w, h);
}

/**
 * Replace detected background pixels with a custom solid color.
 * Same chroma-key match rule as transparent, but writes opaque RGB(hex) + alpha=255.
 * Anti-black-blob: never leaves matched pixels as [0,0,0,0]; all pixels stay opaque.
 */
function replaceBackgroundWithColor(
  imageData: ImageData,
  bg: { r: number; g: number; b: number },
  hex: string,
  threshold = 35
): ImageData {
  const { data, width: w, height: h } = imageData;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const od = out.data;
  const { r: tr, g: tg, b: tb } = hexToRgb(hex);

  const distSq = (r: number, g: number, b: number) =>
    (r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2;
  const thresholdSq = threshold * threshold;

  let fgCount = 0;
  let bgCount = 0;

  for (let i = 0; i < od.length; i += 4) {
    const r = od[i];
    const g = od[i + 1];
    const b = od[i + 2];

    if (distSq(r, g, b) <= thresholdSq) {
      od[i] = tr;
      od[i + 1] = tg;
      od[i + 2] = tb;
      od[i + 3] = 255;
      bgCount++;
    } else {
      fgCount++;
    }
  }

  // If almost everything was "bg" (fg < 10%), this isn't a simple bg — revert
  const total = fgCount + bgCount;
  if (total > 0 && fgCount / total < 0.1) {
    return imageData;
  }

  return out;
}

function postProcessSvg(svg: string, width: number, height: number): string {
  let result = svg;

  const svgTagMatch = result.match(/<svg[^>]*>/);
  if (svgTagMatch) {
    let tag = svgTagMatch[0];

    if (!tag.includes("viewBox")) {
      tag = tag.replace("<svg", `<svg viewBox="0 0 ${width} ${height}"`);
    }
    if (tag.includes("width=")) {
      tag = tag.replace(/width="[^"]*"/, `width="${width}"`);
    } else {
      tag = tag.replace("<svg", `<svg width="${width}"`);
    }
    if (tag.includes("height=")) {
      tag = tag.replace(/height="[^"]*"/, `height="${height}"`);
    } else {
      tag = tag.replace("<svg", `<svg height="${height}"`);
    }

    result = result.replace(svgTagMatch[0], tag);
  }

  return result;
}

function buildPixelSvg(dataUrl: string, width: number, height: number): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <image href="${dataUrl}" width="${width}" height="${height}" preserveAspectRatio="none"/>`,
    `</svg>`,
  ].join("\n");
}

function imageDataToDataUrl(imageData: ImageData, w: number, h: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function runVectorTrace(
  imageData: ImageData,
  width: number,
  height: number,
  quality: QualityLevel
): string {
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions for vector tracing");
  }

  // Check if image has any visible (non-transparent) pixels
  const { data } = imageData;
  let visiblePixels = 0;
  const step = Math.max(4, Math.floor(data.length / 4 / 10000));
  for (let i = 3; i < data.length; i += step * 4) {
    if (data[i] > 0) visiblePixels++;
  }
  if (visiblePixels === 0) {
    throw new Error("Image has no visible content to trace");
  }

  const preset = QUALITY_PRESETS[quality];
  const vtrace = new VTrace(imageData, {
    ...preset.vtraceOptions,
    width,
    height,
  });
  return vtrace.getSVG();
}

function countDistinctColors(imageData: ImageData): number {
  const { data } = imageData;
  const seen = new Set<number>();
  const step = Math.max(4, Math.floor(data.length / 4 / 50000));

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i] >> 3;
    const g = data[i + 1] >> 3;
    const b = data[i + 2] >> 3;
    seen.add((r << 10) | (g << 5) | b);
  }

  return seen.size;
}

async function analyzeAndChoose(file: File): Promise<"pixel" | "vector"> {
  const { img } = await loadImage(file);
  const { w, h } = clampDimension(img.naturalWidth, img.naturalHeight);
  const imageData = drawToCanvas(img, w, h);
  const colors = countDistinctColors(imageData);

  return colors <= 128 ? "vector" : "pixel";
}

export async function convertPngToSvg(
  file: File,
  options?: ConvertOptions
): Promise<ConvertResult> {
  const mode = options?.mode ?? "auto";
  const quality: QualityLevel = options?.quality ?? "standard";
  const background: BackgroundMode = options?.background ?? "preserve";
  const customHex = background === "custom" ? normalizeHex(options?.backgroundColor ?? "#FFFFFF") : undefined;

  validateFile(file);

  const { img, dataUrl } = await loadImage(file);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  const preset = QUALITY_PRESETS[quality];
  const { w: clampedW, h: clampedH } = clampDimension(origW, origH, preset.maxDimension);

  let drawW = clampedW;
  let drawH = clampedH;

  if (preset.doUpscale && clampedW < UPSCALE_THRESHOLD && clampedH < UPSCALE_THRESHOLD) {
    drawW = clampedW * 2;
    drawH = clampedH * 2;
  }

  const chosenMode = mode === "auto" ? await analyzeAndChoose(file) : mode;
  const isTransparent = background === "transparent";
  const isCustom = background === "custom";

  if (chosenMode === "pixel") {
    let pixelDataUrl = dataUrl;
    if (isTransparent) {
      const imageData = drawToCanvas(img, drawW, drawH, true);
      const processed = removeBackground(imageData);
      const dilated = dilateAlpha(processed);
      pixelDataUrl = imageDataToDataUrl(dilated, drawW, drawH);
    } else if (isCustom && customHex) {
      const imageData = drawToCanvas(img, drawW, drawH, false);
      const bg = detectBackgroundColor(imageData.data, drawW, drawH);
      const processed = bg.coverage >= 0.05
        ? replaceBackgroundWithColor(imageData, bg, customHex)
        : bakeCustomBgUnderImage(img, drawW, drawH, customHex);
      pixelDataUrl = imageDataToDataUrl(processed, drawW, drawH);
    }
    const svg = buildPixelSvg(pixelDataUrl, drawW, drawH);
    return {
      svg,
      modeUsed: "pixel",
      qualityUsed: quality,
      backgroundUsed: background,
      backgroundColorUsed: customHex,
      width: drawW,
      height: drawH,
      originalSize: file.size,
      outputSize: new Blob([svg]).size,
    };
  }

  const imageData = drawToCanvas(img, drawW, drawH, isTransparent);
  let processedImageData: ImageData;
  if (isTransparent) {
    processedImageData = removeBackground(imageData);
  } else if (isCustom && customHex) {
    const bg = detectBackgroundColor(imageData.data, drawW, drawH);
    processedImageData = bg.coverage >= 0.05
      ? replaceBackgroundWithColor(imageData, bg, customHex)
      : bakeCustomBgUnderImage(img, drawW, drawH, customHex);
  } else {
    processedImageData = imageData;
  }

  try {
    const svg = runVectorTrace(processedImageData, drawW, drawH, quality);
    const cleaned = stripBlackPlate(svg);
    const processed = postProcessSvg(cleaned, drawW, drawH);
    const outputSize = new Blob([processed]).size;

    if (outputSize > file.size * VECTOR_SIZE_RATIO_LIMIT) {
      let fallbackDataUrl = dataUrl;
      if (isTransparent) {
        const fbData = drawToCanvas(img, drawW, drawH, true);
        const fbProcessed = removeBackground(fbData);
        const fbDilated = dilateAlpha(fbProcessed);
        fallbackDataUrl = imageDataToDataUrl(fbDilated, drawW, drawH);
      } else if (isCustom && customHex) {
        fallbackDataUrl = imageDataToDataUrl(processedImageData, drawW, drawH);
      }
      const fallbackSvg = buildPixelSvg(fallbackDataUrl, drawW, drawH);
      return {
        svg: fallbackSvg,
        modeUsed: "pixel",
        qualityUsed: quality,
        backgroundUsed: background,
        backgroundColorUsed: customHex,
        width: drawW,
        height: drawH,
        originalSize: file.size,
        outputSize: new Blob([fallbackSvg]).size,
      };
    }

    return {
      svg: processed,
      modeUsed: "vector",
      qualityUsed: quality,
      backgroundUsed: background,
      backgroundColorUsed: customHex,
      width: drawW,
      height: drawH,
      originalSize: file.size,
      outputSize,
    };
  } catch {
    let fallbackDataUrl = dataUrl;
    if (isTransparent) {
      const fbData = drawToCanvas(img, drawW, drawH, true);
      const fbProcessed = removeBackground(fbData);
      const fbDilated = dilateAlpha(fbProcessed);
      fallbackDataUrl = imageDataToDataUrl(fbDilated, drawW, drawH);
    } else if (isCustom && customHex) {
      fallbackDataUrl = imageDataToDataUrl(processedImageData, drawW, drawH);
    }
    const fallbackSvg = buildPixelSvg(fallbackDataUrl, drawW, drawH);
    return {
      svg: fallbackSvg,
      modeUsed: "pixel",
      qualityUsed: quality,
      backgroundUsed: background,
      backgroundColorUsed: customHex,
      width: drawW,
      height: drawH,
      originalSize: file.size,
      outputSize: new Blob([fallbackSvg]).size,
    };
  }
}

export { ACCEPTED_TYPES, ACCEPTED_EXTENSIONS, MAX_FILE_SIZE };
