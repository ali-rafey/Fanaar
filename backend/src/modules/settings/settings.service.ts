import { env } from "../../config/env.js";
import { createPublicClient } from "../../lib/supabaseClient.js";
import type { Request } from "express";
import type { Database } from "../../types/database.js";
import {
  getSettingsByKeys,
  loadHomeData,
  upsertSetting,
} from "./settings.repository.js";

type SiteSettingPayload = Database["public"]["Tables"]["site_settings"]["Update"];

export const getSettings = async (keys: string[]) =>
  getSettingsByKeys(createPublicClient(), keys);

export const updateSettingForAdmin = async (
  req: Request,
  key: string,
  payload: SiteSettingPayload,
): Promise<void> => upsertSetting(req.auth!.supabase, key, payload);

export const getHomePayload = async () => {
  const { categories, blogs, settings } = await loadHomeData(createPublicClient());
  const settingsMap = new Map(settings.map((entry) => [entry.key, entry]));

  let processSection: Array<{ image?: string }> = [];
  try {
    processSection = JSON.parse(
      settingsMap.get("process_section")?.value ?? "[]",
    ) as Array<{ image?: string }>;
  } catch {
    processSection = [];
  }

  return {
    categories,
    blogs,
    hero_media: settingsMap.get("hero_media") ?? null,
    hero_video_url: settingsMap.get("hero_video_url")?.value ?? null,
    hero_image_url: settingsMap.get("hero_image_url")?.value ?? null,
    hero_video_focus_x: settingsMap.get("hero_video_focus_x")?.value ?? null,
    hero_video_focus_y: settingsMap.get("hero_video_focus_y")?.value ?? null,
    process_section: processSection,
    cacheControl: env.HOME_CACHE_CONTROL,
  };
};
