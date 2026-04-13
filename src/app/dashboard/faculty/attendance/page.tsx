"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AttendanceTable from "@/components/AttendanceTable";

export default function FacultyAttendance() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "FACULTY") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/timetable").then((r) => r.json()),
    ]).then(([att, tt]) => {
      setAttendance(Array.isArray(att) ? att : []);
      setTimetables(Array.isArray(tt) ? tt : []);
      setLoading(false);
    });
  }, [status]);

  const filtered = attendance.filter((a) => {
    const matchClass = filter === "all" || a.timetableId === filter;
    const matchSearch = !search || a.student?.name?.toLowerCase().includes(search.toLowerCase()) || a.student?.studentId?.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  if (loading) return <DashboardLayout title="Attendance"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="Attendance">
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search student name or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white">
            <option value="all">All Classes</option>
            {timetables.map((t) => <option key={t.id} value={t.id}>{t.subject}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400 px-1">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        <AttendanceTable records={filtered} showStudent />
      </div>
    </DashboardLayout>
  );
}
