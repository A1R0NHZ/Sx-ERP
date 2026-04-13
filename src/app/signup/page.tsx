"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLES = ["STUDENT", "FACULTY"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  backgroundColor: "white",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#374151",
  marginBottom: "6px",
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
    role: "STUDENT" as typeof ROLES[number],
    studentId: "", facultyId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, email: form.email, password: form.password, role: form.role,
        studentId: form.role === "STUDENT" ? form.studentId || undefined : undefined,
        facultyId: form.role === "FACULTY" ? form.facultyId || undefined : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
    router.push("/login?registered=1");
  }

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        {children}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "36px", width: "100%", maxWidth: "400px", margin: "auto" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: "10px", fontWeight: 700, lineHeight: 1 }}>Sx</span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Sx-ERP</span>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>Create account</h1>
        <p style={{ fontSize: "14px", color: "#9ca3af", margin: "0 0 32px 0" }}>Join the attendance system</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Field label="Full name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe" style={inputStyle} />
          </Field>

          <Field label="Email address">
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" style={inputStyle} />
          </Field>

          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              style={inputStyle}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </Field>

          {form.role === "STUDENT" && (
            <Field label="Student ID (optional)">
              <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="STU001" style={inputStyle} />
            </Field>
          )}

          {form.role === "FACULTY" && (
            <Field label="Faculty ID (optional)">
              <input value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                placeholder="FAC001" style={inputStyle} />
            </Field>
          )}

          <Field label="Password">
            <input type="password" required minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters" style={inputStyle} />
          </Field>

          <Field label="Confirm password">
            <input type="password" required value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••" style={inputStyle} />
          </Field>

          {error && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ width: "100%", backgroundColor: loading ? "#6b7280" : "#111827", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: "4px" }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "24px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#111827", fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
