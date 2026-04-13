"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/");
  }

  return (
    <>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: "10px", fontWeight: 700, lineHeight: 1 }}>Sx</span>
        </div>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Sx-ERP</span>
      </div>

      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>Welcome back</h1>
      <p style={{ fontSize: "14px", color: "#9ca3af", margin: "0 0 32px 0" }}>Sign in to your account</p>

      {params.get("registered") && (
        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px 16px", fontSize: "12px", color: "#15803d", marginBottom: "20px" }}>
          Account created. You can sign in now.
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
            Email address
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            onFocus={(e) => { e.target.style.borderColor = "#111827"; e.target.style.boxShadow = "0 0 0 2px rgba(17,24,39,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            onFocus={(e) => { e.target.style.borderColor = "#111827"; e.target.style.boxShadow = "0 0 0 2px rgba(17,24,39,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {error && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", backgroundColor: loading ? "#6b7280" : "#111827", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: "4px" }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "24px" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "#111827", fontWeight: 500, textDecoration: "none" }}>
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "36px", width: "100%", maxWidth: "400px" }}>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
