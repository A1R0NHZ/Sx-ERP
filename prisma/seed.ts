import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const hash = (p: string) => bcrypt.hash(p, 10);

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing data (order matters for FK constraints) ──────────────
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classLocation.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.user.deleteMany();

  // ── Registrar ────────────────────────────────────────────────────────────
  const registrar = await prisma.user.create({
    data: {
      name: "Admin Registrar",
      email: "registrar@erp.com",
      password: await hash("admin123"),
      role: "REGISTRAR",
    },
  });

  // ── Faculty ──────────────────────────────────────────────────────────────
  const [f1, f2, f3] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Dr. Sarah Smith",
        email: "faculty@erp.com",
        password: await hash("faculty123"),
        role: "FACULTY",
        facultyId: "FAC001",
      },
    }),
    prisma.user.create({
      data: {
        name: "Prof. James Lee",
        email: "james.lee@erp.com",
        password: await hash("faculty123"),
        role: "FACULTY",
        facultyId: "FAC002",
      },
    }),
    prisma.user.create({
      data: {
        name: "Dr. Aisha Patel",
        email: "aisha.patel@erp.com",
        password: await hash("faculty123"),
        role: "FACULTY",
        facultyId: "FAC003",
      },
    }),
  ]);

  // ── Students ─────────────────────────────────────────────────────────────
  const studentData = [
    { name: "John Doe",       email: "student@erp.com",       studentId: "STU001" },
    { name: "Emma Wilson",    email: "emma.wilson@erp.com",   studentId: "STU002" },
    { name: "Liam Johnson",   email: "liam.j@erp.com",        studentId: "STU003" },
    { name: "Sophia Brown",   email: "sophia.b@erp.com",      studentId: "STU004" },
    { name: "Noah Davis",     email: "noah.d@erp.com",        studentId: "STU005" },
    { name: "Olivia Martinez",email: "olivia.m@erp.com",      studentId: "STU006" },
    { name: "Ethan Garcia",   email: "ethan.g@erp.com",       studentId: "STU007" },
    { name: "Ava Thompson",   email: "ava.t@erp.com",         studentId: "STU008" },
  ];

  const students = await Promise.all(
    studentData.map((s) =>
      prisma.user.create({
        data: { ...s, password: bcrypt.hashSync("student123", 10), role: "STUDENT" },
      })
    )
  );

  // ── Timetables ───────────────────────────────────────────────────────────
  // Kuala Lumpur area coordinates (slightly varied per room)
  const today = new Date().getDay(); // 0=Sun … 6=Sat

  const [tt1, tt2, tt3, tt4, tt5] = await Promise.all([
    prisma.timetable.create({
      data: {
        subject: "Mathematics",
        dayOfWeek: today,
        startTime: "08:00",
        endTime: "09:30",
        facultyId: f1.id,
        locations: {
          create: [
            { latitude: 3.1390, longitude: 101.6869, label: "Block A — Room 101" },
            { latitude: 3.1392, longitude: 101.6871, label: "Block A — Room 102" },
          ],
        },
      },
    }),
    prisma.timetable.create({
      data: {
        subject: "Physics",
        dayOfWeek: today,
        startTime: "10:00",
        endTime: "11:30",
        facultyId: f2.id,
        locations: {
          create: [
            { latitude: 3.1395, longitude: 101.6875, label: "Science Block — Lab 1" },
          ],
        },
      },
    }),
    prisma.timetable.create({
      data: {
        subject: "Computer Science",
        dayOfWeek: (today + 1) % 7,
        startTime: "09:00",
        endTime: "10:30",
        facultyId: f1.id,
        locations: {
          create: [
            { latitude: 3.1388, longitude: 101.6865, label: "IT Block — Lab 3" },
            { latitude: 3.1386, longitude: 101.6863, label: "IT Block — Lab 4" },
          ],
        },
      },
    }),
    prisma.timetable.create({
      data: {
        subject: "Chemistry",
        dayOfWeek: (today + 2) % 7,
        startTime: "14:00",
        endTime: "15:30",
        facultyId: f3.id,
        locations: {
          create: [
            { latitude: 3.1400, longitude: 101.6880, label: "Science Block — Chem Lab" },
          ],
        },
      },
    }),
    prisma.timetable.create({
      data: {
        subject: "English Literature",
        dayOfWeek: (today + 3) % 7,
        startTime: "11:00",
        endTime: "12:30",
        facultyId: f2.id,
        locations: {
          create: [
            { latitude: 3.1382, longitude: 101.6860, label: "Humanities Block — Room 201" },
          ],
        },
      },
    }),
  ]);

  // ── Attendance records (past 14 days) ────────────────────────────────────
  const statuses: ("PRESENT" | "ABSENT")[] = ["PRESENT", "PRESENT", "PRESENT", "ABSENT", "PRESENT"];

  const attendanceRecords: any[] = [];

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();

    // Find timetables that match this day
    const todayTTs = [tt1, tt2, tt3, tt4, tt5].filter(
      (tt) => tt.dayOfWeek === dayOfWeek
    );

    for (const tt of todayTTs) {
      for (let si = 0; si < students.length; si++) {
        const student = students[si];
        const status = statuses[(si + daysAgo) % statuses.length];
        const duration = status === "PRESENT" ? 45 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 40);

        const entryTime = new Date(date);
        entryTime.setHours(8, 0, 0, 0);
        const exitTime = new Date(entryTime.getTime() + duration * 60000);

        attendanceRecords.push({
          studentId: student.id,
          timetableId: tt.id,
          date,
          status,
          entryTime,
          exitTime,
          durationMinutes: duration,
          locationValid: status === "PRESENT",
        });
      }
    }
  }

  // Batch insert attendance
  await prisma.attendance.createMany({ data: attendanceRecords });
  console.log(`  ✓ Created ${attendanceRecords.length} attendance records`);

  // ── Notifications ─────────────────────────────────────────────────────────
  const notifData = [
    {
      senderId: students[0].id,
      recipientId: f1.id,
      message: `${students[0].name} attendance recorded for Mathematics.`,
      read: false,
    },
    {
      senderId: students[1].id,
      recipientId: f1.id,
      message: `${students[1].name} attendance recorded for Mathematics.`,
      read: false,
    },
    {
      senderId: students[2].id,
      recipientId: f2.id,
      message: `${students[2].name} attendance recorded for Physics.`,
      read: true,
    },
    {
      senderId: f1.id,
      recipientId: registrar.id,
      message: "Mathematics class session completed. 6/8 students present.",
      read: false,
    },
    {
      senderId: f2.id,
      recipientId: registrar.id,
      message: "Physics class session completed. 7/8 students present.",
      read: true,
    },
    {
      senderId: students[3].id,
      recipientId: f3.id,
      message: `${students[3].name} attendance recorded for Chemistry.`,
      read: false,
    },
  ];

  await prisma.notification.createMany({ data: notifData });
  console.log(`  ✓ Created ${notifData.length} notifications`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("  Registrar:  registrar@erp.com  / admin123");
  console.log("  Faculty:    faculty@erp.com    / faculty123");
  console.log("              james.lee@erp.com  / faculty123");
  console.log("              aisha.patel@erp.com/ faculty123");
  console.log("  Students:   student@erp.com    / student123");
  console.log("              emma.wilson@erp.com/ student123");
  console.log("              (+ 6 more students with same password)\n");
  console.log(`  Users: ${1 + 3 + 8} | Timetables: 5 | Attendance: ${attendanceRecords.length} | Notifications: ${notifData.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
