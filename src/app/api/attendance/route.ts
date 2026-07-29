import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { BATCHES } from "@/lib/batches";
import { resolveBatchAccess } from "@/lib/attendanceAccess";

const COMMENTS_INCLUDE = { comments: { orderBy: { createdAt: "asc" as const } } };

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let batch = searchParams.get("batch");
  const monthStart = searchParams.get("monthStart"); // ISO date, first of month

  // A plain student (not the class rep) may only ever see their own record.
  if (session.user.role === "STUDENT" && !session.user.isClassRep) {
    if (!session.user.profileId) return NextResponse.json({ students: [], records: [] });
    const start = monthStart
      ? new Date(monthStart)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const records = await prisma.attendance.findMany({
      where: { studentId: session.user.profileId, date: { gte: start, lt: end } },
      include: COMMENTS_INCLUDE,
    });
    return NextResponse.json({ students: [], records, monthStart: start.toISOString(), selfOnly: true });
  }

  const access = await resolveBatchAccess(session);
  if (!access) return NextResponse.json({ error: "Not authorized for attendance." }, { status: 403 });
  if (access !== "ANY") batch = access;

  if (!batch || !BATCHES.includes(batch as any)) {
    return NextResponse.json({ error: "Invalid or missing batch." }, { status: 400 });
  }

  const start = monthStart ? new Date(monthStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const students = await prisma.student.findMany({
    where: { batch: batch as any },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, isClassRep: true },
  });

  const records = await prisma.attendance.findMany({
    where: { studentId: { in: students.map((s: { id: string }) => s.id) }, date: { gte: start, lt: end } },
    include: COMMENTS_INCLUDE,
  });

  return NextResponse.json({ students, records, monthStart: start.toISOString() });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const access = await resolveBatchAccess(session);
  if (!access) return NextResponse.json({ error: "Not authorized for attendance." }, { status: 403 });

  const { studentId, date, status, excuseComment, socialWorkerComment } = await req.json();
  if (!studentId || !date) {
    return NextResponse.json({ error: "studentId and date are required." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || (access !== "ANY" && student.batch !== access)) {
    return NextResponse.json({ error: "Student is outside your batch." }, { status: 403 });
  }

  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);

  const isClassRepEditor = session.user.role === "STUDENT" && session.user.isClassRep;
  const isSocialWorkerEditor = session.user.role === "SOCIAL_WORKER" || session.user.role === "ADMIN";

  const data: any = { updatedAt: new Date() };
  if (status && isClassRepEditor) data.status = status;
  if (status && isSocialWorkerEditor) data.status = status;
  if (excuseComment !== undefined && isClassRepEditor) data.excuseComment = excuseComment;
  if (socialWorkerComment !== undefined && isSocialWorkerEditor) {
    data.socialWorkerComment = socialWorkerComment;
    const sw = await prisma.socialWorker.findUnique({ where: { userId: session.user.id } });
    if (sw) data.socialWorkerId = sw.id;
  }
  if (isClassRepEditor) data.markedByUserId = session.user.id;

  // Notification bookkeeping: a class rep flagging someone absent/excused raises a flag
  // for the social worker; the social worker (or admin) setting a status clears it.
  if (status) {
    if (isClassRepEditor) {
      data.reviewedBySW = status === "PRESENT";
    } else if (isSocialWorkerEditor) {
      data.reviewedBySW = true;
    }
  }

  const record = await prisma.attendance.upsert({
    where: { studentId_date: { studentId, date: day } },
    update: data,
    create: {
      studentId,
      date: day,
      status: status || "PRESENT",
      excuseComment: excuseComment || null,
      socialWorkerComment: socialWorkerComment || null,
      markedByUserId: isClassRepEditor ? session.user.id : null,
      reviewedBySW: isClassRepEditor ? status !== "ABSENT" && status !== "EXCUSED" : true,
    },
    include: COMMENTS_INCLUDE,
  });

  return NextResponse.json({ ok: true, record });
}
