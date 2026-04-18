import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { HttpError } from "../../lib/http.js";

export const getUserFromToken = async (
  supabase: SupabaseClient,
  accessToken: string,
): Promise<User> => {
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(401, "Unauthorized");
  }

  return data.user;
};

export const isAdminUser = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    throw new HttpError(403, "Forbidden", {
      details: error,
    });
  }

  return Boolean(data);
};
