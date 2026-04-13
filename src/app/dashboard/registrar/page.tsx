"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

export default function RegistrarOverview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "REGISTRAR") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/timetable").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([att, tt, u]) => {
      setAttendance(Array.isArray(att) ? att : []);
      setTimetables(Array.isArray(tt) ? tt : []);
      setUsers(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  }, [status]);

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const absent = attendance.filter((a) => a.status === "ABSENT").length;
  const rate = total ? Math.round((present / total) * 100) : 0;
  const students = users.filter((u) => u.role === "STUDENT").length;
  const faculty = users.filter((u) => u.role === "FACULTY").length;
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

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Attendance Rate", value: `${rate}%`, color: rate >= 75 ? "text-emerald-600" : "text-amber-600" },
            { label: "Total Records",   value: total,      color: "text-gray-900" },
            { label: "Students",        value: students,   color: "text-gray-900" },
            { label: "Faculty",         value: faculty,    color: "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-semibold mt-1.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Present / Absent split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Present</p>
            <p className="text-3xl font-semibold mt-1.5 text-emerald-600">{present}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Absent</p>
            <p className="text-3xl font-semibold mt-1.5 text-red-500">{absent}</p>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Attendance", sub: `${total} records`,          href: "/dashboard/registrar/attendance", dark: true },
            { label: "Reports",    sub: "Analytics",                  href: "/dashboard/registrar/reports",    dark: false },
            { label: "Users",      sub: `${users.length} registered`, href: "/dashboard/registrar/users",      dark: false },
            { label: "Timetable",  sub: `${timetables.length} classes`, href: "/dashboard/registrar/timetable", dark: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl p-4 transition-colors ${
                item.dark
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-white border border-gray-100 hover:border-gray-200"
              }`}
            >
              <p className={`text-[11px] font-medium mb-1 ${item.dark ? "text-gray-400" : "text-gray-400"}`}>{item.label}</p>
              <p className={`text-sm font-semibold ${item.dark ? "text-white" : "text-gray-900"}`}>{item.sub}</p>
            </Link>
          ))}
        </div>

        {/* Recent activity */}
        {recent.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Recent Activity</p>
              <Link href="/dashboard/registrar/attendance" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
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
