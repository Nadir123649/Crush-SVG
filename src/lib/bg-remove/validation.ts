import "server-only";
import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const bgRemoveScaleSchema = z.coerce
  .number()
  .int()
  .pipe(z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100), z.literal(125), z.literal(150), z.literal(200)]));

export const bgRemoveModeSchema = z.enum(["Transparent", "White", "Black", "Custom"]);

export const bgRemoveOptionsSchema = z
  .object({
    scale: bgRemoveScaleSchema.default(100),
    bgOption: bgRemoveModeSchema.default("Transparent"),
    bgColor: z
      .string()
      .regex(HEX_COLOR, "bgColor must be a hex color like #rrggbb")
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.bgOption === "Custom" && !val.bgColor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bgColor"],
        message: "bgColor is required when bgOption is 'Custom'",
      });
    }
  });

export type BgRemoveOptionsInput = z.input<typeof bgRemoveOptionsSchema>;
export type BgRemoveOptionsParsed = z.output<typeof bgRemoveOptionsSchema>;
