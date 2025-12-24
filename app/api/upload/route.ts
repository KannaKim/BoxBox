import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { s3Client, S3_BUCKET_NAME, getCloudFrontUrl } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import pool from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique file name
    const fileExtension = file.name.split(".").pop();
    const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Save file info to database
    await pool.query(
      "INSERT INTO files (user_id, original_filename, s3_key) VALUES ($1, $2, $3)",
      [session.user.id, file.name, fileName]
    );

    // Return file URL using CloudFront
    const fileUrl = getCloudFrontUrl(fileName);

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

