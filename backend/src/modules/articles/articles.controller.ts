import type { Request, Response } from "express";
import { ok } from "../../lib/http.js";
import { parseWithSchema } from "../../lib/validation.js";
import { articleListQuerySchema } from "./articles.schemas.js";
import {
  createArticleForAdmin,
  deleteArticleForAdmin,
  getAdminSpecs,
  getArticle,
  getArticles,
  getSpecs,
  updateAdminSpec,
  updateArticleForAdmin,
  upsertSpecsForAdmin,
} from "./articles.service.js";

export const list = async (req: Request, res: Response): Promise<void> => {
  const query = parseWithSchema(
    articleListQuerySchema,
    req.query,
    "Invalid article list query",
  );

  ok(
    res,
    await getArticles({
      category: query.category,
      inStock: query.in_stock,
      limit: query.limit,
      offset: query.offset,
    }),
  );
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  ok(res, await getArticle(String(req.params.id)));
};

export const detailSpecs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  ok(res, await getSpecs(String(req.params.id)));
};

export const create = async (
  req: Request,
  res: Response,
): Promise<void> => {
  ok(res, await createArticleForAdmin(req, req.body));
};

export const update = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await updateArticleForAdmin(req, String(req.params.id), req.body);
  ok(res, { status: "ok" });
};

export const remove = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await deleteArticleForAdmin(req, String(req.params.id));
  ok(res, { status: "ok" });
};

export const upsertAdminSpecs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  ok(res, await upsertSpecsForAdmin(req, String(req.params.id), req.body));
};

export const listSpecs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  ok(res, await getAdminSpecs(req));
};

export const updateSpec = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await updateAdminSpec(req, String(req.params.id), req.body);
  ok(res, { status: "ok" });
};
