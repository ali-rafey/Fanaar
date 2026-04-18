import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthContext {
  accessToken: string;
  user: User;
  supabase: SupabaseClient;
}
