"use client";
import PageSkeleton from "@/components/PageSkeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default function FacultyNotifications() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "FACULTY") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setNotifications(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, [status]);

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) })));
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  }

  const unread = notifications.filter((n) => !n.read).length;

  if (loading) return <DashboardLayout title="Notifications"><PageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout title="Notifications">
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{unread} unread · {notifications.length} total</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Mark all read</button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm font-medium text-gray-700">All caught up</p>
            <p className="text-xs text-gray-400 mt-1">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                className={`bg-white rounded-2xl border transition-colors cursor-pointer ${!n.read ? "border-gray-200 hover:border-gray-300" : "border-gray-100"}`}>
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-blue-500" : "bg-gray-200"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!n.read ? "text-gray-900 font-medium" : "text-gray-500"}`}>{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  {!n.read && <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium flex-shrink-0">New</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
