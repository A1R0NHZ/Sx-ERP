import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { name, email, password, role, studentId, facultyId } = await req.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role as Role, studentId, facultyId },
  });

  return NextResponse.json({ id: user.id, name: user.name, role: user.role }, { status: 201 });
}
