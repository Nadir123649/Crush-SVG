import { VTrace, type VTraceOptions } from "@buzz-dee/vtrace";

/* ── WASM panic detection ─────────────────────────────────────────── */
// visioncortex can panic on extreme colour-cluster workloads.
// A panic aborts the WASM module and is NOT caught by try/catch.
// We detect it via the global error / unhandledrejection events
// and fall back to a pixel-embed SVG so the UI never crashes.

let wasmPanicked = false;

if (typeof window !== "undefined") {
  const onPanic = () => {
    wasmPanicked = true;
  };
  window.addEventListener("error", onPanic);
  window.addEventListener("unhandledrejection", onPanic);
}

export type TracingMode = "auto" | "logo" | "line-art" | "photo";
export type PaletteLevel = "auto" | "8" | "24" | "48";
export type QualityLevel = "low" | "standard" | "high";
export type BackgroundMode = "preserve" | "transparent" | "custom";

export interface ConvertOptions {
  tracingMode?: TracingMode;
  palette?: PaletteLevel;
  quality?: QualityLevel;
  background?: BackgroundMode;
  backgroundColor?: string;
}

export interface ConvertResult {
  svg: string;
  modeUsed: "pixel" | "vector";
  tracingModeUsed: TracingMode;
  resolvedTracingMode: TracingMode;
  paletteUsed: PaletteLevel;
  qualityUsed: QualityLevel;
  backgroundUsed: BackgroundMode;
  backgroundColorUsed?: string;
  advisory?: string;
  width: number;
  height: number;
  originalSize: number;
  outputSize: number;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 2000;
const UPSCALE_THRESHOLD = 1500;
const VECTOR_SIZE_RATIO_LIMIT = 2.5;

/* ── Quality → vtrace knobs ───────────────────────────────────────── */

interface QualityKnobs {
  vtraceOptions: Partial<VTraceOptions>;
  maxDimension: number;
  doUpscale: boolean;
}

const QUALITY_KNOBS: Record<QualityLevel, QualityKnobs> = {
  low: {
    vtraceOptions: {
      filterSpeckle: 10,
      colorPrecision: 6,
      layerDifference: 24,
      cornerThreshold: 75,
      lengthThreshold: 6.0,
      maxIterations: 6,
      pathPrecision: 2,
    },
    maxDimension: 1400,
    doUpscale: false,
  },
  standard: {
    vtraceOptions: {
      filterSpeckle: 4,
      colorPrecision: 8,
      layerDifference: 16,
      cornerThreshold: 60,
      lengthThreshold: 4.0,
      maxIterations: 10,
      pathPrecision: 3,
    },
    maxDimension: 2000,
    doUpscale: true,
  },
  high: {
    vtraceOptions: {
      filterSpeckle: 2,
      colorPrecision: 10,
      layerDifference: 10,
      cornerThreshold: 45,
      lengthThreshold: 2.5,
      maxIterations: 15,
      pathPrecision: 4,
    },
    maxDimension: 2500,
    doUpscale: true,
  },
};

/* ── Image classification ─────────────────────────────────────────── */

function grayLuma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function classifyImage(imageData: ImageData): TracingMode {
  const { data } = imageData;
  const totalPixels = data.length / 4;
  if (totalPixels === 0) return "photo";

  let grayCount = 0;
  let edgeCount = 0;
  const step = Math.max(4, Math.floor(totalPixels / 50000));

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = grayLuma(r, g, b);
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    if (saturation < 20) grayCount++;
  }

  const grayRatio = grayCount / (totalPixels / step);

  // Edge density: compare each pixel with right neighbor
  const edgeStep = Math.max(4, Math.floor(totalPixels / 30000));
  let edgeSamples = 0;
  for (let i = 0; i < data.length - 4 * edgeStep; i += edgeStep * 4) {
    const diff =
      Math.abs(data[i] - data[i + edgeStep * 4]) +
      Math.abs(data[i + 1] - data[i + edgeStep * 4 + 1]) +
      Math.abs(data[i + 2] - data[i + edgeStep * 4 + 2]);
    if (diff > 80) edgeCount++;
    edgeSamples++;
  }
  const edgeDensity = edgeSamples > 0 ? edgeCount / edgeSamples : 0;

  // Line art: mostly grayscale + strong edges (outlines)
  if (grayRatio > 0.80 && edgeDensity > 0.12) return "line-art";

  const distinctColors = countDistinctColors(imageData);
  // Logo: few distinct colors, not mostly gray (has some color)
  if (distinctColors <= 64 && grayRatio <= 0.60) return "logo";

  return "photo";
}

/* ── Preprocessing ─────────────────────────────────────────────────── */

function preprocessGrayscale(imageData: ImageData): ImageData {
  const { data, width: w, height: h } = imageData;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const od = out.data;
  for (let i = 0; i < od.length; i += 4) {
    const luma = Math.round(grayLuma(od[i], od[i + 1], od[i + 2]));
    od[i] = luma;
    od[i + 1] = luma;
    od[i + 2] = luma;
  }
  return out;
}

/* ── Build vtrace options for a given mode + quality ──────────────── */

function buildVtraceOptions(
  mode: TracingMode,
  quality: QualityLevel,
  bgColor: string
): VTraceOptions {
  const base = QUALITY_KNOBS[quality].vtraceOptions;

  switch (mode) {
    case "line-art":
      return {
        colorMode: "binary",
        threshold: VTrace.THRESHOLD_AUTO,
        blackOnWhite: true,
        filterSpeckle: base.filterSpeckle ?? 4,
        pathPrecision: base.pathPrecision ?? 3,
        background: bgColor,
        hierarchical: "stacked",
        mode: "spline",
      };
    case "logo":
      return {
        colorMode: "color",
        colorPrecision: (base.colorPrecision ?? 8) + 1,
        filterSpeckle: Math.max(2, (base.filterSpeckle ?? 4) - 2),
        layerDifference: base.layerDifference ?? 16,
        cornerThreshold: (base.cornerThreshold ?? 60) - 10,
        lengthThreshold: (base.lengthThreshold ?? 4.0) - 1.0,
        maxIterations: (base.maxIterations ?? 10) + 3,
        spliceThreshold: base.spliceThreshold ?? 45,
        pathPrecision: (base.pathPrecision ?? 3) + 1,
        background: bgColor,
        hierarchical: "stacked",
        mode: "spline",
        optCurve: true,
        turdSize: 2,
      };
    case "photo":
      return {
        colorMode: "color",
        colorPrecision: base.colorPrecision ?? 8,
        filterSpeckle: (base.filterSpeckle ?? 4) + 2,
        layerDifference: base.layerDifference ?? 16,
        cornerThreshold: (base.cornerThreshold ?? 60) + 15,
        lengthThreshold: (base.lengthThreshold ?? 4.0) + 2.0,
        maxIterations: (base.maxIterations ?? 10) - 2,
        spliceThreshold: (base.spliceThreshold ?? 45) + 15,
        pathPrecision: base.pathPrecision ?? 3,
        background: bgColor,
        hierarchical: "stacked",
        mode: "spline",
        optCurve: true,
        turdSize: 20,
      };
    case "auto":
    default:
      return {
        colorMode: "color",
        hierarchical: "stacked",
        mode: "spline",
        filterSpeckle: base.filterSpeckle ?? 4,
        colorPrecision: base.colorPrecision ?? 8,
        layerDifference: base.layerDifference ?? 16,
        cornerThreshold: base.cornerThreshold ?? 60,
        lengthThreshold: base.lengthThreshold ?? 4.0,
        maxIterations: base.maxIterations ?? 10,
        spliceThreshold: base.spliceThreshold ?? 45,
        pathPrecision: base.pathPrecision ?? 3,
        background: bgColor,
      };
  }
}

/* ── Helpers ───────────────────────────────────────────────────────── */

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

function detectBackgroundColor(
  data: Uint8ClampedArray,
  w: number,
  h: number
): { r: number; g: number; b: number; coverage: number } {
  const samples: { r: number; g: number; b: number }[] = [];

  const corners = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
  ];
  for (const [x, y] of corners) {
    const i = (y * w + x) * 4;
    samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

  for (let i = 0; i < 8; i++) {
    const t = Math.floor((i + 1) / 9 * (w - 1));
    const ti = (0 * w + t) * 4;
    samples.push({ r: data[ti], g: data[ti + 1], b: data[ti + 2] });
    const bi = ((h - 1) * w + t) * 4;
    samples.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
    const li = (Math.floor(i * (h - 1) / 7) * w + 0) * 4;
    samples.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
    const ri = (Math.floor(i * (h - 1) / 7) * w + (w - 1)) * 4;
    samples.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
  }

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

function removeBackground(
  imageData: ImageData,
  threshold = 35
): ImageData {
  const { data, width: w, height: h } = imageData;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const od = out.data;

  const bg = detectBackgroundColor(data, w, h);
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

    if (a === 0) continue;

    if (distSq(r, g, b) <= thresholdSq) {
      od[i + 3] = 0;
      bgCount++;
    } else {
      fgCount++;
    }
  }

  const total = fgCount + bgCount;
  if (total > 0 && fgCount / total < 0.1) {
    return imageData;
  }

  return out;
}

function stripBlackPlate(svg: string): string {
  return svg.replace(
    /<rect[^>]*fill\s*=\s*["']#?0{3,6}["'][^>]*(?:width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["']|height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'])[^>]*\/>\s*/gi,
    ""
  );
}

function dilateAlpha(imageData: ImageData, px = 1): ImageData {
  const { data, width: w, height: h } = imageData;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const od = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (od[i + 3] > 0) continue;

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
        od[i + 3] = Math.min(255, maxAlpha);
      }
    }
  }

  return out;
}

function normalizeHex(input: string): string {
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
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
  vtraceOptions: VTraceOptions
): string {
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions for vector tracing");
  }

  const { data } = imageData;
  let visiblePixels = 0;
  const step = Math.max(4, Math.floor(data.length / 4 / 10000));
  for (let i = 3; i < data.length; i += step * 4) {
    if (data[i] > 0) visiblePixels++;
  }
  if (visiblePixels === 0) {
    throw new Error("Image has no visible content to trace");
  }

  // Guard: if a previous call already panicked the WASM module, skip entirely
  if (wasmPanicked) {
    throw new Error("Vector engine unavailable — falling back to pixel embed");
  }

  const vtrace = new VTrace(imageData, {
    ...vtraceOptions,
    width,
    height,
  });

  const svg = vtrace.getSVG();

  // Detect if getSVG() triggered a panic (the hook fires synchronously)
  if (wasmPanicked) {
    throw new Error("Vector engine crashed on this image — falling back to pixel embed");
  }

  return svg;
}

function countDistinctColors(imageData: ImageData): number {
  const { data } = imageData;
  const seen = new Set<number>();
  const step = Math.max(4, Math.floor(data.length / 4 / 50000));

  for (let i = 0; i < data.length; i += step * 4) {
    if (data[i + 3] === 0) continue; // skip transparent
    const r = data[i] >> 3;
    const g = data[i + 1] >> 3;
    const b = data[i + 2] >> 3;
    seen.add((r << 10) | (g << 5) | b);
  }

  return seen.size;
}

/* ── Main export ───────────────────────────────────────────────────── */

export async function convertPngToSvg(
  file: File,
  options?: ConvertOptions
): Promise<ConvertResult> {
  const tracingMode: TracingMode = options?.tracingMode ?? "auto";
  const palette: PaletteLevel = options?.palette ?? "auto";
  const quality: QualityLevel = options?.quality ?? "standard";
  const background: BackgroundMode = options?.background ?? "preserve";
  const customHex =
    background === "custom"
      ? normalizeHex(options?.backgroundColor ?? "#FFFFFF")
      : undefined;

  validateFile(file);

  const { img, dataUrl } = await loadImage(file);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  const knobs = QUALITY_KNOBS[quality];
  const { w: clampedW, h: clampedH } = clampDimension(
    origW,
    origH,
    knobs.maxDimension
  );

  let drawW = clampedW;
  let drawH = clampedH;

  if (knobs.doUpscale && clampedW < UPSCALE_THRESHOLD && clampedH < UPSCALE_THRESHOLD) {
    drawW = clampedW * 2;
    drawH = clampedH * 2;
  }

  const isTransparent = background === "transparent";
  const isCustom = background === "custom";

  /* ── Step 1: Draw canvas with background handling ──────────────── */
  const imageData = drawToCanvas(img, drawW, drawH, isTransparent);
  let processedImageData: ImageData;

  if (isTransparent) {
    processedImageData = removeBackground(imageData);
  } else if (isCustom && customHex) {
    const bg = detectBackgroundColor(imageData.data, drawW, drawH);
    processedImageData =
      bg.coverage >= 0.05
        ? replaceBackgroundWithColor(imageData, bg, customHex)
        : bakeCustomBgUnderImage(img, drawW, drawH, customHex);
  } else {
    processedImageData = imageData;
  }

  /* ── Step 2: Resolve tracing mode ──────────────────────────────── */
  let resolvedMode: TracingMode = tracingMode;
  let advisory: string | undefined;

  if (tracingMode === "auto") {
    resolvedMode = classifyImage(processedImageData);
  }

  /* ── Step 3: Mode-specific preprocess ──────────────────────────── */
  let preprocessed = processedImageData;
  if (resolvedMode === "line-art") {
    preprocessed = preprocessGrayscale(processedImageData);
  }

  /* ── Step 4: Build background color for vtrace ─────────────────── */
  const bgColor =
    isTransparent
      ? VTrace.COLOR_TRANSPARENT
      : isCustom && customHex
        ? customHex
        : VTrace.COLOR_TRANSPARENT;

  /* ── Step 5: Build vtrace options ──────────────────────────────── */
  const vtraceOptions = buildVtraceOptions(resolvedMode, quality, bgColor);

  /* ── Step 6: Trace or fallback ─────────────────────────────────── */
  try {
    const svg = runVectorTrace(preprocessed, drawW, drawH, vtraceOptions);
    const cleaned = stripBlackPlate(svg);
    const processed = postProcessSvg(cleaned, drawW, drawH);
    const outputSize = new Blob([processed]).size;

    // Photo fallback: if output is oversized, embed as pixel
    if (resolvedMode === "photo" && outputSize > file.size * VECTOR_SIZE_RATIO_LIMIT) {
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
      advisory = "Photo mode: vector output exceeded size limit, fell back to pixel-embed SVG.";
      return {
        svg: fallbackSvg,
        modeUsed: "pixel",
        tracingModeUsed: tracingMode,
        resolvedTracingMode: resolvedMode,
        paletteUsed: palette,
        qualityUsed: quality,
        backgroundUsed: background,
        backgroundColorUsed: customHex,
        advisory,
        width: drawW,
        height: drawH,
        originalSize: file.size,
        outputSize: new Blob([fallbackSvg]).size,
      };
    }

    return {
      svg: processed,
      modeUsed: "vector",
      tracingModeUsed: tracingMode,
      resolvedTracingMode: resolvedMode,
      paletteUsed: palette,
      qualityUsed: quality,
      backgroundUsed: background,
      backgroundColorUsed: customHex,
      width: drawW,
      height: drawH,
      originalSize: file.size,
      outputSize,
    };
  } catch {
    // Any trace error → pixel fallback
    // buildPixelSvg is pure string concat (no VTrace), so it's safe
    // even if the WASM module has panicked.
    let fallbackDataUrl = dataUrl;
    if (!wasmPanicked) {
      try {
        if (isTransparent) {
          const fbData = drawToCanvas(img, drawW, drawH, true);
          const fbProcessed = removeBackground(fbData);
          const fbDilated = dilateAlpha(fbProcessed);
          fallbackDataUrl = imageDataToDataUrl(fbDilated, drawW, drawH);
        } else if (isCustom && customHex) {
          fallbackDataUrl = imageDataToDataUrl(processedImageData, drawW, drawH);
        }
      } catch {
        // Canvas ops failed — use the original dataUrl
      }
    }
    const fallbackSvg = buildPixelSvg(fallbackDataUrl, drawW, drawH);
    return {
      svg: fallbackSvg,
      modeUsed: "pixel",
      tracingModeUsed: tracingMode,
      resolvedTracingMode: resolvedMode,
      paletteUsed: palette,
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

/**
 * Convert a data-URL string to a File object entirely in-memory.
 * No network request is made (unlike fetch(dataUrl) which can fail
 * due to CSP restrictions, service-worker interception, or quota issues).
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) throw new Error("Invalid data URL — image may be corrupted. Please re-upload.");
  const meta = dataUrl.slice(0, commaIdx);
  const base64 = dataUrl.slice(commaIdx + 1);
  const mime = meta.split(":")[1]?.split(";")[0] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

export { ACCEPTED_TYPES, ACCEPTED_EXTENSIONS, MAX_FILE_SIZE };
