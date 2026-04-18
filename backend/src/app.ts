import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { corsOptions } from "./middleware/cors.js";
import { errorMiddleware, asyncHandler, ok } from "./lib/http.js";
import { validateBody, parseWithSchema } from "./lib/validation.js";
import { requireAdmin } from "./middleware/auth.js";
import * as authController from "./modules/auth/auth.controller.js";
import { signInSchema, signUpSchema } from "./modules/auth/auth.schemas.js";
import * as adminController from "./modules/admin/admin.controller.js";
import * as categoriesController from "./modules/categories/categories.controller.js";
import {
  categoryIdSchema,
  categoryPayloadSchema,
} from "./modules/categories/categories.schemas.js";
import * as articlesController from "./modules/articles/articles.controller.js";
import {
  articleIdSchema,
  articlePayloadSchema,
  articleSpecsPayloadSchema,
  articleStockSchema,
} from "./modules/articles/articles.schemas.js";
import * as blogsController from "./modules/blogs/blogs.controller.js";
import { blogIdSchema, blogPayloadSchema } from "./modules/blogs/blogs.schemas.js";
import * as settingsController from "./modules/settings/settings.controller.js";
import {
  siteSettingKeySchema,
  siteSettingPayloadSchema,
} from "./modules/settings/settings.schemas.js";
import * as uploadsController from "./modules/uploads/uploads.controller.js";

const app = express();

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use((_, res, next) => {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(express.json({ limit: env.MAX_JSON_BODY_SIZE }));

app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    ok(res, { status: "ok" });
  }),
);

app.get("/categories", asyncHandler(categoriesController.list));
app.post(
  "/auth/sign-in",
  validateBody(signInSchema),
  asyncHandler(authController.signIn),
);
app.post(
  "/auth/sign-up",
  validateBody(signUpSchema),
  asyncHandler(authController.signUp),
);
app.post("/auth/sign-out", asyncHandler(authController.signOut));
app.post("/auth/refresh", asyncHandler(authController.refresh));
app.get("/auth/me", asyncHandler(authController.me));

app.get("/articles", asyncHandler(articlesController.list));
app.get(
  "/articles/:id",
  asyncHandler(async (req, res) => {
    parseWithSchema(articleIdSchema, req.params, "Invalid article id");
    await articlesController.detail(req, res);
  }),
);
app.get(
  "/articles/:id/specs",
  asyncHandler(async (req, res) => {
    parseWithSchema(articleIdSchema, req.params, "Invalid article id");
    await articlesController.detailSpecs(req, res);
  }),
);

app.get("/blogs", asyncHandler(blogsController.list));
app.get(
  "/blogs/:id",
  asyncHandler(async (req, res) => {
    parseWithSchema(blogIdSchema, req.params, "Invalid blog id");
    await blogsController.detail(req, res);
  }),
);

app.get("/site-settings", asyncHandler(settingsController.list));
app.get("/home", asyncHandler(settingsController.home));

app.get("/admin/stats", requireAdmin, asyncHandler(adminController.stats));
app.post(
  "/admin/categories",
  requireAdmin,
  validateBody(categoryPayloadSchema),
  asyncHandler(categoriesController.create),
);
app.put(
  "/admin/categories/:id",
  requireAdmin,
  validateBody(categoryPayloadSchema),
  asyncHandler(async (req, res) => {
    parseWithSchema(categoryIdSchema, req.params, "Invalid category id");
    await categoriesController.update(req, res);
  }),
);
app.delete(
  "/admin/categories/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    parseWithSchema(categoryIdSchema, req.params, "Invalid category id");
    await categoriesController.remove(req, res);
  }),
);

app.post(
  "/admin/articles",
  requireAdmin,
  validateBody(articlePayloadSchema),
  asyncHandler(articlesController.create),
);
app.put(
  "/admin/articles/:id",
  requireAdmin,
  validateBody(articlePayloadSchema),
  asyncHandler(async (req, res) => {
    parseWithSchema(articleIdSchema, req.params, "Invalid article id");
    await articlesController.update(req, res);
  }),
);
app.patch(
  "/admin/articles/:id/stock",
  requireAdmin,
  validateBody(articleStockSchema),
  asyncHandler(async (req, res) => {
    parseWithSchema(articleIdSchema, req.params, "Invalid article id");
    await articlesController.update(req, res);
  }),
);
app.delete(
  "/admin/articles/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    parseWithSchema(articleIdSchema, req.params, "Invalid article id");
    await articlesController.remove(req, res);
  }),
);
app.put(
  "/admin/articles/:id/specs",
  requireAdmin,
  validateBody(articleSpecsPayloadSchema),
  asyncHandler(async (req, res) => {
    parseWithSchema(articleIdSchema, req.params, "Invalid article id");
    await articlesController.upsertAdminSpecs(req, res);
  }),
);
app.get("/admin/specs", requireAdmin, asyncHandler(articlesController.listSpecs));
app.put(
  "/admin/specs/:id",
  requireAdmin,
  validateBody(articleSpecsPayloadSchema),
  asyncHandler(async (req, res) => {
    parseWithSchema(articleIdSchema, req.params, "Invalid spec id");
    await articlesController.updateSpec(req, res);
  }),
);

app.post(
  "/admin/blogs",
  requireAdmin,
  validateBody(blogPayloadSchema),
  asyncHandler(blogsController.create),
);
app.put(
  "/admin/blogs/:id",
  requireAdmin,
  validateBody(blogPayloadSchema),
  asyncHandler(async (req, res) => {
    parseWithSchema(blogIdSchema, req.params, "Invalid blog id");
    await blogsController.update(req, res);
  }),
);
app.delete(
  "/admin/blogs/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    parseWithSchema(blogIdSchema, req.params, "Invalid blog id");
    await blogsController.remove(req, res);
  }),
);

app.put(
  "/admin/site-settings/:key",
  requireAdmin,
  validateBody(siteSettingPayloadSchema),
  asyncHandler(async (req, res) => {
    parseWithSchema(siteSettingKeySchema, req.params, "Invalid site setting key");
    await settingsController.update(req, res);
  }),
);
app.post("/admin/upload", requireAdmin, asyncHandler(uploadsController.upload));

app.use(errorMiddleware);

export default app;
