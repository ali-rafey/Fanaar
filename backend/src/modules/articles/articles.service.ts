import { env } from "../../config/env.js";
import { createPublicClient } from "../../lib/supabaseClient.js";
import type { Request } from "express";
import type {
  ArticleRow,
  Database,
  FabricSpecRow,
} from "../../types/database.js";
import {
  createArticle,
  deleteArticle,
  getArticleById,
  getArticleSpecs,
  listAdminSpecs,
  listArticles,
  updateArticle,
  updateSpec,
  upsertSpecs,
} from "./articles.repository.js";

interface ArticleListFilters {
  category?: string;
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

type ArticlePayload = Database["public"]["Tables"]["articles"]["Insert"];
type SpecsPayload = Database["public"]["Tables"]["fabric_specs"]["Update"];

export const getArticles = async (
  filters: ArticleListFilters,
): Promise<ArticleRow[]> =>
  listArticles(createPublicClient(), {
    category: filters.category,
    inStock: filters.inStock,
    limit: filters.limit ?? env.DEFAULT_ARTICLE_LIMIT,
    offset: filters.offset ?? 0,
  });

export const getArticle = async (id: string): Promise<ArticleRow | null> =>
  getArticleById(createPublicClient(), id);

export const getSpecs = async (id: string): Promise<FabricSpecRow | null> =>
  getArticleSpecs(createPublicClient(), id);

export const createArticleForAdmin = async (
  req: Request,
  payload: ArticlePayload,
): Promise<ArticleRow> => createArticle(req.auth!.supabase, payload);

export const updateArticleForAdmin = async (
  req: Request,
  id: string,
  payload: Database["public"]["Tables"]["articles"]["Update"],
): Promise<void> => updateArticle(req.auth!.supabase, id, payload);

export const deleteArticleForAdmin = async (
  req: Request,
  id: string,
): Promise<void> => deleteArticle(req.auth!.supabase, id);

export const upsertSpecsForAdmin = async (
  req: Request,
  articleId: string,
  payload: SpecsPayload,
): Promise<FabricSpecRow> => upsertSpecs(req.auth!.supabase, articleId, payload);

export const getAdminSpecs = async (
  req: Request,
) => listAdminSpecs(req.auth!.supabase);

export const updateAdminSpec = async (
  req: Request,
  id: string,
  payload: SpecsPayload,
): Promise<void> => updateSpec(req.auth!.supabase, id, payload);
