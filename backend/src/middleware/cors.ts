import type { CorsOptions } from "cors";
import { HttpError } from "../lib/http.js";
import { env } from "../config/env.js";

const allowedOrigins = new Set(env.ALLOWED_ORIGINS);

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(403, `Origin ${origin} is not allowed by CORS`));
  },
};
