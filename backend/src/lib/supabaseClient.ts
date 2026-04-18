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

export const createPublicClient = (): SupabaseClient =>
  createBaseClient();

export const createAuthClient = (): SupabaseClient =>
  createBaseClient();

export const createUserClient = (
  accessToken: string,
): SupabaseClient => createBaseClient(accessToken);
