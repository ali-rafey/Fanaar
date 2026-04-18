import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "./http.js";

export const validateBody = <T>(schema: ZodType<T>): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new HttpError(400, "Invalid request body", {
          details: result.error.flatten(),
        }),
      );
      return;
    }

    req.body = result.data;
    next();
  };
};

export const parseWithSchema = <T>(
  schema: ZodType<T>,
  value: unknown,
  message: string,
): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(400, message, {
      details: result.error.flatten(),
    });
  }
  return result.data;
};
