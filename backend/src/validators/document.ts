import path from "path";
import crypto from "crypto";

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
]);

export const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

const EXTENSION_MIME_MAP: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": [
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/octet-stream",
  ],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt": [
    "application/vnd.ms-powerpoint",
    "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
  ],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".txt": ["text/plain"],
  ".csv": ["text/csv", "text/plain", "application/csv"],
};

export interface DocumentValidationResult {
  valid: true;
  checksum: string;
}

export interface DocumentValidationError {
  valid: false;
  error: string;
}

export type DocumentValidation =
  | DocumentValidationResult
  | DocumentValidationError;

export function normalizeMimeType(mimeType: string): string {
  return (mimeType.split(";")[0] ?? mimeType).trim();
}

export function validateDocument(
  originalName: string,
  mimeType: string,
  size: number,
  buffer: Buffer
): DocumentValidation {
  const normalizedMimeType = (mimeType.split(";")[0] ?? mimeType).trim();

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (size === 0) {
    return {
      valid: false,
      error: "Empty file is not allowed",
    };
  }

  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(normalizedMimeType)) {
    return {
      valid: false,
      error: `File type "${normalizedMimeType}" is not allowed. Allowed types: PDF, Word, Excel, PowerPoint, images, text, CSV.`,
    };
  }

  const ext = path.extname(originalName).toLowerCase();
  const allowedMimes = EXTENSION_MIME_MAP[ext] ?? null;
  if (!allowedMimes || !allowedMimes.includes(normalizedMimeType)) {
    return {
      valid: false,
      error: "File extension does not match the file content type",
    };
  }

  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

  return {
    valid: true,
    checksum,
  };
}
