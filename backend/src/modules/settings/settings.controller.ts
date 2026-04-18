import type { Request, Response } from "express";
import { ok } from "../../lib/http.js";
import { parseWithSchema } from "../../lib/validation.js";
import { settingsQuerySchema } from "./settings.schemas.js";
import {
  getHomePayload,
  getSettings,
  updateSettingForAdmin,
} from "./settings.service.js";

export const list = async (req: Request, res: Response): Promise<void> => {
  const query = parseWithSchema(
    settingsQuerySchema,
    req.query,
    "Invalid settings query",
  );
  ok(res, await getSettings(query.keys));
};

export const home = async (_req: Request, res: Response): Promise<void> => {
  const payload = await getHomePayload();
  res.setHeader("Cache-Control", payload.cacheControl);
  ok(res, {
    categories: payload.categories,
    blogs: payload.blogs,
    hero_media: payload.hero_media,
    hero_video_url: payload.hero_video_url,
    hero_image_url: payload.hero_image_url,
    hero_video_focus_x: payload.hero_video_focus_x,
    hero_video_focus_y: payload.hero_video_focus_y,
    process_section: payload.process_section,
  });
};

export const update = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await updateSettingForAdmin(req, String(req.params.key), req.body);
  ok(res, { status: "ok" });
};
