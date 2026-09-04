"use client";

import { Card, ScreenTitle } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export default function GuidePage() {
  return (
    <div className="space-y-4">
      <ScreenTitle
        title="What other ministries collect"
        subtitle="This portal follows how church building campaigns are usually kept — pledges separate from cash, in-kind at fair value, and spend in a few buckets."
      />

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--purple-deep)]">
          The four books
        </h3>
        <p className="mt-2 text-sm leading-relaxed">
          Every amount is tagged <strong>USD$</strong> or <strong>ZWG$</strong>. Both are primary. Do not convert one into the other or add them into a single total — a dollar is not a ZiG.
        </p>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--ink)]">
          <li>
            <strong>Pledges</strong> — a promise over weeks or years. Never treat this as money you can spend.
            Track who, how much, how often, and how much has actually been paid.
          </li>
          <li>
            <strong>Cash donations</strong> — money in the bank or in the offering. Tag it as a one-off, a pledge
            payment, a fundraising event, a grant, or a loan draw.
          </li>
          <li>
            <strong>In-kind</strong> — bricks, cement, labour, professional time, chairs. Record quantity, a fair
            estimated value, and which building category it offsets. It is funding, but it is not cash.
          </li>
          <li>
            <strong>Expenditure</strong> — bills and payments. Code each one to a category, keep the supplier and
            invoice number, and mark whether it is paid yet.
          </li>
        </ul>
      </Card>

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--purple-deep)]">
          Why only eleven expense categories
        </h3>
        <p className="mt-2 text-sm leading-relaxed">
          Building campaigns that try to make “bricks”, “cement”, “sand”, “transport” and “casual labour” into
          separate accounts end up with reports nobody can read. Ministries that finish well keep a short chart of
          accounts and put the detail in the description. The eleven buckets here match how church construction
          budgets are usually presented to a board:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {EXPENSE_CATEGORIES.map((c) => (
            <li key={c.id}>
              <strong>{c.name}.</strong> {c.hint}.
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--purple-deep)]">
          Extra fields that save pain later
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>Donor name and phone — for follow-up on outstanding pledges and year-end thank-you letters.</li>
          <li>Receipt number — auto-issued on every cash gift, needed if the church issues tax receipts.</li>
          <li>Bank / slip reference — so you can tick the bank statement.</li>
          <li>Invoice number and unpaid flag — contractors often invoice before you pay, including retention.</li>
          <li>Anonymous giver — some people will only give if they are not named on a list.</li>
          <li>Campaign goal and category budgets — so you can say “we are on track” with evidence.</li>
        </ul>
      </Card>

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--purple-deep)]">
          Numbers leadership will ask for
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>How much is pledged vs how much has actually come in.</li>
          <li>Who is behind on a pledge (the follow-up list).</li>
          <li>Cash we can spend today, not including promises.</li>
          <li>Budget vs spend vs in-kind, by category.</li>
          <li>Unpaid supplier bills.</li>
          <li>A CSV you can hand an auditor or drop into Excel.</li>
        </ul>
      </Card>
    </div>
  );
}
