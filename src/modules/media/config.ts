import { S3Client } from "@aws-sdk/client-s3";

export const s3Config = {
  region: "auto",
  bucket: process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || "",
  accountId: process.env.R2_ACCOUNT_ID || process.env.NEXT_PUBLIC_R2_ACCOUNT_ID || "",
  // Set R2_PUBLIC_URL (e.g. https://pub-xxxx.r2.dev) or R2_CUSTOM_DOMAIN in your .env
  baseUrl: process.env.R2_CUSTOM_DOMAIN 
    ? `https://${process.env.R2_CUSTOM_DOMAIN}`
    : (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "")
};

// Singleton S3 client instance
export const s3Client = new S3Client({
  region: s3Config.region,
  endpoint: `https://${s3Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: (process.env.R2_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID)!,
    secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)!
  }
});
