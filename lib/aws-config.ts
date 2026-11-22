import { S3Client } from "@aws-sdk/client-s3";

// Stockage compatible S3 : AWS S3, Cloudflare R2, Scaleway, OVH, MinIO...
// S3_ENDPOINT est optionnel (laisser vide pour AWS).
export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME ?? "",
    folderPrefix: process.env.AWS_FOLDER_PREFIX ?? "",
  };
}

export function createS3Client() {
  const endpoint = process.env.S3_ENDPOINT || undefined;
  return new S3Client({
    region: process.env.AWS_REGION || "eu-west-3",
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}
