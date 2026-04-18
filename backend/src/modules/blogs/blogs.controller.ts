import type { Request, Response } from "express";
import { ok } from "../../lib/http.js";
import { parseWithSchema } from "../../lib/validation.js";
import { blogListQuerySchema } from "./blogs.schemas.js";
import {
  createBlogForAdmin,
  deleteBlogForAdmin,
  getBlogById,
  getBlogs,
  updateBlogForAdmin,
} from "./blogs.service.js";

export const list = async (req: Request, res: Response): Promise<void> => {
  const query = parseWithSchema(
    blogListQuerySchema,
    req.query,
    "Invalid blog list query",
  );

  ok(
    res,
    await getBlogs(query.limit, query.offset),
  );
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  ok(res, await getBlogById(String(req.params.id)));
};

export const create = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await createBlogForAdmin(req, req.body);
  ok(res, { status: "ok" });
};

export const update = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await updateBlogForAdmin(req, String(req.params.id), req.body);
  ok(res, { status: "ok" });
};

export const remove = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await deleteBlogForAdmin(req, String(req.params.id));
  ok(res, { status: "ok" });
};
