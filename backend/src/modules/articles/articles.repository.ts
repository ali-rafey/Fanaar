import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../lib/http.js";
import type {
  ArticleRow,
  Database,
  FabricSpecRow,
} from "../../types/database.js";

const articleSelect =
  "id, name, description, category, price_aed, price_usd, price_pkr, hero_image_url, in_stock, created_at, updated_at";

const fabricSpecsSelect =
  "id, article_id, gsm, tear_strength, tensile_strength, dye_class, thread_count, created_at";

interface ArticleListFilters {
  category?: string;
  inStock?: boolean;
  limit: number;
  offset: number;
}

interface SpecsWithArticle extends FabricSpecRow {
  article?: {
    id: string;
    name: string;
  } | null;
}

export const listArticles = async (
  supabase: SupabaseClient,
  filters: ArticleListFilters,
): Promise<ArticleRow[]> => {
  let query = supabase
    .from("articles")
    .select(articleSelect)
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.inStock !== undefined) {
    query = query.eq("in_stock", filters.inStock);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, "Failed to load articles", {
      details: error,
    });
  }

  return data ?? [];
};

export const getArticleById = async (
  supabase: SupabaseClient,
  id: string,
): Promise<ArticleRow | null> => {
  const { data, error } = await supabase
    .from("articles")
    .select(articleSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Failed to load article", {
      details: error,
    });
  }

  return data;
};

export const getArticleSpecs = async (
  supabase: SupabaseClient,
  articleId: string,
): Promise<FabricSpecRow | null> => {
  const { data, error } = await supabase
    .from("fabric_specs")
    .select(fabricSpecsSelect)
    .eq("article_id", articleId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Failed to load article specs", {
      details: error,
    });
  }

  return data;
};

export const createArticle = async (
  supabase: SupabaseClient,
  payload: Database["public"]["Tables"]["articles"]["Insert"],
): Promise<ArticleRow> => {
  const { data, error } = await supabase
    .from("articles")
    .insert(payload)
    .select(articleSelect)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to create article", {
      details: error,
    });
  }

  return data;
};

export const updateArticle = async (
  supabase: SupabaseClient,
  id: string,
  payload: Database["public"]["Tables"]["articles"]["Update"],
): Promise<void> => {
  const { error } = await supabase.from("articles").update(payload).eq("id", id);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};

export const deleteArticle = async (
  supabase: SupabaseClient,
  id: string,
): Promise<void> => {
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};

export const upsertSpecs = async (
  supabase: SupabaseClient,
  articleId: string,
  payload: Database["public"]["Tables"]["fabric_specs"]["Update"],
): Promise<FabricSpecRow> => {
  const { data, error } = await supabase
    .from("fabric_specs")
    .upsert(
      {
        ...payload,
        article_id: articleId,
      },
      {
        onConflict: "article_id",
      },
    )
    .select(fabricSpecsSelect)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to upsert specs", {
      details: error,
    });
  }

  return data;
};

export const listAdminSpecs = async (
  supabase: SupabaseClient,
): Promise<SpecsWithArticle[]> => {
  const { data, error } = await supabase
    .from("fabric_specs")
    .select(
      `${fabricSpecsSelect}, article:articles(id, name)`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new HttpError(500, "Failed to load specs", {
      details: error,
    });
  }

  return ((data ?? []) as Array<
    FabricSpecRow & {
      article: Array<{ id: string; name: string }> | null;
    }
  >).map((row) => ({
    ...row,
    article: Array.isArray(row.article) ? (row.article[0] ?? null) : row.article,
  }));
};

export const updateSpec = async (
  supabase: SupabaseClient,
  id: string,
  payload: Database["public"]["Tables"]["fabric_specs"]["Update"],
): Promise<void> => {
  const { error } = await supabase
    .from("fabric_specs")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};
