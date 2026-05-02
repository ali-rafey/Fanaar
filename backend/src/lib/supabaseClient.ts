import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { env } from "../config/env.js";

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

const createBaseClient = (
  accessToken?: string,
): SupabaseClient =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: authOptions,
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

// Singleton: anon (public) client is reused across requests. The Supabase JS
// client is stateless w.r.t. queries, so a single shared instance avoids
// re-creating the underlying fetch wiring per request — meaningfully faster on
// hot paths like /home, /categories, /articles.
let publicClientSingleton: SupabaseClient | null = null;

export const createPublicClient = (): SupabaseClient => {
  if (!publicClientSingleton) {
    publicClientSingleton = createBaseClient();
  }
  return publicClientSingleton;
};

// Auth flows (sign-in/sign-up/refresh) need a fresh client to avoid leaking
// auth state between users; keep them per-request.
export const createAuthClient = (): SupabaseClient =>
  createBaseClient();

// User-scoped client: must be per-request (carries that user's bearer token).
export const createUserClient = (
  accessToken: string,
): SupabaseClient => createBaseClient(accessToken);
