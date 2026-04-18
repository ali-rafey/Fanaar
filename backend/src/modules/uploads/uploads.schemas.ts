import { z } from "zod";

export const uploadPathSchema = z
  .string()
  .trim()
  .min(3)
  .max(160)
  .regex(/^[a-z0-9/_-]+\.[a-z0-9]+$/i)
  .refine((value) => !value.startsWith("/"), "Path cannot start with /")
  .refine((value) => !value.includes(".."), "Path cannot contain ..");
