import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { EXPENSE_CATEGORIES, GIFT_TYPES, PAYMENT_METHODS } from "./categories";
import { asCurrency, currencyLabel, formatDate, formatMoney, type Currency } from "./money";
import { booksFor, inCurrency, personName, pledgePaid } from "./summaries";
import type { Store } from "./types";

const PURPLE: [number, number, number] = [76, 29, 106];
const GOLD: [number, number, number] = [196, 162, 74];
const INK: [number, number, number] = [28, 20, 36];
const MUTED: [number, number, number] = [109, 97, 120];

function clean(value: string) {
  return value.replace(/[^\u0020-\u007E]/g, " ").replace(/\s+/g, " ").trim();
}

function money(amount: number, currency: Currency) {
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

function paintChrome(doc: jsPDF, store: Store, printed: string, currency: Currency) {
  const pages = doc.getNumberOfPages();
  const book = `${currencyLabel(currency)} report`;
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
    doc.text(`Landscape A4  ·  ${book} only`, 283, 8, { align: "right" });
    doc.text(printed, 283, 16, { align: "right" });
    doc.setFillColor(...GOLD);
    doc.rect(0, 22, 297, 1.2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Confidential  ·  Christ Embassy CBD building fund", 14, 202);
    doc.text(`Page ${i} of ${pages}`, 283, 202, { align: "right" });
  }
}

export function buildingFundPdf(store: Store, options: { categoryId?: string; currency?: Currency } = {}) {
  const currency = asCurrency(options.currency);
  const label = currencyLabel(currency);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const printed = `Printed ${formatDate(new Date().toISOString().slice(0, 10))}`;
  const books = booksFor(store, currency);
  const cat = options.categoryId ? EXPENSE_CATEGORIES.find((c) => c.id === options.categoryId) : undefined;
  const pledges = inCurrency(store.pledges, currency);
  const donations = inCurrency(store.donations, currency);
  const giftsAll = inCurrency(store.inKind, currency);
  const expenses = inCurrency(store.expenses, currency);

  if (cat) {
    const line = books.byCategory.find((c) => c.id === cat.id)?.line;
    let y = heading(doc, `${cat.name}  ·  ${label}`);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(clean(cat.hint), 14, y + 5);
    table(
      doc,
      ["", label],
      [
        ["Budget", money(line?.budget ?? 0, currency)],
        ["Bills", money(line?.spent ?? 0, currency)],
        ["In-kind", money(line?.inKind ?? 0, currency)],
        ["Still needed", money(line?.remaining ?? 0, currency)],
      ],
      y + 8,
    );

    y = heading(doc, "Bills in this category");
    const bills = expenses.filter((e) => e.categoryId === cat.id).sort((a, b) => b.date.localeCompare(a.date));
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
            money(e.amount, currency),
          ])
        : [["—", `No ${label} expenditure captured yet`, "", "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "In-kind offsetting this category");
    const gifts = giftsAll.filter((g) => g.categoryId === cat.id).sort((a, b) => b.date.localeCompare(a.date));
    table(
      doc,
      ["Date", "From", "What", "Qty", "Value"],
      gifts.length
        ? gifts.map((g) => [
            formatDate(g.date),
            clean(personName(store, g.personId)),
            clean(g.description),
            `${g.quantity} ${g.unit}`,
            money(g.estimatedValue, currency),
          ])
        : [["—", `No ${label} in-kind tagged here`, "", "", ""]],
      y + 2,
    );
  } else {
    const t = books.totals;
    let y = heading(doc, `Board snapshot  ·  ${label}`);
    table(
      doc,
      ["", label],
      [
        ["Campaign goal", money(t.goal, currency)],
        ["Total pledged", money(t.pledged, currency)],
        ["Outstanding pledges", money(t.outstandingPledges, currency)],
        ["Cash received", money(t.cashIn, currency)],
        ["In-kind received", money(t.inKindValue, currency)],
        ["Funding received", money(t.fundingReceived, currency)],
        ["Spent (all bills)", money(t.spentAll, currency)],
        ["Unpaid bills", money(t.spentUnpaid, currency)],
        ["Cash available", money(t.cashAvailable, currency)],
      ],
      y + 2,
    );

    y = heading(doc, "Budget vs actual by category");
    table(
      doc,
      ["Category", "Budget", "Bills", "In-kind", "Left"],
      books.byCategory.map((c) => [
        c.name,
        money(c.line.budget, currency),
        money(c.line.spent, currency),
        money(c.line.inKind, currency),
        money(c.line.remaining, currency),
      ]),
      y + 2,
    );

    y = heading(doc, "Pledges");
    table(
      doc,
      ["Name", "Pledged", "Paid", "Left", "Status"],
      pledges.length
        ? pledges.map((p) => {
            const paid = pledgePaid(store, p.id);
            return [
              clean(personName(store, p.personId)),
              money(p.amount, currency),
              money(paid, currency),
              money(Math.max(0, p.amount - paid), currency),
              p.status,
            ];
          })
        : [[`No ${label} pledges yet`, "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "Cash received");
    table(
      doc,
      ["Date", "Receipt", "Name", "Amount", "How", "Type"],
      donations.length
        ? donations.map((d) => [
            formatDate(d.date),
            d.receiptNo,
            clean(personName(store, d.personId)),
            money(d.amount, currency),
            PAYMENT_METHODS.find((m) => m.id === d.method)?.name ?? d.method,
            GIFT_TYPES.find((g) => g.id === d.giftType)?.name ?? d.giftType,
          ])
        : [[`No ${label} cash received yet`, "", "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "In-kind");
    table(
      doc,
      ["Date", "From", "What", "Qty", "Value", "Offsets"],
      giftsAll.length
        ? giftsAll.map((g) => [
            formatDate(g.date),
            clean(personName(store, g.personId)),
            clean(g.description),
            `${g.quantity} ${g.unit}`,
            money(g.estimatedValue, currency),
            EXPENSE_CATEGORIES.find((c) => c.id === g.categoryId)?.name ?? g.categoryId,
          ])
        : [[`No ${label} in-kind yet`, "", "", "", "", ""]],
      y + 2,
    );

    y = heading(doc, "Expenditure");
    table(
      doc,
      ["Date", "Category", "Payee", "What for", "Invoice", "Status", "Amount"],
      expenses.length
        ? expenses.map((e) => [
            formatDate(e.date),
            EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId)?.name ?? e.categoryId,
            clean(e.payee),
            clean(e.description),
            clean(e.invoiceNo),
            e.paid ? "Paid" : "Unpaid",
            money(e.amount, currency),
          ])
        : [[`No ${label} expenses yet`, "", "", "", "", "", ""]],
      y + 2,
    );
  }

  paintChrome(doc, store, printed, currency);
  return doc.output("arraybuffer") as ArrayBuffer;
}

export function reportFileName(options: { categoryId?: string; currency?: Currency } = {}) {
  const day = new Date().toISOString().slice(0, 10);
  const book = asCurrency(options.currency);
  if (options.categoryId) {
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === options.categoryId);
    const slug = (cat?.name ?? options.categoryId).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `CE-CBD-${slug}-${book}-${day}.pdf`;
  }
  return `CE-CBD-building-fund-${book}-${day}.pdf`;
}
