"use client";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

type NavItem = { label: string; href: string };

const roleNav: Record<string, NavItem[]> = {
  STUDENT: [
    { label: "Overview",           href: "/dashboard/student" },
    { label: "Today Classes",      href: "/dashboard/student/classes" },
    { label: "Attendance History", href: "/dashboard/student/history" },
    { label: "My Profile",         href: "/dashboard/student/profile" },
  ],
  FACULTY: [
    { label: "Overview",      href: "/dashboard/faculty" },
    { label: "Attendance",    href: "/dashboard/faculty/attendance" },
    { label: "My Classes",    href: "/dashboard/faculty/classes" },
    { label: "Notifications", href: "/dashboard/faculty/notifications" },
  ],
  REGISTRAR: [
    { label: "Overview",   href: "/dashboard/registrar" },
    { label: "Attendance", href: "/dashboard/registrar/attendance" },
    { label: "Reports",    href: "/dashboard/registrar/reports" },
    { label: "Users",      href: "/dashboard/registrar/users" },
    { label: "Timetable",  href: "/dashboard/registrar/timetable" },
  ],
};

const rolePill: Record<string, string> = {
  STUDENT:   "bg-blue-50 text-blue-700",
  FACULTY:   "bg-violet-50 text-violet-700",
  REGISTRAR: "bg-amber-50 text-amber-700",
};

function Sidebar({ user, nav, pathname, onNavClick }: {
  user: any; nav: NavItem[]; pathname: string; onNavClick?: () => void;
}): React.ReactElement {
  const roleLabel = user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "220px", height: "100%", backgroundColor: "white", borderRight: "1px solid #f0f0f0" }}>
      <div style={{ height: "56px", padding: "0 20px", display: "flex", alignItems: "center", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: "10px", fontWeight: 700 }}>Sx</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Sx-ERP</span>
        </div>
      </div>
      <div style={{ padding: "12px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "12px", backgroundColor: "#f9fafb" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name ?? "..."}</p>
            <span className={rolePill[user?.role] ?? "bg-gray-100 text-gray-500"} style={{ display: "inline-block", fontSize: "10px", fontWeight: 500, padding: "1px 6px", borderRadius: "4px", marginTop: "2px" }}>{roleLabel}</span>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onNavClick}
              style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "2px", textDecoration: "none", backgroundColor: active ? "#111827" : "transparent", color: active ? "white" : "#6b7280", fontWeight: active ? 500 : 400 }}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: "12px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#9ca3af" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

interface Props { children: React.ReactNode; title?: string; }

export default function DashboardLayout({ children, title }: Props): React.ReactElement {
  const { data: session } = useSession();
  const user = session?.user as any;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = roleNav[user?.role ?? "STUDENT"] ?? [];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", overflow: "hidden", backgroundColor: "#f5f5f7" }}>
      <div className="hidden md:flex" style={{ width: "220px", flexShrink: 0, height: "100%" }}>
        <Sidebar user={user} nav={nav} pathname={pathname} />
      </div>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ width: "220px", flexShrink: 0, height: "100%", boxShadow: "4px 0 24px rgba(0,0,0,0.12)" }}>
            <Sidebar user={user} nav={nav} pathname={pathname} onNavClick={() => setMobileOpen(false)} />
          </div>
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }} onClick={() => setMobileOpen(false)} />
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <header style={{ height: "56px", backgroundColor: "white", borderBottom: "1px solid #f0f0f0", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setMobileOpen(true)} className="md:hidden" style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#6b7280" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            {title && <h1 style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: 0 }}>{title}</h1>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NotificationBell />
            <span className="hidden sm:inline" style={{ fontSize: "13px", color: "#6b7280" }}>{user?.name}</span>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>{children}</main>
      </div>
    </div>
  );
}