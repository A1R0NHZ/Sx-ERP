"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface LocEntry {
  latitude: string;
  longitude: string;
  label: string;
  pinned?: boolean;
}

export default function FacultyClasses() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", dayOfWeek: "1", startTime: "08:00", endTime: "09:00" });
  const [locations, setLocations] = useState<LocEntry[]>([{ latitude: "", longitude: "", label: "", pinned: false }]);
  const [activeMapIdx, setActiveMapIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "FACULTY") router.push("/");
  }, [status, session, router]);

  function loadTimetables() {
    if (status !== "authenticated") return;
    fetch("/api/timetable").then((r) => r.json()).then((d) => {
      setTimetables(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }

  useEffect(() => { loadTimetables(); }, [status]);

  function updateLoc(i: number, field: keyof LocEntry, val: string | boolean) {
    const l = [...locations];
    (l[i] as any)[field] = val;
    setLocations(l);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const locs = locations
      .filter((l) => l.latitude && l.longitude)
      .map((l) => ({ latitude: parseFloat(l.latitude), longitude: parseFloat(l.longitude), label: l.label || null }));
    await fetch("/api/timetable", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dayOfWeek: parseInt(form.dayOfWeek), locations: locs }),
    });
    setSaving(false);
    setShowForm(false);
    setActiveMapIdx(null);
    setForm({ subject: "", dayOfWeek: "1", startTime: "08:00", endTime: "09:00" });
    setLocations([{ latitude: "", longitude: "", label: "", pinned: false }]);
    loadTimetables();
  }

  if (loading) return <DashboardLayout title="My Classes"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="My Classes">
      <div className="w-full space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setShowForm(!showForm); setActiveMapIdx(null); }}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${showForm ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
            {showForm ? "Cancel" : "+ New Class"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <p className="text-sm font-semibold text-gray-900">New Class</p>

            {/* Basic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject name</label>
                <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Day</label>
                <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Start</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">End</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Locations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">
                  Class Locations <span className="text-gray-400 font-normal">(up to 5, 20m radius each)</span>
                </label>
              </div>

              <div className="space-y-3">
                {locations.map((loc, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    {/* Location row */}
                    <div className="flex gap-2 items-center p-3 bg-gray-50">
                      <input placeholder="Latitude" value={loc.latitude}
                        onChange={(e) => updateLoc(i, "latitude", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white font-mono"
                        readOnly={loc.pinned} />
                      <input placeholder="Longitude" value={loc.longitude}
                        onChange={(e) => updateLoc(i, "longitude", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white font-mono"
                        readOnly={loc.pinned} />
                      <input placeholder="Label" value={loc.label}
                        onChange={(e) => updateLoc(i, "label", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white" />
                      <button type="button"
                        onClick={() => setActiveMapIdx(activeMapIdx === i ? null : i)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeMapIdx === i ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                      </button>
                      {locations.length > 1 && (
                        <button type="button" onClick={() => { setLocations(locations.filter((_, j) => j !== i)); if (activeMapIdx === i) setActiveMapIdx(null); }}
                          className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-1">
                          &times;
                        </button>
                      )}
                    </div>

                    {/* Map panel */}
                    {activeMapIdx === i && (
                      <div className="p-3 border-t border-gray-100">
                        <LocationPicker
                          value={loc.latitude && loc.longitude ? { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) } : null}
                          onChange={(c) => {
                            const l = [...locations];
                            l[i].latitude = String(c.lat);
                            l[i].longitude = String(c.lng);
                            l[i].pinned = c.lat !== 0;
                            setLocations(l);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {locations.length < 5 && (
                <button type="button"
                  onClick={() => setLocations([...locations, { latitude: "", longitude: "", label: "", pinned: false }])}
                  className="text-xs text-gray-400 hover:text-gray-700 mt-2 transition-colors">
                  + Add another location
                </button>
              )}
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Save Class"}
            </button>
          </form>
        )}

        {/* Class list */}
        {timetables.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm font-medium text-gray-700">No classes yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first class to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timetables.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                      {t.subject[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.subject}</p>
                      <p className="text-xs text-gray-400">{DAYS[t.dayOfWeek]} &middot; {t.startTime} &ndash; {t.endTime}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{t.locations?.length ?? 0} zone{t.locations?.length !== 1 ? "s" : ""}</span>
                </div>
                {t.locations?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.locations.map((l: any) => (
                      <span key={l.id} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
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
