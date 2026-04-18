import type { NextFunction, Request, Response } from "express";
import { asyncHandler, HttpError } from "../lib/http.js";
import { requireAdminSession } from "../modules/auth/auth.service.js";

export const requireAdmin = asyncHandler(
  async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await requireAdminSession(req);
    next();
  },
);

export const requireAuthToken = (
  value: string | null,
  message: string,
): string => {
  if (!value) {
    throw new HttpError(401, message);
  }

  return value;
};
