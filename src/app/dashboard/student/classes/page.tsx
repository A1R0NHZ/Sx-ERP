"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import GeoTracker from "@/components/GeoTracker";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Timetable {
  id: string; subject: string; dayOfWeek: number;
  startTime: string; endTime: string; faculty: { name: string };
  locations: { id: string; latitude: number; longitude: number; label: string | null }[];
}

export default function StudentClasses() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "STUDENT") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/timetable").then((r) => r.json()).then((d) => {
      setTimetables(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, [status]);

  const today = new Date().getDay();
  const todayClasses = timetables.filter((t) => t.dayOfWeek === today);
  const otherClasses = timetables.filter((t) => t.dayOfWeek !== today);

  if (loading) return <DashboardLayout title="Today's Classes"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="Today's Classes">
      <div className="w-full space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400">Today is</p>
          <p className="text-lg font-semibold text-gray-900">{DAYS[today]}</p>
        </div>

        {todayClasses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm font-medium text-gray-700">No classes today</p>
            <p className="text-xs text-gray-400 mt-1">No classes are scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">{todayClasses.length} class{todayClasses.length !== 1 ? "es" : ""} scheduled</p>
            {todayClasses.map((cls) => (
              <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                      {cls.subject[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cls.subject}</p>
                      <p className="text-xs text-gray-400">{cls.startTime} "" {cls.endTime} · {cls.faculty.name}</p>
                    </div>
                  </div>
                  {done[cls.id] ? (
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${done[cls.id] === "PRESENT" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {done[cls.id] === "PRESENT" ? "Present" : "Absent"}
                    </span>
                  ) : (
                    <button onClick={() => setActive(active === cls.id ? null : cls.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${active === cls.id ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                      {active === cls.id ? "Cancel" : "Track"}
                    </button>
                  )}
                </div>
                {active === cls.id && !done[cls.id] && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                    <GeoTracker timetableId={cls.id} onDone={(s) => { setDone((p) => ({ ...p, [cls.id]: s })); setActive(null); }} />
                  </div>
                )}
                {cls.locations.length > 0 && (
                  <div className="border-t border-gray-50 px-5 py-2.5 flex gap-2 flex-wrap">
                    {cls.locations.map((l) => (
                      <span key={l.id} className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {l.label ?? `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {otherClasses.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-3">Other scheduled classes</p>
            <div className="space-y-2">
              {otherClasses.map((cls) => (
                <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{cls.subject}</p>
                    <p className="text-xs text-gray-400">{DAYS[cls.dayOfWeek]} · {cls.startTime} "" {cls.endTime}</p>
                  </div>
                  <span className="text-xs text-gray-400">{cls.faculty.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
