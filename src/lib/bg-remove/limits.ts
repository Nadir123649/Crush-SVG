import "server-only";

export const BG_REMOVE_LIMITS = {
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
  MAX_PIXELS: 20_000_000,
  MAX_DIMENSION: 8000,
  MIN_DIMENSION: 8,
  TIMEOUT_MS: 30_000,
} as const;

export const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);
const RIFF_SIG = Buffer.from("RIFF");
const WEBP_SIG = Buffer.from("WEBP");

export type AcceptedImageType = "png" | "jpeg" | "webp";

export function sniffImageType(buffer: Buffer): AcceptedImageType | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIG)) return "png";
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG_SIG)) return "jpeg";
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(RIFF_SIG) &&
    buffer.subarray(8, 12).equals(WEBP_SIG)
  )
    return "webp";
  return null;
}

export function isAcceptedImage(buffer: Buffer): boolean {
  return sniffImageType(buffer) !== null;
}
