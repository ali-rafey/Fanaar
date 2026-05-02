import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
// Trust the platform proxy (Vercel) so req.ip reflects the real client.
// Required for express-rate-limit to key correctly behind a proxy.
app.set("trust proxy", 1);

// Security headers via helmet. We disable the built-in CSP because this is a
// JSON API consumed cross-origin by the SPA — a strict CSP here is meaningless
// and can break image/video proxying. CSP for the SPA itself is set on the
// frontend host.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(cors(corsOptions));
app.use(express.json({ limit: env.MAX_JSON_BODY_SIZE }));

// Rate limiting. Public GETs get a generous bucket; auth/upload endpoints get
// a much tighter one to deter credential stuffing and abuse.
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 240, // 4 req/sec sustained per IP — comfortable for normal SPA usage
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.path === "/health",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20, // 20 sign-in / sign-up / refresh attempts per 15 min per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use(publicLimiter);

// Cache-Control for public, cacheable GETs. Edge caches (Vercel/CDN) honor
// s-maxage; browsers see max-age=0 so they re-validate. SWR keeps the API
// snappy while content stays reasonably fresh.
const publicCachePaths = new Set([
  "/home",
  "/categories",
  "/articles",
  "/blogs",
  "/site-settings",
]);
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (publicCachePaths.has(req.path) || req.path.startsWith("/articles/") || req.path.startsWith("/blogs/")) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    );
  }
  next();
});

app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    ok(res, { status: "ok" });
  }),
);

app.get("/categories", asyncHandler(categoriesController.list));
app.post(
  "/auth/sign-in",
  authLimiter,
  validateBody(signInSchema),
  asyncHandler(authController.signIn),
);
app.post(
  "/auth/sign-up",
  authLimiter,
  validateBody(signUpSchema),
  asyncHandler(authController.signUp),
);
app.post("/auth/sign-out", asyncHandler(authController.signOut));
app.post("/auth/refresh", authLimiter, asyncHandler(authController.refresh));
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
app.post(
  "/admin/upload",
  uploadLimiter,
  requireAdmin,
  asyncHandler(uploadsController.upload),
);

app.use(errorMiddleware);

export default app;
