import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let studentId = searchParams.get("studentId");

  if (session.user.role === "STUDENT") {
    // students may only ever see their own receipts
    studentId = session.user.profileId;
  } else if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const receipts = await prisma.receipt.findMany({
    where: { studentId: studentId! },
    orderBy: { submittedAt: "asc" },
  });

  return NextResponse.json({ receipts });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json();

  // --- Student submitting their own receipt ---
  if (session.user.role === "STUDENT") {
    if (!session.user.profileId) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 400 });
    }
    if (!body.fileUrl) {
      return NextResponse.json({ error: "Please attach your receipt." }, { status: 400 });
    }
    const receipt = await prisma.receipt.create({
      data: {
        studentId: session.user.profileId,
        fileUrl: body.fileUrl,
        periodLabel: body.periodLabel || `Submitted ${new Date().toLocaleDateString()}`,
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
        status: "PENDING",
        addedManually: false,
      },
    });
    return NextResponse.json({ ok: true, receipt });
  }

  // --- Staff adding/backdating a receipt on a student's behalf ---
  if (session.user.role === "STAFF") {
    if (!body.studentId || !body.periodLabel || !body.submittedAt) {
      return NextResponse.json(
        { error: "studentId, periodLabel, and submittedAt are required." },
        { status: 400 }
      );
    }
    const receipt = await prisma.receipt.create({
      data: {
        studentId: body.studentId,
        fileUrl: body.fileUrl || null,
        periodLabel: body.periodLabel,
        submittedAt: new Date(body.submittedAt),
        status: body.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
        staffComment: body.staffComment || null,
        addedManually: true,
        confirmedAt: body.status === "CONFIRMED" ? new Date() : null,
        confirmedById: body.status === "CONFIRMED" ? session.user.id : null,
      },
    });
    return NextResponse.json({ ok: true, receipt });
  }

  return NextResponse.json({ error: "Not authorized." }, { status: 403 });
}
