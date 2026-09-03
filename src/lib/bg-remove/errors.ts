import "server-only";

export type BgRemoveErrorCode =
  | "invalid_image"
  | "image_too_large"
  | "unsupported_dimensions"
  | "processing_failed";

export interface BgRemoveFailure {
  status: number;
  code: BgRemoveErrorCode;
  message: string;
}

export class BgRemoveError extends Error {
  code: BgRemoveErrorCode;
  status: number;

  constructor(code: BgRemoveErrorCode, message: string, status = 400) {
    super(message);
    this.name = "BgRemoveError";
    this.code = code;
    this.status = status;
  }
}

export function classifyBgRemoveError(error: unknown): BgRemoveFailure {
  if (error instanceof BgRemoveError) {
    return { status: error.status, code: error.code, message: error.message };
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (/timed? ?out|timeout/i.test(msg)) {
    return {
      status: 504,
      code: "processing_failed",
      message: "Background removal exceeded the time budget. Try a smaller image.",
    };
  }
  if (/out of memory|enomem/i.test(msg)) {
    return {
      status: 400,
      code: "image_too_large",
      message: "Image is too large to process. Try a smaller image.",
    };
  }
  return {
    status: 500,
    code: "processing_failed",
    message: "Background removal failed. The image may be corrupt or unsupported.",
  };
}
