import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { getBatchLabel } from "@/lib/batchSettings";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// NOTE: this route used to live at
// src/app/api/receipts/[id]/acknowledgement/route.ts. It was moved to a
// flat "detail/acknowledgement" folder that reads the id from a query
// string (?id=...) instead of a dynamic route segment, purely so the
// project folder has no square-bracket path names (GitHub's web
// drag-and-drop uploader chokes on those). Behavior is unchanged.
//
// Fills the Acknowledgement Receipt template (both copies on the page) with
// this receipt's data. Voucher No. is deliberately left blank in the
// template — staff write that in by hand when the item is physically
// released.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const session = await requireRole(["STAFF"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!receipt) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

  const templatePath = path.join(
    process.cwd(),
    "src/lib/templates/acknowledgement-receipt-template.docx"
  );

  let content: Buffer;
  try {
    content = fs.readFileSync(templatePath);
  } catch (err) {
    console.error("Could not read acknowledgement receipt template:", err);
    return NextResponse.json(
      { error: "The acknowledgement receipt template is missing on the server." },
      { status: 500 }
    );
  }

  const dateLabel = new Date(receipt.submittedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const departmentClass = await getBatchLabel(receipt.student.batch);

    doc.render({
      date: dateLabel,
      receivedFrom: receipt.student.fullName,
      departmentClass,
      totalAmount: receipt.totalAmount || "",
      amountInWords: receipt.amountInWords || "",
      purpose: receipt.purpose || "",
    });

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    const safeName = receipt.student.fullName.replace(/[^a-zA-Z0-9]+/g, "_");
    const safePeriod = receipt.periodLabel.replace(/[^a-zA-Z0-9]+/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Acknowledgement_Receipt_${safeName}_${safePeriod}.docx"`,
      },
    });
  } catch (err: any) {
    console.error("Acknowledgement receipt generation failed:", err);
    return NextResponse.json(
      { error: "Could not generate the acknowledgement receipt. Please try again." },
      { status: 500 }
    );
  }
}
