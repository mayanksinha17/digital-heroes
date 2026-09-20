"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="glass-card max-w-md rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
        <p className="text-sm text-slate-300">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-brand-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-emerald-500"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
