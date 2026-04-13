"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

export default function FacultyOverview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "FACULTY") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/timetable").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ]).then(([att, tt, notifs]) => {
      setAttendance(Array.isArray(att) ? att : []);
      setTimetables(Array.isArray(tt) ? tt : []);
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setLoading(false);
    });
  }, [status]);

  const today = new Date().toISOString().split("T")[0];
  const todayPresent = attendance.filter((a) => a.status === "PRESENT" && a.date?.startsWith(today)).length;
  const totalStudents = new Set(attendance.map((a) => a.studentId)).size;
  const unread = notifications.filter((n) => !n.read).length;
  const recent = attendance.slice(0, 6);

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
            { label: "My Classes",    value: timetables.length, color: "text-gray-900" },
            { label: "Students",      value: totalStudents,     color: "text-gray-900" },
            { label: "Present Today", value: todayPresent,      color: "text-emerald-600" },
            { label: "Unread Alerts", value: unread,            color: unread > 0 ? "text-amber-600" : "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-semibold mt-1.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/dashboard/faculty/attendance" className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Attendance</p>
            <p className="text-sm font-semibold text-gray-900">{attendance.length} records</p>
          </Link>
          <Link href="/dashboard/faculty/classes" className="bg-gray-900 text-white rounded-2xl p-4 hover:bg-gray-800 transition-colors">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Classes</p>
            <p className="text-sm font-semibold">{timetables.length} scheduled</p>
          </Link>
          <Link href="/dashboard/faculty/notifications" className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
            <p className="text-[11px] text-gray-400 font-medium mb-1">Notifications</p>
            <p className="text-sm font-semibold text-gray-900">{unread} unread</p>
          </Link>
        </div>

        {/* Recent attendance */}
        {recent.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Recent Attendance</p>
              <Link href="/dashboard/faculty/attendance" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.student?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.timetable?.subject ?? "—"} · {new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
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
