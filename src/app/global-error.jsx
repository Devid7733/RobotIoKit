"use client";

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "5rem 1.5rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ fontSize: "4.5rem", fontWeight: 700, color: "#e2e8f0" }}>500</div>
          <h1 style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: 600, color: "#0f172a" }}>Something went wrong</h1>
          <p style={{ marginTop: "0.75rem", color: "#64748b" }}>An unexpected error occurred. Try again or go back to the store.</p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{ padding: "0.75rem 1.5rem", borderRadius: "9999px", border: "none", backgroundColor: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 500 }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ padding: "0.75rem 1.5rem", borderRadius: "9999px", border: "1px solid #cbd5e1", color: "#0f172a", textDecoration: "none", fontWeight: 500 }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
