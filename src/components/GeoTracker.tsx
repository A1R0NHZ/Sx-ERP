"use client";
import { useEffect, useRef, useState } from "react";
import { MIN_DURATION_MINUTES } from "@/lib/geo";

interface Props { timetableId: string; onDone?: (status: string) => void; }

export default function GeoTracker({ timetableId, onDone }: Props) {
  const [phase, setPhase] = useState<"idle" | "tracking" | "done">("idle");
  const [locationValid, setLocationValid] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkinThrottleRef = useRef<number>(0);

  async function checkin(lat: number, lon: number) {
    // Throttle checkin calls to at most once every 30 seconds
    const now = Date.now();
    if (now - checkinThrottleRef.current < 30000) return;
    checkinThrottleRef.current = now;
    try {
      const r = await fetch("/api/attendance/checkin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetableId, latitude: lat, longitude: lon }),
      });
      const d = await r.json();
      setLocationValid(d.locationValid);
    } catch {
      // network error — keep tracking silently
    }
  }

  function start() {
    if (!navigator.geolocation) { setError("Geolocation not supported on this device"); return; }
    setPhase("tracking"); setElapsed(0); setError(null); setResult(null);
    checkinThrottleRef.current = 0;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => checkin(pos.coords.latitude, pos.coords.longitude),
      () => setError("Location access denied — please allow location permissions"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  async function stop() {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("done");
    const r = await fetch("/api/attendance/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timetableId }),
    });
    const d = await r.json();
    setResult(d.status ?? "ABSENT");
    onDone?.(d.status);
  }

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const progress = Math.min((mins / MIN_DURATION_MINUTES) * 100, 100);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">{error}</div>
      )}

      {locationValid !== null && phase === "tracking" && (
        <div className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 ${locationValid ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${locationValid ? "bg-emerald-500" : "bg-red-500"}`} />
          {locationValid ? "Within class zone — tracking active" : "Outside class zone — move closer to the classroom"}
        </div>
      )}

      {phase === "tracking" && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Time in class</span>
            <span className="text-xs font-mono font-semibold text-gray-900">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} / {MIN_DURATION_MINUTES}:00
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-gray-900 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-gray-400">Stay within the class zone for {MIN_DURATION_MINUTES} minutes to be marked present</p>
        </div>
      )}

      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${result === "PRESENT" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {result === "PRESENT" ? "Marked Present" : "Marked Absent"}
        </div>
      )}

      {phase === "idle" && (
        <button onClick={start}
          className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
          Start Tracking
        </button>
      )}
      {phase === "tracking" && (
        <button onClick={stop}
          className="w-full bg-red-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-red-600 transition-colors">
          End Session
        </button>
      )}
    </div>
  );
}
