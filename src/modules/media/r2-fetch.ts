import crypto from "crypto";

interface R2UploadParams {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  key: string;
  body: Uint8Array;
  contentType: string;
}

interface R2DeleteParams {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  key: string;
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Uint8Array | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Uploads a file buffer to Cloudflare R2 via S3 API using pure web fetch and AWS SigV4.
 * This completely avoids @aws-sdk Node dependencies that invoke fs.readFile on Cloudflare Workers.
 */
export async function putObjectR2({
  accountId,
  bucket,
  accessKeyId,
  secretAccessKey,
  key,
  body,
  contentType,
}: R2UploadParams): Promise<void> {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const encodedKeyPath = key.split("/").map((part) => encodeURIComponent(part)).join("/");
  const requestPath = `/${bucket}/${encodedKeyPath}`;
  const url = `https://${host}${requestPath}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);
  const region = "auto";
  const service = "s3";

  const payloadHash = sha256Hex(body);
  const normalizedContentType = contentType.toLowerCase();

  const canonicalHeaders =
    `content-type:${normalizedContentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest =
    `PUT\n` +
    `${requestPath}\n` +
    `\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${sha256Hex(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = hmacSha256(kSigning, stringToSign).toString("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 ` +
    `Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Host": host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Authorization": authorizationHeader,
    },
    body: body as any,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Cloudflare R2 upload failed (${response.status} ${response.statusText}): ${errorText}`);
  }
}

/**
 * Deletes an object from Cloudflare R2 via S3 API using pure web fetch and AWS SigV4.
 */
export async function deleteObjectR2({
  accountId,
  bucket,
  accessKeyId,
  secretAccessKey,
  key,
}: R2DeleteParams): Promise<void> {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const encodedKeyPath = key.split("/").map((part) => encodeURIComponent(part)).join("/");
  const requestPath = `/${bucket}/${encodedKeyPath}`;
  const url = `https://${host}${requestPath}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);
  const region = "auto";
  const service = "s3";

  const payloadHash = sha256Hex("");

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest =
    `DELETE\n` +
    `${requestPath}\n` +
    `\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${sha256Hex(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = hmacSha256(kSigning, stringToSign).toString("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 ` +
    `Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Host": host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Authorization": authorizationHeader,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Cloudflare R2 delete failed (${response.status} ${response.statusText}): ${errorText}`);
  }
}
