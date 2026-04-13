import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const timetableId = searchParams.get("timetableId");

  const where: any = {};
  if (user.role === "STUDENT") where.studentId = user.id;
  else if (studentId) where.studentId = studentId;
  if (timetableId) where.timetableId = timetableId;

  const records = await prisma.attendance.findMany({
    where,
    include: {
      student: { select: { name: true, studentId: true } },
      timetable: { select: { subject: true, startTime: true, endTime: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}
