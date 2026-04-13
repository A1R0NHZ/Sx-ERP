"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AttendanceTable from "@/components/AttendanceTable";

export default function RegistrarAttendance() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "REGISTRAR") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/attendance").then((r) => r.json()).then((d) => {
      setAttendance(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, [status]);

  const filtered = attendance.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !search || a.student?.name?.toLowerCase().includes(q) || a.timetable?.subject?.toLowerCase().includes(q) || a.student?.studentId?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/attendance/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "attendance.xlsx"; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (loading) return <DashboardLayout title="Attendance"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="Attendance">
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search student, subject, or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          <div className="flex gap-2">
            {["ALL", "PRESENT", "ABSENT"].map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${statusFilter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
            <button onClick={handleExport} disabled={exporting}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 px-1">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        <AttendanceTable records={filtered} showStudent />
      </div>
    </DashboardLayout>
  );
}
