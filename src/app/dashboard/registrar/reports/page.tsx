"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";

export default function RegistrarReports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "REGISTRAR") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/attendance").then((r) => r.json()).then((d) => {
      setAttendance(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, [status]);

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const absent = attendance.filter((a) => a.status === "ABSENT").length;
  const inProgress = attendance.filter((a) => a.status === "IN_PROGRESS").length;
  const rate = total ? Math.round((present / total) * 100) : 0;

  const subjectStats: Record<string, { present: number; total: number }> = {};
  attendance.forEach((a) => {
    const s = a.timetable?.subject ?? "Unknown";
    if (!subjectStats[s]) subjectStats[s] = { present: 0, total: 0 };
    subjectStats[s].total++;
    if (a.status === "PRESENT") subjectStats[s].present++;
  });

  // Daily trend (last 7 days)
  const dailyMap: Record<string, { present: number; total: number }> = {};
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  last7.forEach((d) => { dailyMap[d] = { present: 0, total: 0 }; });
  attendance.forEach((a) => {
    const d = a.date?.split("T")[0];
    if (d && dailyMap[d]) {
      dailyMap[d].total++;
      if (a.status === "PRESENT") dailyMap[d].present++;
    }
  });

  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/attendance/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "attendance_report.xlsx"; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (loading) return <DashboardLayout title="Reports"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="Reports">
      <div className="w-full space-y-6">
        <div className="flex justify-end">
          <button onClick={handleExport} disabled={exporting}
            className="text-sm font-medium px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Overall Rate" value={`${rate}%`} color={rate >= 75 ? "green" : "amber"} />
          <StatCard label="Present" value={present} color="green" />
          <StatCard label="Absent" value={absent} color="red" />
          <StatCard label="In Progress" value={inProgress} color="amber" />
        </div>

        {/* Overall bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Overall Attendance</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full transition-all ${rate >= 75 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${rate}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-10 text-right">{rate}%</span>
          </div>
          <div className="flex gap-5 mt-3">
            {[
              { label: "Present", count: present, color: "bg-emerald-500" },
              { label: "Absent", count: absent, color: "bg-red-400" },
              { label: "In Progress", count: inProgress, color: "bg-amber-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs text-gray-500">{item.label}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">By Subject</p>
          {Object.keys(subjectStats).length === 0 ? (
            <p className="text-sm text-gray-400">No data available.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(subjectStats).sort((a, b) => b[1].total - a[1].total).map(([subj, s]) => {
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7-day trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Last 7 Days</p>
          <div className="flex items-end gap-2 h-24">
            {last7.map((d) => {
              const s = dailyMap[d];
              const pct = s.total ? (s.present / s.total) * 100 : 0;
              const label = new Date(d).toLocaleDateString("en-GB", { weekday: "short" });
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                    <div className={`w-full rounded-t-lg transition-all ${s.total === 0 ? "bg-gray-100" : pct >= 75 ? "bg-emerald-400" : "bg-amber-400"}`}
                      style={{ height: `${s.total === 0 ? 4 : Math.max(4, pct * 0.72)}px` }} />
                  </div>
                  <span className="text-[9px] text-gray-400">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
