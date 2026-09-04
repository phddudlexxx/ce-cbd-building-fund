"use client";

import Link from "next/link";
import { Card, ScreenTitle } from "@/components/ui";
import { formatMoney, formatPair } from "@/lib/money";
import { summarise, type CurrencyTotals } from "@/lib/summaries";
import { useData } from "@/lib/use-data";

export default function HomePage() {
  const { store, loading, error } = useData();
  if (loading || !store) {
    return <p className="py-10 text-center text-[var(--muted)]">Opening the books…</p>;
  }
  if (error) return <p className="text-red-700">{error}</p>;

  const s = summarise(store);

  return (
    <div className="space-y-4">
      <ScreenTitle
        title="Where we stand"
        subtitle="USD$ and ZWG$ are kept as two books. Never add them together — a dollar is not a ZiG."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <FundingCard label="USD$" totals={s.usd} currency="USD" />
        <FundingCard label="ZWG$" totals={s.zwg} currency="ZWG" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Pledged" usd={s.usd.pledged} zwg={s.zwg.pledged} hint="Promises, not cash" />
        <Stat
          label="Still to collect"
          usd={s.usd.outstandingPledges}
          zwg={s.zwg.outstandingPledges}
          hint="Active pledges unpaid"
        />
        <Stat
          label="Cash available"
          usd={s.usd.cashAvailable}
          zwg={s.zwg.cashAvailable}
          hint="Cash in minus paid spend"
        />
        <Stat label="Spent so far" usd={s.usd.spentAll} zwg={s.zwg.spentAll} hint="Includes unpaid bills" />
      </div>

      {s.usd.spentUnpaid > 0 || s.zwg.spentUnpaid > 0 ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Unpaid bills: {formatPair(s.usd.spentUnpaid, s.zwg.spentUnpaid)}. Cash available already excludes these until they are marked paid.
        </p>
      ) : null}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Budget vs actual</h3>
          <Link href="/budget" className="text-sm font-medium text-[var(--purple)]">
            Edit budget
          </Link>
        </div>
        <p className="mb-3 text-xs text-[var(--muted)]">Tap a category to see the exact bills inside it.</p>
        <div className="space-y-4">
          {s.byCategory
            .filter(
              (c) =>
                c.usd.budget > 0 ||
                c.usd.spent > 0 ||
                c.usd.inKind > 0 ||
                c.zwg.budget > 0 ||
                c.zwg.spent > 0 ||
                c.zwg.inKind > 0,
            )
            .map((c) => (
              <Link key={c.id} href={`/reports?cat=${c.id}`} className="block">
                <p className="mb-1.5 text-sm font-medium text-[var(--purple)]">{c.name}</p>
                <Bar currency="USD" line={c.usd} />
                <Bar currency="ZWG" line={c.zwg} />
              </Link>
            ))}
          {s.byCategory.every(
            (c) =>
              c.usd.budget === 0 &&
              c.usd.spent === 0 &&
              c.usd.inKind === 0 &&
              c.zwg.budget === 0 &&
              c.zwg.spent === 0 &&
              c.zwg.inKind === 0,
          ) ? (
            <p className="text-sm text-[var(--muted)]">
              No budget or spend yet. Capture an expense or set budgets to see this fill in.
            </p>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Quick href="/capture/pledge" title="Pledge" />
        <Quick href="/capture/cash" title="Cash" />
        <Quick href="/capture/inkind" title="In-kind" />
        <Quick href="/capture/expense" title="Spend" />
      </div>
    </div>
  );
}

function FundingCard({
  label,
  totals,
  currency,
}: {
  label: string;
  totals: CurrencyTotals;
  currency: "USD" | "ZWG";
}) {
  const goal = totals.goal || totals.budgetTotal;
  const fundedPct = goal > 0 ? Math.min(100, Math.round((totals.fundingReceived / goal) * 100)) : 0;
  return (
    <Card className="bg-[var(--purple)] text-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
        {label} received
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">
        {formatMoney(totals.fundingReceived, currency)}
      </p>
      <p className="mt-1 text-sm text-white/75">
        {formatMoney(totals.cashIn, currency)} cash + {formatMoney(totals.inKindValue, currency)} in-kind
      </p>
      {goal > 0 ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-white/80">
            <span>{fundedPct}% of goal</span>
            <span>{formatMoney(goal, currency)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-[var(--gold)]" style={{ width: `${fundedPct}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-white/70">Set a {label} goal under More → Settings.</p>
      )}
    </Card>
  );
}

function Bar({
  currency,
  line,
}: {
  currency: "USD" | "ZWG";
  line: { budget: number; spent: number; inKind: number; remaining: number };
}) {
  if (line.budget === 0 && line.spent === 0 && line.inKind === 0) return null;
  const used = line.spent + line.inKind;
  const pct = line.budget > 0 ? Math.min(100, Math.round((used / line.budget) * 100)) : 0;
  return (
    <div className="mb-1.5">
      <div className="mb-0.5 flex items-baseline justify-between gap-2">
        <span className="text-xs text-[var(--muted)]">{currency}$</span>
        <span className="text-xs text-[var(--muted)]">
          {formatMoney(used, currency)} / {formatMoney(line.budget, currency)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--cream)]">
        <div
          className={`h-full ${line.remaining < 0 ? "bg-red-600" : "bg-[var(--purple)]"}`}
          style={{ width: `${line.budget ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  usd,
  zwg,
  hint,
}: {
  label: string;
  usd: number;
  zwg: number;
  hint: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-tight">{formatMoney(usd, "USD")}</p>
      <p className="text-sm font-semibold leading-tight">{formatMoney(zwg, "ZWG")}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </Card>
  );
}

function Quick({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--line)] bg-white px-4 py-4 text-center font-semibold text-[var(--purple)] shadow-[0_8px_24px_rgba(46,15,69,0.04)]"
    >
      {title}
    </Link>
  );
}
