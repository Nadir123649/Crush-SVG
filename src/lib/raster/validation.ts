import "server-only";
import { z } from "zod";

export const rasterModeSchema = z.enum(["auto", "logo", "line-art", "photo"]);
export const rasterQualitySchema = z.enum(["draft", "standard", "high", "max"]);
export const rasterBackgroundSchema = z.enum(["preserve", "transparent", "custom"]);

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const rasterOptionsSchema = z
  .object({
    mode: rasterModeSchema.default("auto"),
    quality: rasterQualitySchema.default("standard"),
    colorCount: z.coerce.number().int().min(2).max(64).optional(),
    background: rasterBackgroundSchema.default("preserve"),
    bgColor: z
      .string()
      .regex(HEX_COLOR, "bgColor must be a hex color like #rrggbb")
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.background === "custom" && !val.bgColor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bgColor"],
        message: "bgColor is required when background is 'custom'",
      });
    }
  });

export type RasterOptionsInput = z.input<typeof rasterOptionsSchema>;
