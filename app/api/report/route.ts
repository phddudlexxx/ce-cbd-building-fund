import { NextRequest, NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { getStore } from "@/lib/db";
import { asCurrency } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const cat = req.nextUrl.searchParams.get("cat") ?? undefined;
  if (cat && !EXPENSE_CATEGORIES.some((c) => c.id === cat)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }
  const currency = asCurrency(req.nextUrl.searchParams.get("ccy"));
  const store = await getStore();
  const { buildingFundPdf, reportFileName } = await import("@/lib/report-pdf");
  const options = { categoryId: cat, currency };
  const bytes = buildingFundPdf(store, options);
  const filename = reportFileName(options);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
