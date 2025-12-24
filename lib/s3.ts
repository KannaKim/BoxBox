import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
export const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN || "";

/**
 * Generate CloudFront URL for a file
 * @param s3Key - The S3 key (path) of the file
 * @returns CloudFront URL for the file
 */
export function getCloudFrontUrl(s3Key: string): string {
  if (!CLOUDFRONT_DOMAIN) 
    throw new Error("CloudFront domain is not configured");

  // Remove trailing slash if present
  const domain = CLOUDFRONT_DOMAIN.replace(/\/$/, "");

  return `https://${domain}/${s3Key}`;
}

