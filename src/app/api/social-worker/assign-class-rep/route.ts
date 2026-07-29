import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function POST(req: Request) {
  const session = await requireRole(["SOCIAL_WORKER"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const socialWorker = await prisma.socialWorker.findUnique({
    where: { userId: session.user.id },
  });
  if (!socialWorker?.batch) {
    return NextResponse.json({ error: "You have not been assigned a batch yet." }, { status: 403 });
  }

  const { studentId, action } = await req.json();
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || student.batch !== socialWorker.batch) {
    return NextResponse.json({ error: "Student not found in your batch." }, { status: 404 });
  }

  // Explicit removal: unassign this student without promoting anyone else.
  if (action === "remove") {
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { isClassRep: false },
    });
    return NextResponse.json({ ok: true, student: updated });
  }

  // Only one class rep per batch: clear any existing rep first.
  await prisma.student.updateMany({
    where: { batch: socialWorker.batch, isClassRep: true },
    data: { isClassRep: false },
  });

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { isClassRep: true },
  });

  return NextResponse.json({ ok: true, student: updated });
}
