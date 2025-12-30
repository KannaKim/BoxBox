import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCloudFrontUrl } from "@/lib/s3";
import { getCloudFrontSignedUrl } from "@/lib/cloudfront";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileKey = decodeURIComponent((await params).key);

    // Verify the file belongs to the user
    const fileResult = await pool.query(
      "SELECT s3_key, original_filename FROM files WHERE user_id = $1 AND s3_key = $2",
      [session.user.id, fileKey]
    );

    if (fileResult.rows.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = fileResult.rows[0];
    const cloudFrontUrl = getCloudFrontUrl(file.s3_key);

    // Generate signed URL (valid for 1 hour)
    const signedUrl = getCloudFrontSignedUrl(cloudFrontUrl, 3600);

    // Fetch the file from CloudFront
    const fileResponse = await fetch(signedUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file from CloudFront" },
        { status: fileResponse.status }
      );
    }

    // Get the file content
    const fileBuffer = await fileResponse.arrayBuffer();

    // Get content type from CloudFront response or default to binary
    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";

    // Create response with download headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.original_filename)}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}

