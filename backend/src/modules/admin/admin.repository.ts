import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../lib/http.js";
import type { Database } from "../../types/database.js";

export const getAdminStats = async (
  supabase: SupabaseClient,
): Promise<{
  totalArticles: number;
  inStock: number;
  categories: number;
}> => {
  const [articles, inStock, categories] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("in_stock", true),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  if (articles.error || inStock.error || categories.error) {
    throw new HttpError(500, "Failed to load stats", {
      details: {
        articles: articles.error,
        inStock: inStock.error,
        categories: categories.error,
      },
    });
  }

  return {
    totalArticles: articles.count ?? 0,
    inStock: inStock.count ?? 0,
    categories: categories.count ?? 0,
  };
};
