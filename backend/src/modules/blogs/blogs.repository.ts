import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../lib/http.js";
import type { BlogRow, Database } from "../../types/database.js";

const blogListSelect =
  "id, title, excerpt, tag, image_url, created_at, updated_at";
const blogDetailSelect =
  "id, title, excerpt, content, tag, image_url, created_at, updated_at";

export const listBlogs = async (
  supabase: SupabaseClient,
  limit: number,
  offset: number,
): Promise<BlogRow[]> => {
  const { data, error } = await supabase
    .from("blogs")
    .select(blogListSelect)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new HttpError(500, "Failed to load blogs", {
      details: error,
    });
  }

  return (data ?? []) as BlogRow[];
};

export const getBlog = async (
  supabase: SupabaseClient,
  id: string,
): Promise<BlogRow | null> => {
  const { data, error } = await supabase
    .from("blogs")
    .select(blogDetailSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Failed to load blog", {
      details: error,
    });
  }

  return data as BlogRow | null;
};

export const createBlog = async (
  supabase: SupabaseClient,
  payload: Database["public"]["Tables"]["blogs"]["Insert"],
): Promise<void> => {
  const { error } = await supabase.from("blogs").insert(payload);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};

export const updateBlog = async (
  supabase: SupabaseClient,
  id: string,
  payload: Database["public"]["Tables"]["blogs"]["Update"],
): Promise<void> => {
  const { error } = await supabase.from("blogs").update(payload).eq("id", id);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};

export const deleteBlog = async (
  supabase: SupabaseClient,
  id: string,
): Promise<void> => {
  const { error } = await supabase.from("blogs").delete().eq("id", id);

  if (error) {
    throw new HttpError(400, error.message, {
      details: error,
    });
  }
};
