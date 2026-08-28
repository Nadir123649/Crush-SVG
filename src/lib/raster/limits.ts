import "server-only";

export const RASTER_LIMITS = {
  /** Max upload size accepted for vectorization (bytes). */
  MAX_UPLOAD_BYTES: 12 * 1024 * 1024,
  /** Hard cap on total pixels processed inline (width * height). */
  MAX_PIXELS_INLINE: 12_000_000,
  /** Higher cap for queued (full-quality) jobs. */
  MAX_PIXELS_QUEUED: 40_000_000,
  /** Largest dimension allowed on input. */
  MAX_DIMENSION: 8000,
  /** Smallest dimension allowed (avoid degenerate inputs). */
  MIN_DIMENSION: 8,
  /** Max produced SVG size (bytes) before we reject as runaway. */
  MAX_SVG_BYTES: 16 * 1024 * 1024,
  /** Inline vectorization wall-clock budget (ms). */
  TIMEOUT_MS_INLINE: 25_000,
  /** Queued vectorization wall-clock budget (ms). */
  TIMEOUT_MS_QUEUED: 110_000,
} as const;

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);
const GIF_SIG_87 = Buffer.from("GIF87a");
const GIF_SIG_89 = Buffer.from("GIF89a");
const BMP_SIG = Buffer.from("BM");

export type AcceptedImageType = "png" | "jpeg" | "gif" | "bmp";

export function sniffImageType(buffer: Buffer): AcceptedImageType | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIG)) return "png";
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG_SIG)) return "jpeg";
  if (buffer.length >= 6 && (buffer.subarray(0, 6).equals(GIF_SIG_87) || buffer.subarray(0, 6).equals(GIF_SIG_89)))
    return "gif";
  if (buffer.length >= 2 && buffer.subarray(0, 2).equals(BMP_SIG)) return "bmp";
  return null;
}

export function isAcceptedImage(buffer: Buffer): boolean {
  return sniffImageType(buffer) !== null;
}
