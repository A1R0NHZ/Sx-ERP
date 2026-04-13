"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/login"); return; }
    const role = (session.user as any).role;
    if (role === "STUDENT") router.push("/dashboard/student");
    else if (role === "FACULTY") router.push("/dashboard/faculty");
    else router.push("/dashboard/registrar");
  }, [session, status, router]);

  return <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center"><p className="text-sm text-gray-400">Loading…</p></div>;
}
