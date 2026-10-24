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
  fit?: "contain" | "cover";
  smallSizeOptimization?: boolean;
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

export function validatePngAsset(data: Uint8Array, expectedWidth: number, expectedHeight: number): void {
  if (data.byteLength < 24 || !PNG_SIGNATURE.every((byte, index) => data[index] === byte)) {
    throw new Error("Generated PNG is empty or has an invalid signature.");
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (view.getUint32(8, false) !== 13 || String.fromCharCode(...data.subarray(12, 16)) !== "IHDR") {
    throw new Error("Generated PNG has an invalid image header.");
  }
  if (view.getUint32(16, false) !== expectedWidth || view.getUint32(20, false) !== expectedHeight) {
    throw new Error(`Generated PNG dimensions do not match ${expectedWidth}×${expectedHeight}.`);
  }
}

export function validateIcoBytes(data: Uint8Array, expectedSizes: number[]): void {
  if (data.byteLength < 6 || expectedSizes.length === 0) throw new Error("Generated ICO is empty.");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count = view.getUint16(4, true);
  if (view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1 || count !== expectedSizes.length) {
    throw new Error("Generated ICO header is invalid.");
  }
  if (data.byteLength < 6 + count * 16) throw new Error("Generated ICO directory is incomplete.");

  const actualSizes: number[] = [];
  for (let index = 0; index < count; index++) {
    const entry = 6 + index * 16;
    const width = data[entry] || 256;
    const height = data[entry + 1] || 256;
    const length = view.getUint32(entry + 8, true);
    const offset = view.getUint32(entry + 12, true);
    if (width !== height || length < 24 || offset < 6 + count * 16 || offset + length > data.byteLength) {
      throw new Error("Generated ICO contains an invalid image entry.");
    }
    const png = data.subarray(offset, offset + length);
    validatePngAsset(png, width, height);
    actualSizes.push(width);
  }
  if (actualSizes.join(",") !== expectedSizes.join(",")) {
    throw new Error("Generated ICO does not contain the expected icon sizes.");
  }
}

function supportedCssColor(value: string): boolean {
  if (value === "transparent" || /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) return true;
  return typeof CSS !== "undefined" && CSS.supports("color", value);
}

/**
 * Encodes multiple PNG buffers into a valid Windows ICO binary file.
 */
export function createIcoFromPngs(pngBuffers: { width: number; height: number; data: Uint8Array }[]): Blob {
  const count = pngBuffers.length;
  if (count === 0) throw new Error("At least one PNG is required to create an ICO.");
  for (const png of pngBuffers) {
    if (!Number.isInteger(png.width) || !Number.isInteger(png.height) || png.width !== png.height || png.width < 1 || png.width > 256) {
      throw new Error("ICO entries must be square PNG icons between 1px and 256px.");
    }
    validatePngAsset(png.data, png.width, png.height);
  }
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
 * Prepares the SVG string for direct high-DPI rasterization at target resolution
 * by preserving the original viewBox and injecting explicit target dimensions.
 */
export function prepareSvgForResolution(svgContent: string, targetWidth: number, targetHeight: number): string {
  // Find the end of the root start tag without treating `>` inside a quoted
  // attribute (for example an embedded data URI) as the end of the tag.
  let start = 0;
  while (start < svgContent.length) {
    start = svgContent.indexOf("<", start);
    if (start < 0) return svgContent;
    if (svgContent.startsWith("<!--", start)) {
      const commentEnd = svgContent.indexOf("-->", start + 4);
      if (commentEnd < 0) return svgContent;
      start = commentEnd + 3;
      continue;
    }
    if (svgContent.startsWith("<?", start)) {
      const instructionEnd = svgContent.indexOf("?>", start + 2);
      if (instructionEnd < 0) return svgContent;
      start = instructionEnd + 2;
      continue;
    }
    if (/^<!doctype\b/i.test(svgContent.slice(start, start + 10))) {
      let quote = "";
      let subsetDepth = 0;
      let index = start + 2;
      for (; index < svgContent.length; index++) {
        const char = svgContent[index];
        if (quote) {
          if (char === quote) quote = "";
        } else if (char === "\"" || char === "'") {
          quote = char;
        } else if (char === "[") {
          subsetDepth++;
        } else if (char === "]") {
          subsetDepth = Math.max(0, subsetDepth - 1);
        } else if (char === ">" && subsetDepth === 0) {
          break;
        }
      }
      start = index + 1;
      continue;
    }
    break;
  }

  const rootMatch = /^<([\w.-]+:)?svg(?=[\s/>])/i.exec(svgContent.slice(start));
  if (!rootMatch) return svgContent;
  let quote = "";
  let end = start + rootMatch[0].length;
  for (; end < svgContent.length; end++) {
    const char = svgContent[end];
    if (quote) {
      if (char === quote) quote = "";
    } else if (char === "\"" || char === "'") {
      quote = char;
    } else if (char === ">") {
      break;
    }
  }
  if (end >= svgContent.length) return svgContent;

  const originalTag = svgContent.slice(start, end + 1);
  const rootName = rootMatch[0].slice(1);
  const attrs = originalTag.slice(rootMatch[0].length, -1).replace(/\/\s*$/, "");
  const getAttr = (name: string) => {
    const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(attrs);
    return match?.[2];
  };
  const parseLength = (value: string | undefined) => {
    if (!value) return undefined;
    const match = /^\s*(\d+(?:\.\d*)?|\.\d+)(px)?\s*$/i.exec(value);
    const number = match ? Number(match[1]) : NaN;
    return Number.isFinite(number) && number > 0 ? number : undefined;
  };

  let viewBox = getAttr("viewBox");
  if (!viewBox) {
    const width = parseLength(getAttr("width"));
    const height = parseLength(getAttr("height"));
    if (width && height) viewBox = `0 0 ${width} ${height}`;
  }
  // Without a viewBox, changing the viewport can crop SVGs whose coordinates
  // are expressed in CSS pixels. Keep those files untouched and let the image
  // decoder use their intrinsic size.
  if (!viewBox) return svgContent;

  const values = viewBox.trim().split(/[\s,]+/).map(Number);
  if (values.length !== 4 || !values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0) {
    return svgContent;
  }

  // Keep the source viewBox ratio. Setting a square viewport on a rectangular
  // viewBox stretches the artwork before the canvas gets a chance to fit it.
  const aspect = values[2] / values[3];
  const renderWidth = Math.max(1, Math.min(targetWidth, targetHeight * aspect));
  const renderHeight = Math.max(1, renderWidth / aspect);
  const cleanAttrs = attrs
    .replace(/(?:^|\s)width\s*=\s*(?:"[^"]*"|'[^']*')/i, "")
    .replace(/(?:^|\s)height\s*=\s*(?:"[^"]*"|'[^']*')/i, "")
    .replace(/(?:^|\s)viewBox\s*=\s*(?:"[^"]*"|'[^']*')/i, "")
    .trim();
  const selfClosing = /\/\s*>$/.test(originalTag);
  const newTag = `<${rootName}${cleanAttrs ? ` ${cleanAttrs}` : ""} width="${renderWidth}" height="${renderHeight}" viewBox="${viewBox}"${selfClosing ? " />" : ">"}`;

  return `${svgContent.slice(0, start)}${newTag}${svgContent.slice(end + 1)}`;
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
 * Renders an SVG directly from vector source onto a canvas with High-DPI supersampling
 * and aspect ratio preservation (object-fit: contain).
 */
export async function renderSvgToCanvas(
  svgContent: string,
  targetWidth: number,
  targetHeight: number,
  paddingPercent: number = 0,
  borderRadiusPercent: number = 0,
  backgroundColor?: string,
  fit: "contain" | "cover" = "contain",
  smallSizeOptimization = false
): Promise<HTMLCanvasElement> {
  const supersample = smallSizeOptimization && targetWidth <= 48 && targetHeight <= 48 ? 4 : 1;
  const renderW = targetWidth * supersample;
  const renderH = targetHeight * supersample;

  const preparedSvg = prepareSvgForResolution(svgContent, renderW, renderH);
  const img = await loadSvgImage(preparedSvg);

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

  // Draw scaled image with padding while preserving aspect ratio
  const padX = targetWidth * (paddingPercent / 100);
  const padY = targetHeight * (paddingPercent / 100);
  const availW = Math.max(1, targetWidth - padX * 2);
  const availH = Math.max(1, targetHeight - padY * 2);

  const naturalW = img.naturalWidth || img.width || renderW;
  const naturalH = img.naturalHeight || img.height || renderH;
  const scale = fit === "cover"
    ? Math.max(availW / naturalW, availH / naturalH)
    : Math.min(availW / naturalW, availH / naturalH);
  const drawW = naturalW * scale;
  const drawH = naturalH * scale;
  const drawX = padX + (availW - drawW) / 2;
  const drawY = padY + (availH - drawH) / 2;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  return canvas;
}

/**
 * Backward compatibility helper for rendering any canvas image source.
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

  const padX = targetWidth * (paddingPercent / 100);
  const padY = targetHeight * (paddingPercent / 100);
  const availW = Math.max(1, targetWidth - padX * 2);
  const availH = Math.max(1, targetHeight - padY * 2);

  const dimensions = imgSource as {
    naturalWidth?: number;
    naturalHeight?: number;
    width?: number;
    height?: number;
  };
  const naturalW = dimensions.naturalWidth || dimensions.width || availW;
  const naturalH = dimensions.naturalHeight || dimensions.height || availH;
  const aspect = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : 1;

  let drawW = availW;
  let drawH = availH;
  if (drawW / drawH > aspect) {
    drawW = drawH * aspect;
  } else {
    drawH = drawW / aspect;
  }
  const drawX = padX + (availW - drawW) / 2;
  const drawY = padY + (availH - drawH) / 2;

  ctx.drawImage(imgSource, drawX, drawY, drawW, drawH);
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
        try {
          const arrayBuf = await blob.arrayBuffer();
          const data = new Uint8Array(arrayBuf);
          const dataUrl = canvas.toDataURL("image/png");
          resolve({ data, blob, dataUrl });
        } catch (error) {
          reject(error);
        }
      },
      "image/png"
    );
  });
}

/**
 * Converts a Canvas to a WebP Blob & DataURL.
 */
export async function canvasToWebP(canvas: HTMLCanvasElement, quality: number = 0.95): Promise<{ blob: Blob; dataUrl: string }> {
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
 * Main Favicon Generator: Generates full multi-resolution package directly from vector source.
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
    fit = "contain",
    smallSizeOptimization = false,
  } = options;
  const safeBackgroundColor = supportedCssColor(backgroundColor) ? backgroundColor : "transparent";

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
    const canvas = await renderSvgToCanvas(
      svgContent,
      s.width,
      s.height,
      paddingPercent,
      borderRadiusPercent,
      safeBackgroundColor,
      fit,
      smallSizeOptimization
    );
    const { data, blob, dataUrl } = await canvasToPngBuffer(canvas);
    validatePngAsset(data, s.width, s.height);
    if (blob.size === 0 || !dataUrl.startsWith("data:image/png;base64,")) {
      throw new Error(`Failed to create ${s.name}.`);
    }

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
  validateIcoBytes(new Uint8Array(await icoBlob.arrayBuffer()), [16, 32, 48]);
  const icoDataUrl = URL.createObjectURL(icoBlob);

  const themeColorHex = /^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i.test(themeColor) ? themeColor : "#D94A1E";
  const generatedNames = new Set(items.map((item) => item.name));

  // Web manifest JSON
  const webManifest = JSON.stringify(
    {
      name: appName || "My App",
      short_name: (appName || "My App").slice(0, 12),
      icons: items
        .filter((item) => generatedNames.has(item.name) && (item.width === 192 || item.width === 512))
        .map((item) => ({
          src: item.name,
          sizes: `${item.width}x${item.height}`,
          type: "image/png",
          purpose: "any",
        })),
      theme_color: themeColorHex,
      background_color: safeBackgroundColor === "transparent" ? "#ffffff" : safeBackgroundColor,
      display: "standalone",
    },
    null,
    2
  );

  // HTML Head Meta Tag Snippet
  const htmlSnippet = `<!-- Favicon & PWA Icons generated by CrushSVG -->
${["favicon-16x16.png", "favicon-32x32.png", "favicon-48x48.png"]
    .filter((name) => generatedNames.has(name))
    .map((name) => `<link rel="icon" type="image/png" sizes="${name.match(/(\d+)x\d+/)?.[1]}x${name.match(/\d+x(\d+)/)?.[1]}" href="/${name}" />`)
    .join("\n")}
${generatedNames.has("favicon-32x32.png") ? '<link rel="icon" type="image/x-icon" href="/favicon.ico" />' : ""}
${generatedNames.has("apple-touch-icon.png") ? '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />' : ""}
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="${themeColorHex}" />`;

  // Asynchronous zip archive generation
  const zipPromise = (async () => {
    const zip = new JSZip();
    zip.file("favicon.ico", icoBlob);
    for (const item of items) {
      zip.file(item.name, item.blob);
    }
    zip.file("site.webmanifest", webManifest);
    zip.file("favicon-tags.html", htmlSnippet);
    return zip.generateAsync({ type: "blob" });
  })();

  let zipBlob: Blob;
  try {
    zipBlob = await zipPromise;
  } catch (error) {
    URL.revokeObjectURL(icoDataUrl);
    throw error;
  }
  if (zipBlob.size === 0) {
    URL.revokeObjectURL(icoDataUrl);
    throw new Error("Generated favicon package is empty.");
  }

  return {
    icoBlob,
    icoDataUrl,
    items,
    webManifest,
    htmlSnippet,
    zipBlob: Promise.resolve(zipBlob),
  };
}
