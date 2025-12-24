"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
    >
      Sign Out
    </button>
  );
}

