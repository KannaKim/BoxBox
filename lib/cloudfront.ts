import { getSignedCookies } from "@aws-sdk/cloudfront-signer";

export const CLOUDFRONT_KEY_PAIR_ID = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID || "";

// Decode base64-encoded PEM private key (conventional way to store in env vars)
const encodedKey = process.env.AWS_CLOUDFRONT_PRIVATE_KEY || "";
export const CLOUDFRONT_PRIVATE_KEY = encodedKey
  ? Buffer.from(encodedKey, "base64").toString("utf-8")
  : "";
/**
 * Generate CloudFront signed cookies for a resource
 * @param resourceUrl - The CloudFront URL of the resource
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed cookies object
 */
export function getCloudFrontSignedCookies(
  resourceUrl: string,
  expiresIn: number = 3600
) {
  if (!CLOUDFRONT_KEY_PAIR_ID || !CLOUDFRONT_PRIVATE_KEY) {
    throw new Error("CloudFront key pair ID and private key must be configured");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  const cookies = getSignedCookies({
    url: resourceUrl,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    dateLessThan: new Date(expiresAt * 1000).toISOString(),
  });

  return cookies;
}

