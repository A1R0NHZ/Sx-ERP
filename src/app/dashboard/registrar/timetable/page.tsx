"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RegistrarTimetable() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState(-1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "REGISTRAR") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if ((session?.user as any)?.role !== "REGISTRAR") return;
    fetch("/api/timetable")
      .then((r) => r.json())
      .catch(() => [])
      .then((d) => {
        setTimetables(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [status, session]);

  const filtered = timetables.filter((t) => {
    const matchSearch = !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.faculty?.name?.toLowerCase().includes(search.toLowerCase());
    const matchDay = dayFilter === -1 || t.dayOfWeek === dayFilter;
    return matchSearch && matchDay;
  });

  if (loading) return <DashboardLayout title="Timetable"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="Timetable">
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search subject or faculty..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setDayFilter(-1)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${dayFilter === -1 ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
              All
            </button>
            {DAYS.map((d, i) => (
              <button key={i} onClick={() => setDayFilter(i)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${dayFilter === i ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 px-1">{filtered.length} class{filtered.length !== 1 ? "es" : ""}</p>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm font-medium text-gray-700">No classes found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                      {t.subject?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.subject}</p>
                      <p className="text-xs text-gray-400">{DAYS[t.dayOfWeek]} · {t.startTime} "" {t.endTime}</p>
                      <p className="text-xs text-gray-400">Faculty: {t.faculty?.name ?? "—"}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{t.locations?.length ?? 0} zone{t.locations?.length !== 1 ? "s" : ""}</span>
                </div>
                {t.locations?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.locations.map((l: any) => (
                      <span key={l.id} className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                        {l.label ?? `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
