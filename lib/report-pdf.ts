import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { EXPENSE_CATEGORIES, GIFT_TYPES, PAYMENT_METHODS } from "./categories";
import { asCurrency, formatDate, formatMoney } from "./money";
import { personName, pledgePaid, summarise } from "./summaries";
import type { Store } from "./types";

const PURPLE: [number, number, number] = [76, 29, 106];
const GOLD: [number, number, number] = [196, 162, 74];
const INK: [number, number, number] = [28, 20, 36];
const MUTED: [number, number, number] = [109, 97, 120];

function clean(value: string) {
  return value.replace(/[^\u0020-\u007E]/g, " ").replace(/\s+/g, " ").trim();
}

function money(amount: number, currency: "USD" | "ZWG") {
  return clean(formatMoney(amount, currency));
}

function lastY(doc: jsPDF) {
  const table = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return table?.finalY ?? 26;
}

function startTable(doc: jsPDF, needed = 28) {
  const y = lastY(doc);
  if (y > 190 - needed) {
    doc.addPage();
    return 28;
  }
  return y + 8;
}

function heading(doc: jsPDF, title: string) {
  const y = startTable(doc, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PURPLE);
  doc.text(title, 14, y);
  return y + 3;
}

function table(doc: jsPDF, head: string[], body: string[][], startY: number) {
  autoTable(doc, {
    head: [head],
    body,
    startY,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.6,
      textColor: INK,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: PURPLE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [246, 241, 232] },
    margin: { left: 14, right: 14, top: 26, bottom: 16 },
  });
}

function paintChrome(doc: jsPDF, store: Store, printed: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, 297, 22, "F");
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(clean(store.settings.churchName).toUpperCase(), 14, 8);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(clean(store.settings.campaignName), 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Landscape A4  ·  USD$ and ZWG$ not combined", 283, 8, { align: "right" });
    doc.text(printed, 283, 16, { align: "right" });
    doc.setFillColor(...GOLD);
    doc.rect(0, 22, 297, 1.2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Confidential  ·  Christ Embassy CBD building fund", 14, 202);
    doc.text(`Page ${i} of ${pages}`, 283, 202, { align: "right" });
  }
}

export function buildingFundPdf(store: Store, categoryId?: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const printed = `Printed ${formatDate(new Date().toISOString().slice(0, 10))}`;
  const summary = summarise(store);
  const cat = categoryId ? EXPENSE_CATEGORIES.find((c) => c.id === categoryId) : undefined;

  if (cat) {
    const line = summary.byCategory.find((c) => c.id === cat.id);
    let y = heading(doc, cat.name);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(clean(cat.hint), 14, y + 5);
    table(
      doc,
      ["", "USD$", "ZWG$"],
      [
        ["Budget", money(line?.usd.budget ?? 0, "USD"), money(line?.zwg.budget ?? 0, "ZWG")],
        ["Bills", money(line?.usd.spent ?? 0, "USD"), money(line?.zwg.spent ?? 0, "ZWG")],
        ["In-kind", money(line?.usd.inKind ?? 0, "USD"), money(line?.zwg.inKind ?? 0, "ZWG")],
        ["Still needed", money(line?.usd.remaining ?? 0, "USD"), money(line?.zwg.remaining ?? 0, "ZWG")],
      ],
      y + 8,
    );

    y = heading(doc, "Bills in this category");
    const bills = store.expenses
      .filter((e) => e.categoryId === cat.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    table(
      doc,
      ["Date", "Payee", "What for", "Invoice", "How", "Status", "Amount"],
      bills.length
        ? bills.map((e) => [
            formatDate(e.date),
            clean(e.payee),
            clean(e.description),
            clean(e.invoiceNo),
            PAYMENT_METHODS.find((m) => m.id === e.method)?.name ?? e.method,
            e.paid ? "Paid" : "Unpaid",
            money(e.amount, asCurrency(e.currency)),
          ])
        : [["—", "No expenditure captured yet", "", "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "In-kind offsetting this category");
    const gifts = store.inKind
      .filter((g) => g.categoryId === cat.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    table(
      doc,
      ["Date", "From", "What", "Qty", "Value"],
      gifts.length
        ? gifts.map((g) => [
            formatDate(g.date),
            clean(personName(store, g.personId)),
            clean(g.description),
            `${g.quantity} ${g.unit}`,
            money(g.estimatedValue, asCurrency(g.currency)),
          ])
        : [["—", "No in-kind tagged here", "", "", ""]],
      y + 2,
    );
  } else {
    let y = heading(doc, "Board snapshot");
    table(
      doc,
      ["", "USD$", "ZWG$"],
      [
        ["Campaign goal", money(summary.usd.goal, "USD"), money(summary.zwg.goal, "ZWG")],
        ["Total pledged", money(summary.usd.pledged, "USD"), money(summary.zwg.pledged, "ZWG")],
        ["Outstanding pledges", money(summary.usd.outstandingPledges, "USD"), money(summary.zwg.outstandingPledges, "ZWG")],
        ["Cash received", money(summary.usd.cashIn, "USD"), money(summary.zwg.cashIn, "ZWG")],
        ["In-kind received", money(summary.usd.inKindValue, "USD"), money(summary.zwg.inKindValue, "ZWG")],
        ["Funding received", money(summary.usd.fundingReceived, "USD"), money(summary.zwg.fundingReceived, "ZWG")],
        ["Spent (all bills)", money(summary.usd.spentAll, "USD"), money(summary.zwg.spentAll, "ZWG")],
        ["Unpaid bills", money(summary.usd.spentUnpaid, "USD"), money(summary.zwg.spentUnpaid, "ZWG")],
        ["Cash available", money(summary.usd.cashAvailable, "USD"), money(summary.zwg.cashAvailable, "ZWG")],
      ],
      y + 2,
    );

    y = heading(doc, "Budget vs actual by category");
    table(
      doc,
      ["Category", "USD budget", "USD bills", "USD in-kind", "USD left", "ZWG budget", "ZWG bills", "ZWG in-kind", "ZWG left"],
      summary.byCategory.map((c) => [
        c.name,
        money(c.usd.budget, "USD"),
        money(c.usd.spent, "USD"),
        money(c.usd.inKind, "USD"),
        money(c.usd.remaining, "USD"),
        money(c.zwg.budget, "ZWG"),
        money(c.zwg.spent, "ZWG"),
        money(c.zwg.inKind, "ZWG"),
        money(c.zwg.remaining, "ZWG"),
      ]),
      y + 2,
    );

    y = heading(doc, "Pledges");
    table(
      doc,
      ["Name", "Pledged", "Paid", "Left", "Status"],
      store.pledges.length
        ? store.pledges.map((p) => {
            const paid = pledgePaid(store, p.id);
            const currency = asCurrency(p.currency);
            return [
              clean(personName(store, p.personId)),
              money(p.amount, currency),
              money(paid, currency),
              money(Math.max(0, p.amount - paid), currency),
              p.status,
            ];
          })
        : [["No pledges yet", "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "Cash received");
    table(
      doc,
      ["Date", "Receipt", "Name", "Amount", "How", "Type"],
      store.donations.length
        ? store.donations.map((d) => [
            formatDate(d.date),
            d.receiptNo,
            clean(personName(store, d.personId)),
            money(d.amount, asCurrency(d.currency)),
            PAYMENT_METHODS.find((m) => m.id === d.method)?.name ?? d.method,
            GIFT_TYPES.find((g) => g.id === d.giftType)?.name ?? d.giftType,
          ])
        : [["No cash received yet", "", "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "In-kind");
    table(
      doc,
      ["Date", "From", "What", "Qty", "Value", "Offsets"],
      store.inKind.length
        ? store.inKind.map((g) => [
            formatDate(g.date),
            clean(personName(store, g.personId)),
            clean(g.description),
            `${g.quantity} ${g.unit}`,
            money(g.estimatedValue, asCurrency(g.currency)),
            EXPENSE_CATEGORIES.find((c) => c.id === g.categoryId)?.name ?? g.categoryId,
          ])
        : [["No in-kind yet", "", "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "Expenditure");
    table(
      doc,
      ["Date", "Category", "Payee", "What for", "Invoice", "Status", "Amount"],
      store.expenses.length
        ? store.expenses.map((e) => [
            formatDate(e.date),
            EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId)?.name ?? e.categoryId,
            clean(e.payee),
            clean(e.description),
            clean(e.invoiceNo),
            e.paid ? "Paid" : "Unpaid",
            money(e.amount, asCurrency(e.currency)),
          ])
        : [["No expenses yet", "", "", "", "", "", ""]],
      y + 2,
    );
  }

  paintChrome(doc, store, printed);
  return doc.output("arraybuffer") as ArrayBuffer;
}

export function reportFileName(categoryId?: string) {
  const day = new Date().toISOString().slice(0, 10);
  if (categoryId) {
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
    const slug = (cat?.name ?? categoryId).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `CE-CBD-${slug}-${day}.pdf`;
  }
  return `CE-CBD-building-fund-${day}.pdf`;
}
