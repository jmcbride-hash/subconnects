/**
 * AWS S3 client + presigned-URL helpers.
 *
 * All uploads land in a private bucket. Browsers PUT directly using a presigned URL
 * (no proxying the file through our server). Admins read via presigned GET URLs that
 * expire quickly so document links can't be shared accidentally.
 */

import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY. See .env.example."
    );
  }
  _client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("Missing AWS_S3_BUCKET. See .env.example.");
  return bucket;
}

/** Verification-doc prefixes — never let a caller pick an arbitrary prefix. */
export const UPLOAD_PREFIXES = {
  coi: "coi",
  license: "licenses",
  reference: "references",
  logo: "logos",
} as const;
export type UploadPrefix = keyof typeof UPLOAD_PREFIXES;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export function validateUploadInput(input: {
  prefix: string;
  contentType: string;
  contentLength: number;
}): { ok: true; prefix: UploadPrefix } | { ok: false; error: string } {
  if (!(input.prefix in UPLOAD_PREFIXES)) {
    return { ok: false, error: "Invalid upload type" };
  }
  if (!ALLOWED_MIME.has(input.contentType)) {
    return { ok: false, error: "Unsupported file type. Allowed: PDF, PNG, JPG, HEIC." };
  }
  if (!Number.isFinite(input.contentLength) || input.contentLength <= 0) {
    return { ok: false, error: "Invalid file size" };
  }
  if (input.contentLength > MAX_BYTES) {
    return { ok: false, error: `File too large. Max ${MAX_BYTES / 1024 / 1024}MB.` };
  }
  return { ok: true, prefix: input.prefix as UploadPrefix };
}

/** Build a stable, conflict-free S3 key for a company's upload. */
export function buildUploadKey(opts: {
  prefix: UploadPrefix;
  companyId: string;
  filename: string;
}): string {
  const ts = Date.now();
  const safeName = opts.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${UPLOAD_PREFIXES[opts.prefix]}/${opts.companyId}/${ts}-${safeName}`;
}

export async function getPresignedPut(opts: {
  key: string;
  contentType: string;
}): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: getBucket(),
    Key: opts.key,
    ContentType: opts.contentType,
  });
  return getSignedUrl(getClient(), cmd, { expiresIn: 60 * 5 }); // 5 min
}

export async function getPresignedGet(opts: { key: string; expiresIn?: number }): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: getBucket(),
    Key: opts.key,
  });
  return getSignedUrl(getClient(), cmd, { expiresIn: opts.expiresIn ?? 60 * 10 }); // 10 min default
}

/** Stable internal identifier for storage in verifications.evidence_url. */
export function keyToInternalUrl(key: string): string {
  return `s3://${getBucket()}/${key}`;
}

export function internalUrlToKey(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("s3://")) return null;
  const rest = url.slice("s3://".length);
  const slash = rest.indexOf("/");
  if (slash < 0) return null;
  return rest.slice(slash + 1);
}
