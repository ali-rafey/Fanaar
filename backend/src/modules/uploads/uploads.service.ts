import { createReadStream } from "node:fs";
import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { finished } from "node:stream/promises";
import Busboy from "busboy";
import type { Request } from "express";
import { HttpError } from "../../lib/http.js";
import { env } from "../../config/env.js";
import { uploadPathSchema } from "./uploads.schemas.js";

const allowedUploadMimeTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

interface ParsedUpload {
  mimeType: string;
  path: string;
  tempFilePath: string;
}

const cleanupTempFile = async (tempFilePath: string | null): Promise<void> => {
  if (!tempFilePath) {
    return;
  }

  await rm(tempFilePath, { force: true }).catch(() => undefined);
};

const parseUploadRequest = async (req: Request): Promise<ParsedUpload> => {
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new HttpError(400, "Content-Type must be multipart/form-data");
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fields: 8,
      fileSize: env.MAX_UPLOAD_BYTES,
    },
  });

  let uploadPath: string | null = null;
  let mimeType: string | null = null;
  let tempFilePath: string | null = null;
  let fileWritePromise: Promise<void> | null = null;
  let fileTooLarge = false;

  busboy.on("field", (fieldName, value) => {
    if (fieldName === "path") {
      uploadPath = value;
    }
  });

  busboy.on("file", (fieldName, file, info) => {
    if (fieldName !== "file") {
      file.resume();
      return;
    }

    mimeType = info.mimeType;
    tempFilePath = join(tmpdir(), `fanaar-upload-${randomUUID()}`);
    const writeStream = createWriteStream(tempFilePath);

    file.on("limit", () => {
      fileTooLarge = true;
      writeStream.destroy();
    });

    file.pipe(writeStream);
    fileWritePromise = finished(writeStream).catch((error: unknown) => {
      if (fileTooLarge) {
        return;
      }

      throw error;
    });
  });

  const completion = new Promise<void>((resolve, reject) => {
    busboy.on("error", reject);
    busboy.on("finish", resolve);
  });

  try {
    req.pipe(busboy);
    await completion;
    await fileWritePromise;

    if (fileTooLarge) {
      throw new HttpError(413, "Uploaded file exceeds the 10MB limit");
    }

    if (!uploadPath) {
      throw new HttpError(400, "Missing path");
    }

    if (!mimeType || !tempFilePath) {
      throw new HttpError(400, "Missing file");
    }

    const parsedPath = uploadPathSchema.safeParse(uploadPath);
    if (!parsedPath.success) {
      throw new HttpError(400, "Invalid path", {
        details: parsedPath.error.flatten(),
      });
    }

    if (!allowedUploadMimeTypes.has(mimeType)) {
      throw new HttpError(400, "Unsupported file type");
    }

    return {
      mimeType,
      path: parsedPath.data,
      tempFilePath,
    };
  } catch (error) {
    await cleanupTempFile(tempFilePath);
    throw error;
  }
};

export const uploadAdminAsset = async (
  req: Request,
): Promise<{ publicUrl: string }> => {
  const parsedUpload = await parseUploadRequest(req);

  try {
    const { error } = await req.auth!.supabase.storage
      .from(env.UPLOAD_BUCKET)
      .upload(parsedUpload.path, createReadStream(parsedUpload.tempFilePath), {
        cacheControl: "31536000",
        contentType: parsedUpload.mimeType,
        upsert: true,
      });

    if (error) {
      throw new HttpError(400, error.message, {
        details: error,
      });
    }

    const { data } = req.auth!.supabase.storage
      .from(env.UPLOAD_BUCKET)
      .getPublicUrl(parsedUpload.path);

    return {
      publicUrl: data.publicUrl,
    };
  } finally {
    await cleanupTempFile(parsedUpload.tempFilePath);
  }
};
