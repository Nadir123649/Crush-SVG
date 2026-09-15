import JSZip from "jszip";

export interface FaviconItem {
  name: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export interface FaviconPackResult {
  icoBlob: Blob;
  icoDataUrl: string;
  items: FaviconItem[];
  webManifest: string;
  htmlSnippet: string;
  zipBlob: Promise<Blob>;
}

export interface FaviconOptions {
  appName?: string;
  themeColor?: string;
  backgroundColor?: string;
  paddingPercent?: number; // 0 to 40% padding around the icon
  borderRadiusPercent?: number; // 0 to 50% border radius
}

/**
 * Encodes multiple PNG buffers into a valid Windows ICO binary file.
 */
export function createIcoFromPngs(pngBuffers: { width: number; height: number; data: Uint8Array }[]): Blob {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  let currentOffset = headerSize + dirSize;

  let totalSize = headerSize + dirSize;
  for (const png of pngBuffers) {
    totalSize += png.data.length;
  }

  const icoBuffer = new Uint8Array(totalSize);
  const view = new DataView(icoBuffer.buffer);

  // 1. Header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // ICO format type = 1
  view.setUint16(4, count, true); // Number of images

  // 2. Directory Entries
  let dirOffset = headerSize;
  for (const png of pngBuffers) {
    const w = png.width >= 256 ? 0 : png.width;
    const h = png.height >= 256 ? 0 : png.height;

    view.setUint8(dirOffset + 0, w); // Width
    view.setUint8(dirOffset + 1, h); // Height
    view.setUint8(dirOffset + 2, 0); // Palette
    view.setUint8(dirOffset + 3, 0); // Reserved
    view.setUint16(dirOffset + 4, 1, true); // Color planes
    view.setUint16(dirOffset + 6, 32, true); // Bits per pixel
    view.setUint32(dirOffset + 8, png.data.length, true); // Image byte size
    view.setUint32(dirOffset + 12, currentOffset, true); // Offset in file

    // 3. Copy image data
    icoBuffer.set(png.data, currentOffset);
    currentOffset += png.data.length;
    dirOffset += dirEntrySize;
  }

  return new Blob([icoBuffer], { type: "image/x-icon" });
}

/**
 * Loads an SVG or image string/URL onto a canvas at target dimensions and returns PNG/WebP blobs.
 */
export async function renderImageToCanvas(
  imgSource: CanvasImageSource,
  targetWidth: number,
  targetHeight: number,
  paddingPercent: number = 0,
  borderRadiusPercent: number = 0,
  backgroundColor?: string
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2D context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Optional background and clipping path
  if (borderRadiusPercent > 0) {
    const radius = (Math.min(targetWidth, targetHeight) / 2) * (borderRadiusPercent / 50);
    ctx.beginPath();
    ctx.roundRect(0, 0, targetWidth, targetHeight, radius);
    ctx.clip();
  }

  if (backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Draw scaled image with padding
  const padX = targetWidth * (paddingPercent / 100);
  const padY = targetHeight * (paddingPercent / 100);
  const drawW = targetWidth - padX * 2;
  const drawH = targetHeight - padY * 2;

  ctx.drawImage(imgSource, padX, padY, drawW, drawH);
  return canvas;
}

/**
 * Converts a Canvas to a PNG Uint8Array & Blob.
 */
export async function canvasToPngBuffer(canvas: HTMLCanvasElement): Promise<{ data: Uint8Array; blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Failed to export canvas to Blob"));
          return;
        }
        const arrayBuf = await blob.arrayBuffer();
        const data = new Uint8Array(arrayBuf);
        const dataUrl = canvas.toDataURL("image/png");
        resolve({ data, blob, dataUrl });
      },
      "image/png"
    );
  });
}

/**
 * Converts a Canvas to a WebP Blob & DataURL.
 */
export async function canvasToWebP(canvas: HTMLCanvasElement, quality: number = 0.9): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export canvas to WebP"));
          return;
        }
        const dataUrl = canvas.toDataURL("image/webp", quality);
        resolve({ blob, dataUrl });
      },
      "image/webp",
      quality
    );
  });
}

/**
 * Loads an SVG string into an HTMLImageElement safely.
 */
export async function loadSvgImage(svgContent: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to parse SVG into image element"));
    };
    img.src = url;
  });
}

/**
 * Main Favicon Generator: Generates full multi-resolution package from SVG source.
 */
export async function generateFaviconPack(
  svgContent: string,
  options: FaviconOptions = {}
): Promise<FaviconPackResult> {
  const {
    appName = "My App",
    themeColor = "#D94A1E",
    backgroundColor = "transparent",
    paddingPercent = 0,
    borderRadiusPercent = 0,
  } = options;

  const img = await loadSvgImage(svgContent);

  // Standard Target Icon Resolutions
  const sizes = [
    { name: "favicon-16x16.png", width: 16, height: 16, inIco: true },
    { name: "favicon-32x32.png", width: 32, height: 32, inIco: true },
    { name: "favicon-48x48.png", width: 48, height: 48, inIco: true },
    { name: "apple-touch-icon.png", width: 180, height: 180, inIco: false },
    { name: "android-chrome-192x192.png", width: 192, height: 192, inIco: false },
    { name: "android-chrome-512x512.png", width: 512, height: 512, inIco: false },
  ];

  const items: FaviconItem[] = [];
  const icoBuffers: { width: number; height: number; data: Uint8Array }[] = [];

  for (const s of sizes) {
    const canvas = await renderImageToCanvas(
      img,
      s.width,
      s.height,
      paddingPercent,
      borderRadiusPercent,
      backgroundColor
    );
    const { data, blob, dataUrl } = await canvasToPngBuffer(canvas);

    items.push({
      name: s.name,
      blob,
      dataUrl,
      width: s.width,
      height: s.height,
    });

    if (s.inIco) {
      icoBuffers.push({
        width: s.width,
        height: s.height,
        data,
      });
    }
  }

  // Build standard multi-resolution .ico
  const icoBlob = createIcoFromPngs(icoBuffers);
  const icoDataUrl = URL.createObjectURL(icoBlob);

  // Web manifest JSON
  const webManifest = JSON.stringify(
    {
      name: appName,
      short_name: appName,
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      theme_color: themeColor,
      background_color: backgroundColor === "transparent" ? "#ffffff" : backgroundColor,
      display: "standalone",
    },
    null,
    2
  );

  // HTML Head Tags Snippet
  const htmlSnippet = `<!-- Favicon & App Icons generated by CrushSVG -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${themeColor}">`;

  // Asynchronous ZIP generator
  const createZip = async (): Promise<Blob> => {
    const zip = new JSZip();

    // 1. favicon.ico
    const icoArrayBuffer = await icoBlob.arrayBuffer();
    zip.file("favicon.ico", icoArrayBuffer);

    // 2. Individual PNG icons
    for (const item of items) {
      const buf = await item.blob.arrayBuffer();
      zip.file(item.name, buf);
    }

    // 3. Manifest and readme
    zip.file("site.webmanifest", webManifest);
    zip.file(
      "README.txt",
      `CrushSVG Favicon Pack\n===================\n\nPlace all files in your website's root directory (or /public folder in Next.js/Vite).\n\nAdd the following HTML snippet inside your <head> tags:\n\n${htmlSnippet}\n`
    );

    return zip.generateAsync({ type: "blob" });
  };

  return {
    icoBlob,
    icoDataUrl,
    items,
    webManifest,
    htmlSnippet,
    zipBlob: createZip(),
  };
}
