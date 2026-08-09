import { S3Client } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

export function getS3Config() {
  const bucket =
    process.env.R2_BUCKET_NAME ||
    process.env.NEXT_PUBLIC_R2_BUCKET_NAME ||
    process.env.AWS_S3_BUCKET ||
    "";
  const accountId =
    process.env.R2_ACCOUNT_ID ||
    process.env.NEXT_PUBLIC_R2_ACCOUNT_ID ||
    "";
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    "";
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    "";
  const customDomain = process.env.R2_CUSTOM_DOMAIN || "";
  const publicUrl =
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://rathagala.lk";

  let baseUrl = "";
  if (publicUrl) {
    baseUrl = publicUrl.replace(/\/$/, "");
  } else if (customDomain) {
    const domainHost = customDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const appHost = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (domainHost === appHost) {
      baseUrl = `${appUrl.replace(/\/$/, "")}/api/media/file`;
    } else {
      baseUrl = `https://${domainHost}`;
    }
  } else {
    baseUrl = `${appUrl.replace(/\/$/, "")}/api/media/file`;
  }

  return {
    region: "auto",
    bucket,
    accountId,
    accessKeyId,
    secretAccessKey,
    baseUrl,
  };
}

export function getS3Client(): S3Client {
  const config = getS3Config();

  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error(
      `Cloudflare R2 storage credentials missing or unconfigured: accountId=${!!config.accountId}, accessKeyId=${!!config.accessKeyId}, secretAccessKey=${!!config.secretAccessKey}`
    );
  }

  return new S3Client({
    region: config.region,
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    requestHandler: new FetchHttpHandler(),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// Proxy for backward compatibility: ensures process.env is read dynamically per request
export const s3Config = new Proxy({} as ReturnType<typeof getS3Config>, {
  get(_target, prop: keyof ReturnType<typeof getS3Config>) {
    return getS3Config()[prop];
  },
});

export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop: keyof S3Client) {
    const client = getS3Client();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
