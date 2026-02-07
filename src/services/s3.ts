import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  credentials:
    process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY,
        }
      : undefined,
});

export const S3_BUCKET = process.env.S3_BUCKET!;
