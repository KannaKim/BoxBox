import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.REGION_AWS || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS || "",
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME_AWS || "";
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN_AWS || "";

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

