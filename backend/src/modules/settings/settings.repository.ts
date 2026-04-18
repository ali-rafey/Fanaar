import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../lib/http.js";
import type {
  BlogRow,
  CategoryRow,
  Database,
  SiteSettingRow,
} from "../../types/database.js";

export const getSettingsByKeys = async (
  supabase: SupabaseClient,
  keys: string[],
): Promise<SiteSettingRow[]> => {
  const { data, error } = await supabase
    .from("site_settings")
    .select("id, key, value, media_type, created_at, updated_at")
    .in("key", keys);

  if (error) {
    throw new HttpError(500, "Failed to load site settings", {
      details: error,
    });
  }

  return data ?? [];
};

export const upsertSetting = async (
  supabase: SupabaseClient,
  key: string,
  payload: Database["public"]["Tables"]["site_settings"]["Update"],
): Promise<void> => {
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      {
        key,
        ...payload,
      },
      {
        onConflict: "key",
      },
    );

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};

export const loadHomeData = async (
  supabase: SupabaseClient,
): Promise<{
  categories: CategoryRow[];
  blogs: BlogRow[];
  settings: SiteSettingRow[];
}> => {
  const [categoriesResult, blogsResult, settingsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, image_url, created_at")
      .order("name"),
    supabase
      .from("blogs")
      .select("id, title, excerpt, tag, image_url, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(0, 3),
    supabase
      .from("site_settings")
      .select("id, key, value, media_type, created_at, updated_at")
      .in("key", [
        "hero_media",
        "hero_video_url",
        "hero_image_url",
        "hero_video_focus_x",
        "hero_video_focus_y",
        "process_section",
      ]),
  ]);

  if (categoriesResult.error) {
    throw new HttpError(500, "Failed to load home categories", {
      details: categoriesResult.error,
    });
  }

  if (blogsResult.error) {
    throw new HttpError(500, "Failed to load home blogs", {
      details: blogsResult.error,
    });
  }

  if (settingsResult.error) {
    throw new HttpError(500, "Failed to load home settings", {
      details: settingsResult.error,
    });
  }

  return {
    categories: categoriesResult.data ?? [],
    blogs: (blogsResult.data ?? []) as BlogRow[],
    settings: settingsResult.data ?? [],
  };
};
