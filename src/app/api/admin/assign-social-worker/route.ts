import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { BATCHES } from "@/lib/batches";

export async function POST(req: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { socialWorkerId, batch } = await req.json();
  if (!socialWorkerId || !BATCHES.includes(batch)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Only one social worker per batch: unassign anyone currently on this batch.
  await prisma.socialWorker.updateMany({
    where: { batch },
    data: { batch: null },
  });

  const updated = await prisma.socialWorker.update({
    where: { id: socialWorkerId },
    data: { batch },
  });

  return NextResponse.json({ ok: true, socialWorker: updated });
}

export async function GET() {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const socialWorkers = await prisma.socialWorker.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { name: "asc" },
  });
  const staff = await prisma.staff.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { name: "asc" },
  });
  const admins = await prisma.admin.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ socialWorkers, staff, admins });
}
