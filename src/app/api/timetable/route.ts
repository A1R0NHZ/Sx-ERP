import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const timetables = await prisma.timetable.findMany({
    include: { locations: true, faculty: { select: { name: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(timetables);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || !["FACULTY", "REGISTRAR"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { subject, dayOfWeek, startTime, endTime, facultyId, locations } = await req.json();

  if (!subject || dayOfWeek === undefined || !startTime || !endTime || !locations?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const timetable = await prisma.timetable.create({
    data: {
      subject,
      dayOfWeek,
      startTime,
      endTime,
      facultyId: facultyId ?? user.id,
      locations: {
        create: locations.slice(0, 5).map((l: any) => ({
          latitude: l.latitude,
          longitude: l.longitude,
          label: l.label ?? null,
        })),
      },
    },
    include: { locations: true },
  });

  return NextResponse.json(timetable, { status: 201 });
}
