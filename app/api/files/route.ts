import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { s3Client, S3_BUCKET_NAME } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  void request;
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get files from database
    const result = await pool.query(
      "SELECT id, original_filename, s3_key, created_at FROM files WHERE user_id = $1 ORDER BY created_at DESC",
      [session.user.id]
    );

    const files = result.rows.map((row) => {
      return {
        id: row.id,
        key: row.s3_key,
        fileName: row.original_filename,
        lastModified: row.created_at,
        url: `/api/download/${encodeURIComponent(row.s3_key)}`,
      };
    });

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("key");

    if (!fileKey) {
      return NextResponse.json({ error: "File key is required" }, { status: 400 });
    }

    // Verify the file belongs to the user and get the s3_key
    const fileResult = await pool.query(
      "SELECT s3_key FROM files WHERE user_id = $1 AND s3_key = $2",
      [session.user.id, fileKey]
    );

    if (fileResult.rows.length === 0) {
      return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
    }

    const s3Key = fileResult.rows[0].s3_key;

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);

    // Delete from database
    await pool.query("DELETE FROM files WHERE s3_key = $1", [s3Key]);

    return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
