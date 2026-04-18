import { z } from "zod";

const trimmedString = z.string().trim();

export const settingsQuerySchema = z.strictObject({
  keys: trimmedString
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
});

export const siteSettingKeySchema = z.object({
  key: z.string().trim().min(1).max(80),
});

export const siteSettingPayloadSchema = z.strictObject({
  value: z.string().max(50000).nullable(),
  media_type: z.string().trim().min(1).max(40).nullable().optional(),
});
