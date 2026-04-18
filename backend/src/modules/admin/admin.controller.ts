import type { Request, Response } from "express";
import { ok } from "../../lib/http.js";
import { loadAdminStats } from "./admin.service.js";

export const stats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  ok(res, await loadAdminStats(req));
};
