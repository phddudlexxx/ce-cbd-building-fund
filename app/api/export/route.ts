import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { EXPENSE_CATEGORIES, GIFT_TYPES, INKIND_TYPES, PAYMENT_METHODS } from "@/lib/categories";
import { getStore } from "@/lib/db";
import { formatPerson } from "@/lib/people";
import { personName, pledgePaid } from "@/lib/summaries";

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

export async function GET() {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const store = await getStore();
  const parts: string[] = [];

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
      ...store.pledges.map((p) => {
        const paid = pledgePaid(store, p.id);
        return [
          p.startDate,
          personName(store, p.personId),
          p.currency || "USD",
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
      ...store.donations.map((d) => [
        d.date,
        d.receiptNo,
        personName(store, d.personId),
        d.currency || "USD",
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
      ...store.inKind.map((g) => [
        g.date,
        personName(store, g.personId),
        g.description,
        INKIND_TYPES.find((t) => t.id === g.type)?.name ?? g.type,
        String(g.quantity),
        g.unit,
        g.currency || "USD",
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
      ...store.expenses.map((e) => [
        e.date,
        EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId)?.name ?? e.categoryId,
        e.payee,
        e.description,
        e.currency || "USD",
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
      ["Category", "USD budget", "ZWG budget"],
      ...store.budgets.map((b) => [
        EXPENSE_CATEGORIES.find((c) => c.id === b.categoryId)?.name ?? b.categoryId,
        String(b.usd),
        String(b.zwg),
      ]),
    ]),
  );

  const body = parts.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="CE-CBD-building-fund.csv"`,
    },
  });
}
