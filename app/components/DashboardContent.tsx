"use client";

import { Session } from "next-auth";
import FileList from "@/app/components/FileList";
import UploadButton from "@/app/components/UploadButton";
import SignOutButton from "@/app/components/SignOutButton";

interface DashboardContentProps {
  session: Session;
}

export default function DashboardContent({ session }: DashboardContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              BoxBox
            </h1>
            <UploadButton
              onUploadSuccess={(data) => {
                console.log("Upload successful:", data);
              }}
              onUploadError={(error) => {
                console.error("Upload error:", error);
              }}
            />
          </div>
          <SignOutButton />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome, {session.user?.name || session.user?.email}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Upload and manage your files in the cloud.
          </p>

          {/* File List Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <FileList />
          </div>

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Email:</span> {session.user?.email}
              </p>
              {session.user?.name && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Name:</span> {session.user.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

