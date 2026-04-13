"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

export default function StudentOverview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "STUDENT") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/timetable").then((r) => r.json()),
    ]).then(([att, tt]) => {
      setAttendance(Array.isArray(att) ? att : []);
      setTimetables(Array.isArray(tt) ? tt : []);
      setLoading(false);
    });
  }, [status]);

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const absent = attendance.filter((a) => a.status === "ABSENT").length;
  const rate = total ? Math.round((present / total) * 100) : 0;
  const todayClasses = timetables.filter((t) => t.dayOfWeek === new Date().getDay());
  const recent = attendance.slice(0, 5);

  const subjectMap: Record<string, { present: number; total: number }> = {};
  attendance.forEach((a) => {
    const s = a.timetable?.subject ?? "Unknown";
    if (!subjectMap[s]) subjectMap[s] = { present: 0, total: 0 };
    subjectMap[s].total++;
    if (a.status === "PRESENT") subjectMap[s].present++;
  });

  if (loading) {
    return (
      <DashboardLayout title="Overview">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Overview">
      <div className="w-full space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Attendance Rate", value: `${rate}%`,  color: rate >= 75 ? "text-emerald-600" : "text-red-500" },
            { label: "Present",         value: present,     color: "text-emerald-600" },
            { label: "Absent",          value: absent,      color: "text-red-500" },
            { label: "Today",           value: todayClasses.length, color: "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-semibold mt-1.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/dashboard/student/classes" className="bg-gray-900 text-white rounded-2xl p-4 hover:bg-gray-800 transition-colors">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Today</p>
            <p className="text-sm font-semibold">{todayClasses.length} class{todayClasses.length !== 1 ? "es" : ""} scheduled</p>
            <p className="text-xs text-gray-500 mt-2">Track attendance</p>
          </Link>
          <Link href="/dashboard/student/history" className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
            <p className="text-[11px] text-gray-400 font-medium mb-1">History</p>
            <p className="text-sm font-semibold text-gray-900">{total} records</p>
            <p className="text-xs text-gray-400 mt-2">View all</p>
          </Link>
        </div>

        {/* Subject attendance */}
        {Object.keys(subjectMap).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">Subject Attendance</p>
            <div className="space-y-4">
              {Object.entries(subjectMap).map(([subj, s]) => {
                const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
                return (
                  <div key={subj}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-700">{subj}</span>
                      <span className={`font-semibold ${pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                        {pct}% · {s.present}/{s.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recent.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Recent Activity</p>
              <Link href="/dashboard/student/history" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.timetable?.subject ?? "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    r.status === "PRESENT"     ? "bg-emerald-50 text-emerald-700" :
                    r.status === "ABSENT"      ? "bg-red-50 text-red-600" :
                                                 "bg-amber-50 text-amber-700"
                  }`}>
                    {r.status === "IN_PROGRESS" ? "In Progress" : r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
