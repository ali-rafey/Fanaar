import { z } from "zod";

const trimmedString = z.string().trim();

export const signInSchema = z.strictObject({
  email: trimmedString.email(),
  password: z.string().min(8).max(128),
});

export const signUpSchema = z.strictObject({
  email: trimmedString.email(),
  password: z.string().min(8).max(128),
  redirectTo: trimmedString.url().optional(),
});
