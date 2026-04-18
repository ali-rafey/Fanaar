import type { Request, Response } from "express";
import { HttpError, ok } from "../../lib/http.js";
import {
  clearRefreshCookie,
  getBearerToken,
  getRefreshToken,
  getAdminSession,
  refreshAdminSession,
  setRefreshCookie,
  signInAdmin,
  signUpAdmin,
} from "./auth.service.js";

export const signIn = async (req: Request, res: Response): Promise<void> => {
  const result = await signInAdmin(req.body);

  if (result.refreshToken) {
    setRefreshCookie(res, result.refreshToken, result.expiresIn);
  }

  ok(res, {
    token: result.token,
    user: result.user,
    isAdmin: true,
  });
};

export const signUp = async (req: Request, res: Response): Promise<void> => {
  ok(res, await signUpAdmin(req.body));
};

export const signOut = async (_req: Request, res: Response): Promise<void> => {
  clearRefreshCookie(res);
  ok(res, { status: "ok" });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    clearRefreshCookie(res);
    throw new HttpError(401, "Missing refresh token");
  }

  const result = await refreshAdminSession(refreshToken);

  if (result.refreshToken) {
    setRefreshCookie(res, result.refreshToken, result.expiresIn);
  }

  ok(res, {
    token: result.token,
    user: result.user,
    isAdmin: true,
  });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    throw new HttpError(401, "Unauthorized");
  }

  ok(res, await getAdminSession(accessToken));
};
