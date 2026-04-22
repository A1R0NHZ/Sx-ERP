"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default function StudentProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "STUDENT") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (user?.role !== "STUDENT") return;
    fetch("/api/attendance")
      .then((r) => r.json())
      .catch(() => [])
      .then((d) => {
        setAttendance(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [status, session]);

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const rate = total ? Math.round((present / total) * 100) : 0;

  const subjectMap: Record<string, { present: number; total: number }> = {};
  attendance.forEach((a) => {
    const s = a.timetable?.subject ?? "Unknown";
    if (!subjectMap[s]) subjectMap[s] = { present: 0, total: 0 };
    subjectMap[s].total++;
    if (a.status === "PRESENT") subjectMap[s].present++;
  });

  if (loading) return <DashboardLayout title="My Profile"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="My Profile">
      <div className="w-full space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-xl font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium mt-1 inline-block">Student</span>
            </div>
          </div>
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {[
              { label: "Total Classes", value: total },
              { label: "Present", value: present },
              { label: "Absent", value: total - present },
              { label: "Attendance Rate", value: `${rate}%` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className={`text-sm font-semibold ${item.label === "Attendance Rate" ? (rate >= 75 ? "text-emerald-600" : "text-red-500") : "text-gray-900"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Subject Breakdown</p>
          {Object.keys(subjectMap).length === 0 ? (
            <p className="text-sm text-gray-400">No attendance data yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(subjectMap).map(([subj, s]) => {
                const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
                return (
                  <div key={subj}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-700">{subj}</span>
                      <span className={`font-semibold ${pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>{pct}% · {s.present}/{s.total}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    {pct < 75 && <p className="text-[10px] text-red-400 mt-1">Below 75% threshold</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
