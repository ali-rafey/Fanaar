import { z } from "zod";

const trimmedString = z.string().trim();
const optionalPrice = z
  .union([z.number(), z.null()])
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const articleListQuerySchema = z.strictObject({
  category: trimmedString.min(1).max(80).optional(),
  in_stock: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
});

export const articlePayloadSchema = z.strictObject({
  name: trimmedString.min(2).max(160),
  description: trimmedString.max(5000).optional().nullable(),
  category: trimmedString.min(1).max(80),
  price_aed: z.number().nonnegative(),
  price_usd: optionalPrice,
  price_pkr: optionalPrice,
  hero_image_url: z
    .union([trimmedString.url(), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  in_stock: z.boolean(),
});

export const articleStockSchema = z.strictObject({
  in_stock: z.boolean(),
});

export const articleIdSchema = z.object({
  id: trimmedString.uuid(),
});

export const articleSpecsPayloadSchema = z.strictObject({
  gsm: z.number().int().min(1).max(5000),
  tear_strength: trimmedString.min(1).max(120),
  tensile_strength: trimmedString.min(1).max(120),
  dye_class: trimmedString.min(1).max(120),
  thread_count: trimmedString.min(1).max(120),
});
