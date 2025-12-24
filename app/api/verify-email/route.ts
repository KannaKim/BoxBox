import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      );
    }

    // Check verification token
    const tokenResult = await pool.query(
      "SELECT * FROM verification_tokens WHERE identifier = $1 AND token = $2",
      [email, token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const verificationToken = tokenResult.rows[0];

    // Check if token is expired
    if (new Date(verificationToken.expires) < new Date()) {
      await pool.query(
        "DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2",
        [email, token]
      );
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Verify user's email
    await pool.query(
      "UPDATE users SET email_verified = true WHERE email = $1",
      [email]
    );

    // Delete used verification token
    await pool.query(
      "DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2",
      [email, token]
    );

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

