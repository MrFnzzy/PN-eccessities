import { NextResponse } from "next/server";
import { requireSession } from "@/lib/guard";
import { getBatchSettingsSummary, setFirstYearBatch } from "@/lib/batchSettings";

// Public: the current First/Second/Third Year → batch-year mapping isn't
// sensitive, and is needed on the public registration page as well as every
// signed-in dashboard.
export async function GET() {
  const summary = await getBatchSettingsSummary();
  return NextResponse.json(summary);
}

// Only a class rep or an admin may correct/override the mapping. Doing so
// resets the 12-month auto-rotation clock starting from now.
export async function PATCH(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const isClassRep = session.user.role === "STUDENT" && session.user.isClassRep;
  const isAdmin = session.user.role === "ADMIN";
  if (!isClassRep && !isAdmin) {
    return NextResponse.json({ error: "Only a class rep or admin can change this." }, { status: 403 });
  }

  const body = await req.json();
  const firstYear = Number(body.firstYear);
  if (!Number.isInteger(firstYear) || firstYear < 2015 || firstYear > 2060) {
    return NextResponse.json({ error: "Enter a valid year." }, { status: 400 });
  }

  await setFirstYearBatch(firstYear, session.user.id, session.user.name || undefined);
  const summary = await getBatchSettingsSummary();
  return NextResponse.json(summary);
}
