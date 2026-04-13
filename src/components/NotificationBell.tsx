"use client";
import { useEffect, useState, useRef } from "react";

interface Notification { id: string; message: string; read: boolean; createdAt: string; }

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch("/api/notifications");
    if (r.ok) setItems(await r.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unread > 0 && <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">{unread} new</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No notifications</p>
            ) : (
              items.map((n) => (
                <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? "bg-gray-50" : ""}`}>
                  <div className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-gray-900" : "bg-gray-200"}`} />
                    <div>
                      <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
