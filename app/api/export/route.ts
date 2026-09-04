import { NextRequest, NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { EXPENSE_CATEGORIES, GIFT_TYPES, INKIND_TYPES, PAYMENT_METHODS } from "@/lib/categories";
import { getStore } from "@/lib/db";
import { asCurrency, currencyLabel } from "@/lib/money";
import { formatPerson } from "@/lib/people";
import { inCurrency, personName, pledgePaid } from "@/lib/summaries";

function csv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const v = cell ?? "";
          if (/[",\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
          return v;
        })
        .join(","),
    )
    .join("\n");
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const store = await getStore();
  const currency = asCurrency(req.nextUrl.searchParams.get("ccy"));
  const label = currencyLabel(currency);
  const pledges = inCurrency(store.pledges, currency);
  const donations = inCurrency(store.donations, currency);
  const gifts = inCurrency(store.inKind, currency);
  const expenses = inCurrency(store.expenses, currency);
  const parts: string[] = [];

  parts.push(`${label} REPORT`);
  parts.push("PEOPLE");
  parts.push(
    csv([
      ["Display name", "Kind", "Title", "First name", "Surname", "Title 2", "First name 2", "Surname 2", "Phone", "Email"],
      ...store.people.map((p) => [
        formatPerson(p),
        p.kind,
        p.title,
        p.firstName,
        p.lastName,
        p.title2,
        p.firstName2,
        p.lastName2,
        p.phone,
        p.email,
      ]),
    ]),
  );

  parts.push("\nPLEDGES");
  parts.push(
    csv([
      ["Date", "Name", "Currency", "Pledged", "Paid", "Outstanding", "Frequency", "Status", "Notes"],
      ...pledges.map((p) => {
        const paid = pledgePaid(store, p.id);
        return [
          p.startDate,
          personName(store, p.personId),
          currency,
          String(p.amount),
          String(paid),
          String(Math.max(0, p.amount - paid)),
          p.frequency,
          p.status,
          p.notes,
        ];
      }),
    ]),
  );

  parts.push("\nCASH DONATIONS");
  parts.push(
    csv([
      ["Date", "Receipt", "Name", "Currency", "Amount", "Method", "Type", "Reference", "Notes"],
      ...donations.map((d) => [
        d.date,
        d.receiptNo,
        personName(store, d.personId),
        currency,
        String(d.amount),
        PAYMENT_METHODS.find((m) => m.id === d.method)?.name ?? d.method,
        GIFT_TYPES.find((g) => g.id === d.giftType)?.name ?? d.giftType,
        d.reference,
        d.notes,
      ]),
    ]),
  );

  parts.push("\nIN-KIND");
  parts.push(
    csv([
      ["Date", "Name", "Description", "Type", "Qty", "Unit", "Currency", "Value", "Offsets category", "Notes"],
      ...gifts.map((g) => [
        g.date,
        personName(store, g.personId),
        g.description,
        INKIND_TYPES.find((t) => t.id === g.type)?.name ?? g.type,
        String(g.quantity),
        g.unit,
        currency,
        String(g.estimatedValue),
        EXPENSE_CATEGORIES.find((c) => c.id === g.categoryId)?.name ?? g.categoryId,
        g.notes,
      ]),
    ]),
  );

  parts.push("\nEXPENSES");
  parts.push(
    csv([
      ["Date", "Category", "Payee", "Description", "Currency", "Amount", "Invoice", "Paid", "Method", "Notes"],
      ...expenses.map((e) => [
        e.date,
        EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId)?.name ?? e.categoryId,
        e.payee,
        e.description,
        currency,
        String(e.amount),
        e.invoiceNo,
        e.paid ? "Yes" : "No",
        PAYMENT_METHODS.find((m) => m.id === e.method)?.name ?? e.method,
        e.notes,
      ]),
    ]),
  );

  parts.push("\nBUDGET");
  parts.push(
    csv([
      ["Category", `${label} budget`],
      ...store.budgets.map((b) => [
        EXPENSE_CATEGORIES.find((c) => c.id === b.categoryId)?.name ?? b.categoryId,
        String(currency === "ZWG" ? b.zwg : b.usd),
      ]),
    ]),
  );

  const day = new Date().toISOString().slice(0, 10);
  const body = parts.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="CE-CBD-building-fund-${currency}-${day}.csv"`,
    },
  });
}
