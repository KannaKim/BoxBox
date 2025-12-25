import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCloudFrontUrl } from "@/lib/s3";
import { getCloudFrontSignedCookies } from "@/lib/cloudfront";
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

    // Generate signed cookies
    const cookies = getCloudFrontSignedCookies(cloudFrontUrl, 3600); // 1 hour expiration
    console.log("cookies", cookies);
    // Create response with redirect
    const response = NextResponse.redirect(cloudFrontUrl);

    // Set signed cookies
    Object.entries(cookies).forEach(([name, value]) => {
      response.cookies.set(name, value, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    });

    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}

