import dotenv from "dotenv";

dotenv.config();

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

const allowedOrigins = splitList(
  process.env.ALLOWED_ORIGINS ??
    process.env.CORS_ORIGIN_WHITELIST ??
    defaultAllowedOrigins.join(","),
);

const portValue = Number(process.env.PORT ?? 4000);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

if (!allowedOrigins.length) {
  throw new Error("ALLOWED_ORIGINS must contain at least one origin");
}

export const env = Object.freeze({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  PORT: Number.isFinite(portValue) ? portValue : 4000,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  REFRESH_COOKIE_NAME: "fanaar_admin_refresh",
  HOME_CACHE_CONTROL:
    "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
  ALLOWED_ORIGINS: allowedOrigins,
  MAX_JSON_BODY_SIZE: "2mb",
  MAX_LIST_LIMIT: 100,
  DEFAULT_ARTICLE_LIMIT: 24,
  DEFAULT_BLOG_LIMIT: 12,
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
  UPLOAD_BUCKET: "fabric-images",
});

export const isProduction = env.NODE_ENV === "production";
