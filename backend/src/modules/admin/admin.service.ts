import type { Request } from "express";
import { getAdminStats } from "./admin.repository.js";

export const loadAdminStats = async (req: Request) =>
  getAdminStats(req.auth!.supabase);
