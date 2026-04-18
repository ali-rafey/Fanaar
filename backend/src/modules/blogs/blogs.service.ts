import { env } from "../../config/env.js";
import { createPublicClient } from "../../lib/supabaseClient.js";
import type { Request } from "express";
import type { BlogRow, Database } from "../../types/database.js";
import {
  createBlog,
  deleteBlog,
  getBlog,
  listBlogs,
  updateBlog,
} from "./blogs.repository.js";

type BlogPayload = Database["public"]["Tables"]["blogs"]["Insert"];

export const getBlogs = async (limit?: number, offset?: number): Promise<BlogRow[]> =>
  listBlogs(
    createPublicClient(),
    limit ?? env.DEFAULT_BLOG_LIMIT,
    offset ?? 0,
  );

export const getBlogById = async (id: string): Promise<BlogRow | null> =>
  getBlog(createPublicClient(), id);

export const createBlogForAdmin = async (
  req: Request,
  payload: BlogPayload,
): Promise<void> => createBlog(req.auth!.supabase, payload);

export const updateBlogForAdmin = async (
  req: Request,
  id: string,
  payload: Database["public"]["Tables"]["blogs"]["Update"],
): Promise<void> => updateBlog(req.auth!.supabase, id, payload);

export const deleteBlogForAdmin = async (
  req: Request,
  id: string,
): Promise<void> => deleteBlog(req.auth!.supabase, id);
