import { NextRequest, NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { getStore } from "@/lib/db";
import { buildingFundPdf, reportFileName } from "@/lib/report-pdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const cat = req.nextUrl.searchParams.get("cat") ?? undefined;
  if (cat && !EXPENSE_CATEGORIES.some((c) => c.id === cat)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }
  const store = await getStore();
  const bytes = buildingFundPdf(store, cat);
  const filename = reportFileName(cat);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
