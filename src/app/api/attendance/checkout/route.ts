import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MIN_DURATION_MINUTES } from "@/lib/geo";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { timetableId } = await req.json();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await prisma.attendance.findUnique({
    where: { studentId_timetableId_date: { studentId: user.id, timetableId, date: today } },
    include: { timetable: { include: { faculty: true } } },
  });

  if (!record || !record.entryTime) {
    return NextResponse.json({ error: "No active check-in found" }, { status: 404 });
  }

  const exitTime = new Date();
  const durationMinutes = Math.floor(
    (exitTime.getTime() - record.entryTime.getTime()) / 60000
  );
  const status =
    durationMinutes >= MIN_DURATION_MINUTES && record.locationValid
      ? "PRESENT"
      : "ABSENT";

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { exitTime, durationMinutes, status },
  });

  if (status === "PRESENT") {
    await prisma.notification.create({
      data: {
        senderId: user.id,
        recipientId: record.timetable.facultyId,
        message: `Student attendance recorded for ${record.timetable.subject} on ${today.toDateString()}.`,
      },
    });
  }

  return NextResponse.json({ status, durationMinutes, updated });
}
