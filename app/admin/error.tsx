"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Dashboard Error Boundary:", error);
  }, [error]);

  return (
    <div className="p-8 lg:p-12 min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-[#1A1025] border border-purple-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-14 h-14 bg-purple-950/60 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>

        <div>
          <h2 className="font-display text-2xl text-white font-light tracking-wide mb-2">
            Dashboard View Interrupted
          </h2>
          <p className="text-white/60 font-body text-xs leading-relaxed">
            An unexpected error occurred while loading this section. You can retry loading or navigate to the main dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-body text-xs font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer"
          >
            Retry View
          </button>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white/80 font-body text-xs font-bold tracking-wider uppercase rounded-xl transition-all text-center"
          >
            Dashboard Home
          </Link>
        </div>
      </div>
    </div>
  );
}
