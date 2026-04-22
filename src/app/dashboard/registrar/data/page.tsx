"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface Action {
  target: string;
  label: string;
  description: string;
  danger: boolean;
}

const ACTIONS: Action[] = [
  {
    target: "attendance",
    label: "Clear Attendance Records",
    description: "Deletes all attendance records. Users are kept.",
    danger: false,
  },
  {
    target: "notifications",
    label: "Clear Notifications",
    description: "Deletes all system notifications.",
    danger: false,
  },
  {
    target: "timetables",
    label: "Clear Timetables",
    description: "Deletes all timetables and their location zones. Also clears attendance records.",
    danger: true,
  },
  {
    target: "all",
    label: "Full Reset",
    description: "Deletes all attendance, notifications, and timetables. Users are preserved.",
    danger: true,
  },
];

export default function DataManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ target: string; message: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "REGISTRAR") router.push("/");
  }, [status, session, router]);

  async function execute(target: string) {
    setLoading(target);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/reset?target=${target}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult({
        target,
        message:
          target === "all"
            ? "Full reset complete."
            : `Cleared ${data.deleted} record${data.deleted !== 1 ? "s" : ""} from ${target}.`,
      });
    } catch (e: any) {
      setResult({ target, message: `Error: ${e.message}` });
    } finally {
      setLoading(null);
      setConfirm(null);
    }
  }

  return (
    <DashboardLayout title="Data Management">
      <div className="w-full max-w-xl space-y-4">
        <p className="text-xs text-gray-400 px-1">
          Production cleanup — permanently deletes records. Users are never deleted here.
        </p>

        {result && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
            {result.message}
          </div>
        )}

        {ACTIONS.map((action) => (
          <div
            key={action.target}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start justify-between gap-4"
          >
            <div>
              <p className={`text-sm font-semibold ${action.danger ? "text-red-600" : "text-gray-900"}`}>
                {action.label}
              </p>
              <p className="text-xs text-gray-400 mt-1">{action.description}</p>
            </div>

            {confirm === action.target ? (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => execute(action.target)}
                  disabled={loading === action.target}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {loading === action.target ? "Deleting..." : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirm(null)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setConfirm(action.target); setResult(null); }}
                className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  action.danger
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Clear
              </button>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
