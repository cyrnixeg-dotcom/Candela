"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalStoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF7F4] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-pink-100 text-center space-y-6">
        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto text-3xl">
          🌸
        </div>

        <div>
          <h2 className="font-display text-3xl text-gray-900 font-light mb-2">
            Something unexpected happened
          </h2>
          <p className="text-gray-500 font-body text-xs leading-relaxed">
            We encountered a temporary issue loading this page. Your shopping bag and account data are completely safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-[#E87A90] hover:bg-[#D96B81] text-white font-body text-xs font-bold tracking-widest uppercase rounded-full transition-all cursor-pointer shadow-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 border border-gray-200 hover:border-gray-400 text-gray-700 font-body text-xs font-bold tracking-widest uppercase rounded-full transition-all text-center"
          >
            Go To Home
          </Link>
        </div>
      </div>
    </div>
  );
}
