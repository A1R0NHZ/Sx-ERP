import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinRadius } from "@/lib/geo";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { timetableId, latitude, longitude } = await req.json();
  if (!timetableId || latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: { locations: true },
  });
  if (!timetable) return NextResponse.json({ error: "Timetable not found" }, { status: 404 });

  const locationValid = isWithinRadius(latitude, longitude, timetable.locations);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.upsert({
    where: { studentId_timetableId_date: { studentId: user.id, timetableId, date: today } },
    create: {
      studentId: user.id,
      timetableId,
      date: today,
      status: "IN_PROGRESS",
      entryTime: locationValid ? new Date() : null,
      locationValid,
    },
    update: {
      locationValid,
      entryTime: locationValid ? new Date() : undefined,
    },
  });

  return NextResponse.json({ attendance, locationValid });
}
