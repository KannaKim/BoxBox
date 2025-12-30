import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import pool from "./lib/db";
import bcrypt from "bcryptjs";

export const config = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [credentials.email as string]
        );

        const user = result.rows[0];

        if (!user || !user.password_hash) {
          return null;
        }

        // Check if email is verified
        if (!user.email_verified) {
          throw new Error("Email not verified. Please check your email for verification link.");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Check if user exists, if not create one
        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [user.email]
        );

        if (result.rows.length === 0) {
          // Create new user with email verified (OAuth emails are pre-verified)
          await pool.query(
            "INSERT INTO users (email, name, image, email_verified) VALUES ($1, $2, $3, $4)",
            [user.email, user.name, user.image, true]
          );
        } else {
          // If user exists but email not verified, verify it now (OAuth)
          await pool.query(
            "UPDATE users SET email_verified = true, name = COALESCE($1, name), image = COALESCE($2, image) WHERE email = $3",
            [user.name, user.image, user.email]
          );
        }

        // Link OAuth account
        const userResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [user.email]
        );

        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;

          // Check if account already linked
          const accountCheck = await pool.query(
            "SELECT * FROM accounts WHERE user_id = $1 AND provider = $2 AND provider_account_id = $3",
            [userId, account.provider, account.providerAccountId]
          );

          if (accountCheck.rows.length === 0) {
            await pool.query(
              `INSERT INTO accounts (
                user_id, type, provider, provider_account_id,
                access_token, refresh_token, expires_at, token_type, scope
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                userId,
                account.type,
                account.provider,
                account.providerAccountId,
                account.access_token,
                account.refresh_token,
                account.expires_at,
                account.token_type,
                account.scope,
              ]
            );
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/register",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

