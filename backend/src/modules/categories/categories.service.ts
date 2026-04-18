import { createPublicClient } from "../../lib/supabaseClient.js";
import type { Request } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "./categories.repository.js";
import type { CategoryRow, Database } from "../../types/database.js";

type CategoryPayload = Database["public"]["Tables"]["categories"]["Insert"];

export const getCategories = async (): Promise<CategoryRow[]> =>
  listCategories(createPublicClient());

export const createCategoryForAdmin = async (
  req: Request,
  payload: CategoryPayload,
): Promise<void> => createCategory(req.auth!.supabase, payload);

export const updateCategoryForAdmin = async (
  req: Request,
  id: string,
  payload: Database["public"]["Tables"]["categories"]["Update"],
): Promise<void> => updateCategory(req.auth!.supabase, id, payload);

export const deleteCategoryForAdmin = async (
  req: Request,
  id: string,
): Promise<void> => deleteCategory(req.auth!.supabase, id);
