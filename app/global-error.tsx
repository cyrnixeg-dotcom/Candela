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
    console.error("Root Application Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FAF7F4", color: "#2B2829" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ maxWidth: "420px", background: "white", padding: "32px", borderRadius: "24px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 400, marginBottom: "8px" }}>Candela Store</h2>
            <p style={{ fontSize: "0.85rem", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
              The application encountered an unexpected state. Click below to reload cleanly.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "#E87A90",
                color: "white",
                border: "none",
                padding: "12px 28px",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Reload Store
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
