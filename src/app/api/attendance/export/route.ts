import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || !["FACULTY", "REGISTRAR"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const records = await prisma.attendance.findMany({
    include: {
      student: { select: { name: true, studentId: true } },
      timetable: { select: { subject: true } },
    },
    orderBy: { date: "desc" },
  });

  const rows = records.map((r) => ({
    Date: r.date.toISOString().split("T")[0],
    StudentID: r.student.studentId ?? r.studentId,
    StudentName: r.student.name,
    Subject: r.timetable.subject,
    Status: r.status,
    DurationMinutes: r.durationMinutes,
    LocationValid: r.locationValid ? "Yes" : "No",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance_${Date.now()}.xlsx"`,
    },
  });
}
