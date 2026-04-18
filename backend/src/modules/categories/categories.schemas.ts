import { z } from "zod";

const trimmedString = z.string().trim();

const nullableUrl = z
  .union([trimmedString.url(), z.literal("")])
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const categoryPayloadSchema = z.strictObject({
  name: trimmedString.min(2).max(80),
  image_url: nullableUrl,
});

export const categoryIdSchema = z.object({
  id: trimmedString.uuid(),
});
