"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { Card, ScreenTitle } from "@/components/ui";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type ExpenseCategoryId } from "@/lib/categories";
import { asCurrency, formatDate, formatMoney, formatPair } from "@/lib/money";
import { personName, pledgePaid, summarise } from "@/lib/summaries";
import type { Store } from "@/lib/types";
import { useData } from "@/lib/use-data";

const tabs = ["Snapshot", "Pledges", "Cash", "In-kind", "Spend"] as const;

export default function ReportsPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-[var(--muted)]">Building reports…</p>}>
      <ReportsInner />
    </Suspense>
  );
}

function ReportsInner() {
  const { store, loading } = useData();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab = tabs.includes(tabParam as (typeof tabs)[number]) ? (tabParam as (typeof tabs)[number]) : "Snapshot";
  const openId = params.get("cat") as ExpenseCategoryId | null;
  const summary = useMemo(() => (store ? summarise(store) : null), [store]);

  if (loading || !store || !summary) {
    return <p className="py-10 text-center text-[var(--muted)]">Building reports…</p>;
  }

  const openCategory = EXPENSE_CATEGORIES.find((c) => c.id === openId);

  return (
    <div>
      <ScreenTitle
        title="Reports"
        subtitle="Tap a category to see every bill. Open Pledges, Cash, In-kind or Spend and tap Edit to fix a record."
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === "Snapshot" ? "/reports" : `/reports?tab=${t}`}
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

      {openCategory ? <CategoryDetail store={store} categoryId={openCategory.id} /> : null}

      {!openCategory && tab === "Snapshot" ? (
        <div className="space-y-3">
          <Card>
            <h3 className="font-semibold">Board snapshot</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Campaign goal" v={formatPair(summary.usd.goal, summary.zwg.goal)} />
              <Row k="Total pledged" v={formatPair(summary.usd.pledged, summary.zwg.pledged)} />
              <Row k="Outstanding pledges" v={formatPair(summary.usd.outstandingPledges, summary.zwg.outstandingPledges)} />
              <Row k="Cash received" v={formatPair(summary.usd.cashIn, summary.zwg.cashIn)} />
              <Row k="In-kind received" v={formatPair(summary.usd.inKindValue, summary.zwg.inKindValue)} />
              <Row k="Total funding received" v={formatPair(summary.usd.fundingReceived, summary.zwg.fundingReceived)} />
              <Row k="Spent (all bills)" v={formatPair(summary.usd.spentAll, summary.zwg.spentAll)} />
              <Row k="Unpaid bills" v={formatPair(summary.usd.spentUnpaid, summary.zwg.spentUnpaid)} />
              <Row k="Cash available" v={formatPair(summary.usd.cashAvailable, summary.zwg.cashAvailable)} />
              <Row
                k="If remaining pledges come in"
                v={formatPair(
                  summary.usd.cashAvailable + summary.usd.outstandingPledges,
                  summary.zwg.cashAvailable + summary.zwg.outstandingPledges,
                )}
              />
            </dl>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Do not spend against pledges. Cash available in each currency is the only number that can pay a supplier in that currency today.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold">By building category</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">Tap a line to open the bills in that bucket.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">USD$ budget</th>
                    <th className="pb-2 font-medium">USD$ used</th>
                    <th className="pb-2 font-medium">ZWG$ budget</th>
                    <th className="pb-2 font-medium">ZWG$ used</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byCategory.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--line)]">
                      <td className="py-2 pr-2">
                        <Link href={`/reports?cat=${c.id}`} className="font-medium text-[var(--purple)]">
                          {c.name}
                        </Link>
                      </td>
                      <td>{formatMoney(c.usd.budget, "USD")}</td>
                      <td className={c.usd.remaining < 0 ? "text-red-700" : ""}>
                        {formatMoney(c.usd.spent + c.usd.inKind, "USD")}
                      </td>
                      <td>{formatMoney(c.zwg.budget, "ZWG")}</td>
                      <td className={c.zwg.remaining < 0 ? "text-red-700" : ""}>
                        {formatMoney(c.zwg.spent + c.zwg.inKind, "ZWG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <a
            href="/api/report"
            className="block rounded-2xl bg-[var(--purple)] py-3.5 text-center font-semibold text-white"
          >
            Download PDF (landscape)
          </a>
          <a
            href="/api/export"
            className="block rounded-2xl border border-[var(--line)] bg-white py-3.5 text-center font-semibold text-[var(--purple)]"
          >
            Download CSV for Excel
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
                {store.pledges.map((p) => {
                  const paid = pledgePaid(store, p.id);
                  const currency = asCurrency(p.currency);
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
            {store.pledges.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted)]">No pledges yet.</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {!openCategory && tab === "Cash" ? (
        <Ledger
          rows={store.donations.map((d) => [
            formatDate(d.date),
            d.receiptNo,
            personName(store, d.personId),
            formatMoney(d.amount, asCurrency(d.currency)),
            d.method.toUpperCase(),
          ])}
          hrefs={store.donations.map((d) => `/capture/cash?id=${d.id}`)}
          heads={["Date", "Receipt", "Name", "Amount", "How"]}
          empty="No cash received yet."
        />
      ) : null}

      {!openCategory && tab === "In-kind" ? (
        <Ledger
          rows={store.inKind.map((g) => [
            formatDate(g.date),
            personName(store, g.personId),
            g.description,
            `${g.quantity} ${g.unit}`,
            formatMoney(g.estimatedValue, asCurrency(g.currency)),
            EXPENSE_CATEGORIES.find((c) => c.id === g.categoryId)?.name ?? g.categoryId,
          ])}
          hrefs={store.inKind.map((g) => `/capture/inkind?id=${g.id}`)}
          heads={["Date", "From", "What", "Qty", "Value", "Offsets"]}
          empty="No in-kind gifts yet."
        />
      ) : null}

      {!openCategory && tab === "Spend" ? (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {EXPENSE_CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/reports?cat=${c.id}`}
                className="whitespace-nowrap rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--purple)]"
              >
                {c.name}
              </Link>
            ))}
          </div>
          <Ledger
            rows={store.expenses.map((e) => [
              formatDate(e.date),
              EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId)?.name ?? e.categoryId,
              e.payee,
              e.description,
              formatMoney(e.amount, asCurrency(e.currency)),
              e.paid ? "Paid" : "Unpaid",
            ])}
            hrefs={store.expenses.map((e) => `/capture/expense?id=${e.id}`)}
            heads={["Date", "Category", "Payee", "What", "Amount", "Status"]}
            empty="No expenses yet."
          />
        </div>
      ) : null}
    </div>
  );
}

function CategoryDetail({ store, categoryId }: { store: Store; categoryId: ExpenseCategoryId }) {
  const router = useRouter();
  const cat = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
  const summary = summarise(store).byCategory.find((c) => c.id === categoryId);
  const bills = store.expenses
    .filter((e) => e.categoryId === categoryId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const gifts = store.inKind
    .filter((g) => g.categoryId === categoryId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!cat || !summary) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => router.push("/reports")}
        className="text-sm font-medium text-[var(--purple)]"
      >
        ← All categories
      </button>
      <a
        href={`/api/report?cat=${categoryId}`}
        className="block rounded-2xl bg-[var(--purple)] py-3.5 text-center font-semibold text-white"
      >
        Download this category as PDF (landscape)
      </a>
      <Card className="bg-[var(--purple)] text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Category</p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl">{cat.name}</h3>
        <p className="mt-1 text-sm text-white/75">{cat.hint}</p>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Budget</dt>
            <dd>{formatPair(summary.usd.budget, summary.zwg.budget)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Bills</dt>
            <dd>{formatPair(summary.usd.spent, summary.zwg.spent)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">In-kind</dt>
            <dd>{formatPair(summary.usd.inKind, summary.zwg.inKind)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Still needed</dt>
            <dd>{formatPair(summary.usd.remaining, summary.zwg.remaining)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="font-semibold">Bills in this category</h3>
        {bills.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No expenditure captured here yet.</p>
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
                  <p className="shrink-0 font-semibold">{formatMoney(e.amount, asCurrency(e.currency))}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold">In-kind offsetting this category</h3>
        {gifts.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No gifts in kind tagged here.</p>
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
                  <p className="shrink-0 font-semibold">
                    {formatMoney(g.estimatedValue, asCurrency(g.currency))}
                  </p>
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
