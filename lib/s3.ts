import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false
) {
  const s3 = createS3Client();
  const { bucketName, folderPrefix } = getBucketConfig();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${Date.now()}-${safeName}`
    : `${folderPrefix}uploads/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    ContentDisposition: isPublic ? "attachment" : undefined,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { uploadUrl, cloud_storage_path };
}

export function getFileUrl(cloud_storage_path: string, isPublic = false) {
  if (isPublic) {
    const encoded = cloud_storage_path.split('/').map(encodeURIComponent).join('/');
    // S3_PUBLIC_URL_BASE : URL publique du bucket (ex. https://pub-xxx.r2.dev ou https://cdn.carlite.fr)
    if (process.env.S3_PUBLIC_URL_BASE) {
      return `${process.env.S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${encoded}`;
    }
    const { bucketName } = getBucketConfig();
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${encoded}`;
  }
  return getSignedFileUrl(cloud_storage_path);
}

export async function getSignedFileUrl(cloud_storage_path: string) {
  const s3 = createS3Client();
  const { bucketName } = getBucketConfig();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: "attachment",
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteFile(cloud_storage_path: string) {
  const s3 = createS3Client();
  const { bucketName } = getBucketConfig();
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: cloud_storage_path })
  );
}
