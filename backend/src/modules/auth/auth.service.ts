import type { Request, Response } from "express";
import { createAuthClient, createUserClient } from "../../lib/supabaseClient.js";
import { HttpError } from "../../lib/http.js";
import { env, isProduction } from "../../config/env.js";
import { getUserFromToken, isAdminUser } from "./auth.repository.js";

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInPayload {
  redirectTo?: string;
}

const parseCookieHeader = (value: string | undefined): Record<string, string> => {
  if (!value) {
    return {};
  }

  return value.split(";").reduce<Record<string, string>>((cookies, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) {
      return cookies;
    }

    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
};

export const getRefreshToken = (req: Request): string | null => {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[env.REFRESH_COOKIE_NAME] ?? null;
};

export const setRefreshCookie = (
  res: Response,
  refreshToken: string,
  maxAgeSeconds?: number,
): void => {
  const parts = [
    `${env.REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`,
    "Path=/",
    "HttpOnly",
    isProduction ? "SameSite=None" : "SameSite=Lax",
  ];

  if (isProduction) {
    parts.push("Secure");
  }

  if (maxAgeSeconds) {
    parts.push(`Max-Age=${Math.floor(maxAgeSeconds)}`);
  }

  res.setHeader("Set-Cookie", parts.join("; "));
};

export const clearRefreshCookie = (res: Response): void => {
  const parts = [
    `${env.REFRESH_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    isProduction ? "SameSite=None" : "SameSite=Lax",
  ];

  if (isProduction) {
    parts.push("Secure");
  }

  res.setHeader("Set-Cookie", parts.join("; "));
};

export const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const assertAdminSession = async (accessToken: string) => {
  const userClient = createUserClient(accessToken);
  const user = await getUserFromToken(userClient, accessToken);
  const admin = await isAdminUser(userClient, user.id);

  if (!admin) {
    throw new HttpError(403, "Forbidden");
  }

  return {
    user,
    supabase: userClient,
  };
};

export const signInAdmin = async (payload: SignInPayload) => {
  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword(payload);

  if (error || !data.session?.access_token || !data.user) {
    throw new HttpError(401, error?.message ?? "Invalid credentials");
  }

  await assertAdminSession(data.session.access_token);

  return {
    token: data.session.access_token,
    user: data.user,
    refreshToken: data.session.refresh_token ?? null,
    expiresIn: data.session.expires_in,
  };
};

export const signUpAdmin = async (payload: SignUpPayload) => {
  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: payload.redirectTo
      ? { emailRedirectTo: payload.redirectTo }
      : undefined,
  });

  if (error) {
    throw new HttpError(400, error.message);
  }

  return {
    user: data.user,
    session: data.session,
  };
};

export const refreshAdminSession = async (refreshToken: string) => {
  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session?.access_token) {
    throw new HttpError(401, error?.message ?? "Invalid refresh token");
  }

  const { user } = await assertAdminSession(data.session.access_token);

  return {
    token: data.session.access_token,
    user,
    refreshToken: data.session.refresh_token ?? null,
    expiresIn: data.session.expires_in,
  };
};

export const getAdminSession = async (accessToken: string) => {
  const { user } = await assertAdminSession(accessToken);
  return {
    user,
    isAdmin: true,
  };
};

export const requireAdminSession = async (
  req: Request,
): Promise<void> => {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    throw new HttpError(401, "Unauthorized");
  }

  const { user, supabase } = await assertAdminSession(accessToken);
  req.auth = {
    accessToken,
    user,
    supabase,
  };
};
