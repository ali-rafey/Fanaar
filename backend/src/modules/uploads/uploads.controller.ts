import type { Request, Response } from "express";
import { ok } from "../../lib/http.js";
import { uploadAdminAsset } from "./uploads.service.js";

export const upload = async (
  req: Request,
  res: Response,
): Promise<void> => {
  ok(res, await uploadAdminAsset(req));
};
