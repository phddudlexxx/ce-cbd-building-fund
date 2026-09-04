"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { Card, CurrencyToggle, ScreenTitle } from "@/components/ui";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type ExpenseCategoryId } from "@/lib/categories";
import { asCurrency, currencyLabel, formatDate, formatMoney, type Currency } from "@/lib/money";
import { booksFor, inCurrency, personName, pledgePaid } from "@/lib/summaries";
import type { Store } from "@/lib/types";
import { useData } from "@/lib/use-data";

const tabs = ["Snapshot", "Pledges", "Cash", "In-kind", "Spend"] as const;

function reportsHref(opts: {
  tab?: (typeof tabs)[number];
  cat?: string | null;
  ccy: Currency;
}) {
  const sp = new URLSearchParams();
  sp.set("ccy", opts.ccy);
  if (opts.cat) sp.set("cat", opts.cat);
  else if (opts.tab && opts.tab !== "Snapshot") sp.set("tab", opts.tab);
  return `/reports?${sp.toString()}`;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-[var(--muted)]">Building reports…</p>}>
      <ReportsInner />
    </Suspense>
  );
}

function ReportsInner() {
  const { store, loading } = useData();
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab = tabs.includes(tabParam as (typeof tabs)[number]) ? (tabParam as (typeof tabs)[number]) : "Snapshot";
  const openId = params.get("cat") as ExpenseCategoryId | null;
  const currency = asCurrency(params.get("ccy"));
  const label = currencyLabel(currency);
  const books = useMemo(() => (store ? booksFor(store, currency) : null), [store, currency]);

  if (loading || !store || !books) {
    return <p className="py-10 text-center text-[var(--muted)]">Building reports…</p>;
  }

  const openCategory = EXPENSE_CATEGORIES.find((c) => c.id === openId);
  const pledges = inCurrency(store.pledges, currency);
  const donations = inCurrency(store.donations, currency);
  const gifts = inCurrency(store.inKind, currency);
  const expenses = inCurrency(store.expenses, currency);
  const totals = books.totals;

  return (
    <div>
      <ScreenTitle
        title={`${label} report`}
        subtitle="USD$ and ZWG$ are two separate books. Choose one, then download that report only."
      />
      <div className="mb-4">
        <CurrencyToggle
          value={currency}
          onChange={(next) => {
            router.replace(reportsHref({ tab: openCategory ? "Snapshot" : tab, cat: openId, ccy: next }));
          }}
        />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t}
            href={reportsHref({ tab: t, ccy: currency })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
              tab === t && !openCategory
                ? "bg-[var(--purple)] text-white"
                : "bg-white text-[var(--muted)] border border-[var(--line)]"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {openCategory ? <CategoryDetail store={store} categoryId={openCategory.id} currency={currency} /> : null}

      {!openCategory && tab === "Snapshot" ? (
        <div className="space-y-3">
          <Card>
            <h3 className="font-semibold">Board snapshot · {label}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Campaign goal" v={formatMoney(totals.goal, currency)} />
              <Row k="Total pledged" v={formatMoney(totals.pledged, currency)} />
              <Row k="Outstanding pledges" v={formatMoney(totals.outstandingPledges, currency)} />
              <Row k="Cash received" v={formatMoney(totals.cashIn, currency)} />
              <Row k="In-kind received" v={formatMoney(totals.inKindValue, currency)} />
              <Row k="Total funding received" v={formatMoney(totals.fundingReceived, currency)} />
              <Row k="Spent (all bills)" v={formatMoney(totals.spentAll, currency)} />
              <Row k="Unpaid bills" v={formatMoney(totals.spentUnpaid, currency)} />
              <Row k="Cash available" v={formatMoney(totals.cashAvailable, currency)} />
              <Row
                k="If remaining pledges come in"
                v={formatMoney(totals.cashAvailable + totals.outstandingPledges, currency)}
              />
            </dl>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Do not spend against pledges. Cash available in {label} is the only number that can pay a supplier in{" "}
              {label} today.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold">By building category</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">Tap a line to open the {label} bills in that bucket.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">{label} budget</th>
                    <th className="pb-2 font-medium">{label} used</th>
                  </tr>
                </thead>
                <tbody>
                  {books.byCategory.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--line)]">
                      <td className="py-2 pr-2">
                        <Link href={reportsHref({ cat: c.id, ccy: currency })} className="font-medium text-[var(--purple)]">
                          {c.name}
                        </Link>
                      </td>
                      <td>{formatMoney(c.line.budget, currency)}</td>
                      <td className={c.line.remaining < 0 ? "text-red-700" : ""}>
                        {formatMoney(c.line.spent + c.line.inKind, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <a
            href={`/api/report?ccy=${currency}`}
            className="block rounded-2xl bg-[var(--purple)] py-3.5 text-center font-semibold text-white"
          >
            Download {label} PDF
          </a>
          <a
            href={`/api/export?ccy=${currency}`}
            className="block rounded-2xl border border-[var(--line)] bg-white py-3.5 text-center font-semibold text-[var(--purple)]"
          >
            Download {label} CSV for Excel
          </a>
        </div>
      ) : null}

      {!openCategory && tab === "Pledges" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Pledged</th>
                  <th className="pb-2 font-medium">Paid</th>
                  <th className="pb-2 font-medium">Left</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {pledges.map((p) => {
                  const paid = pledgePaid(store, p.id);
                  return (
                    <tr key={p.id} className="border-t border-[var(--line)]">
                      <td className="py-2 pr-2">{personName(store, p.personId)}</td>
                      <td>{formatMoney(p.amount, currency)}</td>
                      <td>{formatMoney(paid, currency)}</td>
                      <td>{formatMoney(Math.max(0, p.amount - paid), currency)}</td>
                      <td className="capitalize">{p.status}</td>
                      <td>
                        <Link href={`/capture/pledge?id=${p.id}`} className="font-medium text-[var(--purple)]">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pledges.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted)]">No {label} pledges yet.</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {!openCategory && tab === "Cash" ? (
        <Ledger
          rows={donations.map((d) => [
            formatDate(d.date),
            d.receiptNo,
            personName(store, d.personId),
            formatMoney(d.amount, currency),
            d.method.toUpperCase(),
          ])}
          hrefs={donations.map((d) => `/capture/cash?id=${d.id}`)}
          heads={["Date", "Receipt", "Name", "Amount", "How"]}
          empty={`No ${label} cash received yet.`}
        />
      ) : null}

      {!openCategory && tab === "In-kind" ? (
        <Ledger
          rows={gifts.map((g) => [
            formatDate(g.date),
            personName(store, g.personId),
            g.description,
            `${g.quantity} ${g.unit}`,
            formatMoney(g.estimatedValue, currency),
            EXPENSE_CATEGORIES.find((c) => c.id === g.categoryId)?.name ?? g.categoryId,
          ])}
          hrefs={gifts.map((g) => `/capture/inkind?id=${g.id}`)}
          heads={["Date", "From", "What", "Qty", "Value", "Offsets"]}
          empty={`No ${label} in-kind gifts yet.`}
        />
      ) : null}

      {!openCategory && tab === "Spend" ? (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {EXPENSE_CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={reportsHref({ cat: c.id, ccy: currency })}
                className="whitespace-nowrap rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--purple)]"
              >
                {c.name}
              </Link>
            ))}
          </div>
          <Ledger
            rows={expenses.map((e) => [
              formatDate(e.date),
              EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId)?.name ?? e.categoryId,
              e.payee,
              e.description,
              formatMoney(e.amount, currency),
              e.paid ? "Paid" : "Unpaid",
            ])}
            hrefs={expenses.map((e) => `/capture/expense?id=${e.id}`)}
            heads={["Date", "Category", "Payee", "What", "Amount", "Status"]}
            empty={`No ${label} expenses yet.`}
          />
        </div>
      ) : null}
    </div>
  );
}

function CategoryDetail({
  store,
  categoryId,
  currency,
}: {
  store: Store;
  categoryId: ExpenseCategoryId;
  currency: Currency;
}) {
  const router = useRouter();
  const cat = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
  const label = currencyLabel(currency);
  const summary = booksFor(store, currency).byCategory.find((c) => c.id === categoryId);
  const bills = inCurrency(store.expenses, currency)
    .filter((e) => e.categoryId === categoryId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const gifts = inCurrency(store.inKind, currency)
    .filter((g) => g.categoryId === categoryId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!cat || !summary) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => router.push(reportsHref({ ccy: currency }))}
        className="text-sm font-medium text-[var(--purple)]"
      >
        ← All categories
      </button>
      <a
        href={`/api/report?cat=${categoryId}&ccy=${currency}`}
        className="block rounded-2xl bg-[var(--purple)] py-3.5 text-center font-semibold text-white"
      >
        Download this {label} category as PDF
      </a>
      <Card className="bg-[var(--purple)] text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Category · {label}</p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl">{cat.name}</h3>
        <p className="mt-1 text-sm text-white/75">{cat.hint}</p>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Budget</dt>
            <dd>{formatMoney(summary.line.budget, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Bills</dt>
            <dd>{formatMoney(summary.line.spent, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">In-kind</dt>
            <dd>{formatMoney(summary.line.inKind, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Still needed</dt>
            <dd>{formatMoney(summary.line.remaining, currency)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="font-semibold">Bills in this category</h3>
        {bills.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No {label} expenditure captured here yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {bills.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{e.payee}</p>
                    <p className="text-sm text-[var(--ink)]">{e.description}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDate(e.date)}
                      {e.invoiceNo ? ` · Inv ${e.invoiceNo}` : ""}
                      {` · ${PAYMENT_METHODS.find((m) => m.id === e.method)?.name ?? e.method}`}
                      {` · ${e.paid ? "Paid" : "Unpaid"}`}
                    </p>
                    {e.notes ? <p className="mt-1 text-xs text-[var(--muted)]">{e.notes}</p> : null}
                    <Link href={`/capture/expense?id=${e.id}`} className="mt-2 inline-block text-sm font-medium text-[var(--purple)]">
                      Edit
                    </Link>
                  </div>
                  <p className="shrink-0 font-semibold">{formatMoney(e.amount, currency)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold">In-kind offsetting this category</h3>
        {gifts.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No {label} gifts in kind tagged here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {gifts.map((g) => (
              <li key={g.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{g.description}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {personName(store, g.personId)} · {g.quantity} {g.unit}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatDate(g.date)}</p>
                    <Link href={`/capture/inkind?id=${g.id}`} className="mt-2 inline-block text-sm font-medium text-[var(--purple)]">
                      Edit
                    </Link>
                  </div>
                  <p className="shrink-0 font-semibold">{formatMoney(g.estimatedValue, currency)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function Ledger({
  rows,
  heads,
  empty,
  hrefs,
}: {
  rows: string[][];
  heads: string[];
  empty: string;
  hrefs?: string[];
}) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              {heads.map((h) => (
                <th key={h} className="pb-2 font-medium">
                  {h}
                </th>
              ))}
              {hrefs ? <th className="pb-2 font-medium"></th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[var(--line)]">
                {row.map((cell, j) => (
                  <td key={j} className="py-2 pr-2">
                    {cell}
                  </td>
                ))}
                {hrefs?.[i] ? (
                  <td className="py-2">
                    <Link href={hrefs[i]} className="font-medium text-[var(--purple)]">
                      Edit
                    </Link>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="py-4 text-sm text-[var(--muted)]">{empty}</p> : null}
      </div>
    </Card>
  );
}
