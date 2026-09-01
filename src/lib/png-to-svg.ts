import { VTrace, type VTraceOptions } from "@buzz-dee/vtrace";

export type ConvertMode = "auto" | "pixel" | "vector";

export interface ConvertResult {
  svg: string;
  modeUsed: "pixel" | "vector";
  width: number;
  height: number;
  originalSize: number;
  outputSize: number;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2000;

const VECTOR_OPTIONS: VTraceOptions = {
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
};

const VECTOR_SIZE_RATIO_LIMIT = 2.5;

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

function clampDimension(w: number, h: number): { w: number; h: number } {
  if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) return { w, h };
  const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

function drawToCanvas(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return ctx.getImageData(0, 0, targetW, targetH);
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

function runVectorTrace(imageData: ImageData, width: number, height: number): string {
  const vtrace = new VTrace(imageData, {
    ...VECTOR_OPTIONS,
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
  mode: ConvertMode = "auto"
): Promise<ConvertResult> {
  validateFile(file);

  const { img, dataUrl } = await loadImage(file);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;
  const { w: drawW, h: drawH } = clampDimension(origW, origH);

  const chosenMode = mode === "auto" ? await analyzeAndChoose(file) : mode;

  if (chosenMode === "pixel") {
    const svg = buildPixelSvg(dataUrl, drawW, drawH);
    return {
      svg,
      modeUsed: "pixel",
      width: drawW,
      height: drawH,
      originalSize: file.size,
      outputSize: new Blob([svg]).size,
    };
  }

  const imageData = drawToCanvas(img, drawW, drawH);

  try {
    const svg = runVectorTrace(imageData, drawW, drawH);
    const processed = postProcessSvg(svg, drawW, drawH);
    const outputSize = new Blob([processed]).size;

    if (outputSize > file.size * VECTOR_SIZE_RATIO_LIMIT) {
      const fallbackSvg = buildPixelSvg(dataUrl, drawW, drawH);
      return {
        svg: fallbackSvg,
        modeUsed: "pixel",
        width: drawW,
        height: drawH,
        originalSize: file.size,
        outputSize: new Blob([fallbackSvg]).size,
      };
    }

    return {
      svg: processed,
      modeUsed: "vector",
      width: drawW,
      height: drawH,
      originalSize: file.size,
      outputSize,
    };
  } catch {
    const fallbackSvg = buildPixelSvg(dataUrl, drawW, drawH);
    return {
      svg: fallbackSvg,
      modeUsed: "pixel",
      width: drawW,
      height: drawH,
      originalSize: file.size,
      outputSize: new Blob([fallbackSvg]).size,
    };
  }
}

export { ACCEPTED_TYPES, ACCEPTED_EXTENSIONS, MAX_FILE_SIZE };
