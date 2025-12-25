import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.email_verified) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      } else {
        // User exists but not verified - resend verification email
        return NextResponse.json(
          { 
            error: "Email not verified. Please check your email for verification link.",
            requiresVerification: true 
          },
          { status: 403 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with email_verified = false
    const result = await pool.query(
      "INSERT INTO users (email, name, password_hash, email_verified) VALUES ($1, $2, $3, $4) RETURNING id, email, name",
      [email, name || null, passwordHash, false]
    );

    const user = result.rows[0];
    void user;
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

    // Store verification token
    await pool.query(
      "INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1, $2, $3) ON CONFLICT (identifier, token) DO UPDATE SET expires = $3",
      [email, verificationToken, expires]
    );

    // Generate verification URL
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // TODO: Send verification email
    // For now, we'll return the URL in development
    // In production, send this via email service (Resend, SendGrid, etc.)
    console.log("Verification URL:", verificationUrl);

    return NextResponse.json(
      {
        message: "Registration successful. Please check your email to verify your account.",
        requiresVerification: true,
        verificationUrl: process.env.NODE_ENV === "development" ? verificationUrl : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

