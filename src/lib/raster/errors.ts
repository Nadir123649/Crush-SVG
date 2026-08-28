import "server-only";

export type RasterErrorCode =
  | "invalid_image"
  | "image_too_large"
  | "image_too_complex"
  | "unsupported_dimensions"
  | "vectorization_timed_out"
  | "vectorization_failed"
  | "svg_invalid";

export interface RasterFailure {
  status: number;
  code: RasterErrorCode;
  message: string;
}

export class RasterConversionError extends Error {
  code: RasterErrorCode;
  status: number;
  constructor(code: RasterErrorCode, message: string, status = 400) {
    super(message);
    this.name = "RasterConversionError";
    this.code = code;
    this.status = status;
  }
}

export function classifyRasterError(error: unknown): RasterFailure {
  if (error instanceof RasterConversionError) {
    return { status: error.status, code: error.code, message: error.message };
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (/timed? ?out|timeout/i.test(msg)) {
    return {
      status: 504,
      code: "vectorization_timed_out",
      message: "Vectorization exceeded the time budget. Try a smaller image or lower quality.",
    };
  }
  return {
    status: 500,
    code: "vectorization_failed",
    message: "Vectorization failed. The image may be corrupt or unsupported.",
  };
}
