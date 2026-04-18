import type { Request, Response } from "express";
import { ok } from "../../lib/http.js";
import {
  createCategoryForAdmin,
  deleteCategoryForAdmin,
  getCategories,
  updateCategoryForAdmin,
} from "./categories.service.js";

export const list = async (_req: Request, res: Response): Promise<void> => {
  ok(res, await getCategories());
};

export const create = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await createCategoryForAdmin(req, req.body);
  ok(res, { status: "ok" });
};

export const update = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await updateCategoryForAdmin(req, String(req.params.id), req.body);
  ok(res, { status: "ok" });
};

export const remove = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await deleteCategoryForAdmin(req, String(req.params.id));
  ok(res, { status: "ok" });
};
