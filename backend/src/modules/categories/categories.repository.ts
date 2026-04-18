import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../lib/http.js";
import type { Database } from "../../types/database.js";
import type { CategoryRow } from "../../types/database.js";

const categorySelect = "id, name, image_url, created_at";

export const listCategories = async (
  supabase: SupabaseClient,
): Promise<CategoryRow[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select(categorySelect)
    .order("name");

  if (error) {
    throw new HttpError(500, "Failed to load categories", {
      details: error,
    });
  }

  return data ?? [];
};

export const createCategory = async (
  supabase: SupabaseClient,
  payload: Database["public"]["Tables"]["categories"]["Insert"],
): Promise<void> => {
  const { error } = await supabase.from("categories").insert(payload);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};

export const updateCategory = async (
  supabase: SupabaseClient,
  id: string,
  payload: Database["public"]["Tables"]["categories"]["Update"],
): Promise<void> => {
  const { error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};

export const deleteCategory = async (
  supabase: SupabaseClient,
  id: string,
): Promise<void> => {
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};
