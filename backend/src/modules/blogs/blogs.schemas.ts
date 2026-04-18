import { z } from "zod";

const trimmedString = z.string().trim();

export const blogListQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
});

export const blogPayloadSchema = z.strictObject({
  title: trimmedString.min(3).max(200),
  excerpt: trimmedString.max(500).nullable().optional(),
  content: trimmedString.max(25000).nullable().optional(),
  tag: trimmedString.max(80).nullable().optional(),
  image_url: z
    .union([trimmedString.url(), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export const blogIdSchema = z.object({
  id: trimmedString.uuid(),
});
