"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0, background: "#f6f1e7", color: "#2a2722" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#6b6357", marginBottom: "1.25rem" }}>An unexpected error occurred. Please try again.</p>
          <button onClick={() => reset()} style={{ background: "#59684c", color: "#fff", border: 0, borderRadius: "999px", padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
