import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  hint?: string;

  constructor(
    status: number,
    message: string,
    options?: {
      code?: string;
      details?: unknown;
      hint?: string;
    },
  ) {
    super(message);
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
  }
}

export const asyncHandler = (
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
};

export const ok = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json(data);
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return;
  }

  console.error(error);
  const message =
    error instanceof Error ? error.message : "Internal Server Error";
  res.status(500).json({ error: message });
};
