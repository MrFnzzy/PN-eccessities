import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { resolveBatchAccess } from "@/lib/attendanceAccess";

const COMMENTS_INCLUDE = { comments: { orderBy: { createdAt: "asc" as const } } };

/** Adds a message to a day's attendance thread (class rep <-> social worker). */
export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const isClassRepEditor = session.user.role === "STUDENT" && session.user.isClassRep;
  const isSocialWorkerEditor = session.user.role === "SOCIAL_WORKER" || session.user.role === "ADMIN";
  if (!isClassRepEditor && !isSocialWorkerEditor) {
    return NextResponse.json({ error: "Not authorized to comment." }, { status: 403 });
  }

  const access = await resolveBatchAccess(session);
  if (!access) return NextResponse.json({ error: "Not authorized for attendance." }, { status: 403 });

  const { studentId, date, body } = await req.json();
  const text = (body || "").trim();
  if (!studentId || !date || !text) {
    return NextResponse.json({ error: "studentId, date, and body are required." }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || (access !== "ANY" && student.batch !== access)) {
    return NextResponse.json({ error: "Student is outside your batch." }, { status: 403 });
  }

  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);

  // Ensure an attendance row exists to hang the comment off (defaults to PRESENT if new).
  const attendance = await prisma.attendance.upsert({
    where: { studentId_date: { studentId, date: day } },
    update: {},
    create: { studentId, date: day, status: "PRESENT" },
  });

  await prisma.attendanceComment.create({
    data: {
      attendanceId: attendance.id,
      authorUserId: session.user.id,
      authorName: session.user.name,
      authorRole: session.user.role,
      body: text,
    },
  });

  // A class rep message raises the notification flag; a social worker reply clears it.
  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: { reviewedBySW: isSocialWorkerEditor },
    include: COMMENTS_INCLUDE,
  });

  return NextResponse.json({ ok: true, record: updated });
}

/** Marks a day's notification as read by the social worker without sending a message. */
export async function PATCH(req: Request) {
  const session = await requireSession();
  if (!session || (session.user.role !== "SOCIAL_WORKER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const access = await resolveBatchAccess(session);
  if (!access) return NextResponse.json({ error: "Not authorized for attendance." }, { status: 403 });

  const { studentId, date } = await req.json();
  if (!studentId || !date) {
    return NextResponse.json({ error: "studentId and date are required." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || (access !== "ANY" && student.batch !== access)) {
    return NextResponse.json({ error: "Student is outside your batch." }, { status: 403 });
  }

  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({ where: { studentId_date: { studentId, date: day } } });
  if (!existing) return NextResponse.json({ ok: true, record: null });

  const updated = await prisma.attendance.update({
    where: { id: existing.id },
    data: { reviewedBySW: true },
    include: COMMENTS_INCLUDE,
  });

  return NextResponse.json({ ok: true, record: updated });
}
