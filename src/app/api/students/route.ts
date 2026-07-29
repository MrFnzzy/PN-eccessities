import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { BATCHES, SECTIONS } from "@/lib/batches";

export async function GET(req: Request) {
  const session = await requireRole(["STAFF", "SOCIAL_WORKER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  let batch = searchParams.get("batch");
  const section = searchParams.get("section"); // optional: "PN1" | "PN2"

  if (session.user.role === "SOCIAL_WORKER") {
    const sw = await prisma.socialWorker.findUnique({ where: { userId: session.user.id } });
    if (!sw?.batch) return NextResponse.json({ students: [] });
    batch = sw.batch;
  }

  if (batch && !BATCHES.includes(batch as any)) {
    return NextResponse.json({ error: "Invalid batch." }, { status: 400 });
  }
  if (section && !SECTIONS.includes(section as any)) {
    return NextResponse.json({ error: "Invalid section." }, { status: 400 });
  }

  const students = await prisma.student.findMany({
    where: {
      ...(batch ? { batch: batch as any } : {}),
      ...(section ? { section: section as any } : {}),
    },
    include: {
      user: { select: { email: true } },
      receipts: { select: { id: true, status: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ students });
}
