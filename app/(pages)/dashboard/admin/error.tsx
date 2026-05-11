"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[AdminPage] error:", error);
  }, [error]);

  const isAuthError =
    error.message?.toLowerCase().includes("session") ||
    error.message?.toLowerCase().includes("auth") ||
    error.name === "SessionTokenError";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-5">
        <div className="text-5xl">⚠️</div>

        {isAuthError ? (
          <>
            <h1 className="text-xl font-bold text-gray-800">Session Expired</h1>
            <p className="text-gray-600 text-sm">
              Your session could not be verified. Please sign out and sign back in.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={reset}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-800">Something went wrong</h1>
            <p className="text-gray-600 text-sm">
              The admin panel encountered an unexpected error. If this persists, contact the system administrator.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-red-500 bg-red-50 rounded p-2 text-left font-mono break-all">
                {error.message}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
