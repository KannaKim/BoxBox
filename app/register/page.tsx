"use client";

import { useState } from "react";
import Link from "next/link";
import SignInForm from "@/app/components/SignInForm";
import RegisterForm from "@/app/components/RegisterForm";

export default function RegisterPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2 inline-block"
            >
              BoxBox
            </Link>
          </div>

          {/* Render appropriate form based on mode */}
          {isLogin ? (
            <SignInForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToSignIn={() => setIsLogin(true)} />
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

