"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AttendanceTable from "@/components/AttendanceTable";

export default function StudentHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "STUDENT") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/attendance").then((r) => r.json()).then((d) => {
      setAttendance(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, [status]);

  const filtered = attendance.filter((a) => {
    const matchSearch = !search || a.timetable?.subject?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || a.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <DashboardLayout title="Attendance History"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="Attendance History">
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search by subject..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          <div className="flex gap-2">
            {["ALL", "PRESENT", "ABSENT"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 px-1">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        <AttendanceTable records={filtered} />
      </div>
    </DashboardLayout>
  );
}
