import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/reset?target=attendance|notifications|timetables|all
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role !== "REGISTRAR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = new URL(req.url).searchParams.get("target");

  if (target === "attendance") {
    const { count } = await prisma.attendance.deleteMany({});
    return NextResponse.json({ deleted: count, target });
  }

  if (target === "notifications") {
    const { count } = await prisma.notification.deleteMany({});
    return NextResponse.json({ deleted: count, target });
  }

  if (target === "timetables") {
    // ClassLocation cascades via schema onDelete: Cascade
    // Attendance references timetable — delete attendance first
    await prisma.attendance.deleteMany({});
    const { count } = await prisma.timetable.deleteMany({});
    return NextResponse.json({ deleted: count, target });
  }

  if (target === "all") {
    await prisma.notification.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.timetable.deleteMany({});
    return NextResponse.json({ deleted: true, target: "all" });
  }

  return NextResponse.json({ error: "Invalid target. Use: attendance, notifications, timetables, all" }, { status: 400 });
}
