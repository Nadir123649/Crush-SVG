import { z } from "zod";
import { MAX_OUTPUT_SIZE } from "@/lib/svg/svg-dims";

export const convertSchema = z.object({
    svg: z.string().min(1, "SVG content is required").max(10 * 1024 * 1024, "SVG content too large. Maximum size is 10MB."),
    format: z
        .enum(["png"], { message: "Unsupported format. Currently supported: [png]" })
        .default("png"),
    width: z.number().int().min(1).max(MAX_OUTPUT_SIZE, `Width must be between 1 and ${MAX_OUTPUT_SIZE} px`).optional(),
    height: z.number().int().min(1).max(MAX_OUTPUT_SIZE, `Height must be between 1 and ${MAX_OUTPUT_SIZE} px`).optional(),
    scale: z
        .number()
        .min(0.1, "Scale must be between 0.1x and 16x")
        .max(16, "Scale must be between 0.1x and 16x")
        .default(2),
    transparent: z.boolean().default(true),
    bgOption: z.enum(["Transparent", "White", "Black", "Custom"]).optional(),
    bgColor: z.string().optional(),
    quality: z.number().int().min(1).max(100).default(90),
});

export type ConvertInput = z.infer<typeof convertSchema>;
