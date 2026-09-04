"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, Field, inputClass, PrimaryButton, ScreenTitle } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatMoney, parseMoney } from "@/lib/money";
import type { BudgetLine } from "@/lib/types";
import { useData } from "@/lib/use-data";

export default function BudgetPage() {
  const { store, mutate, loading } = useData();
  const [usd, setUsd] = useState<Record<string, string>>({});
  const [zwg, setZwg] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!store) return;
    const nextUsd: Record<string, string> = {};
    const nextZwg: Record<string, string> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      const line = store.budgets.find((b) => b.categoryId === cat.id);
      nextUsd[cat.id] = line?.usd ? String(line.usd) : "";
      nextZwg[cat.id] = line?.zwg ? String(line.zwg) : "";
    }
    setUsd(nextUsd);
    setZwg(nextZwg);
  }, [store]);

  if (loading || !store) return <p className="py-10 text-center text-[var(--muted)]">Loading budget…</p>;

  async function save(e: FormEvent) {
    e.preventDefault();
    const budgets: BudgetLine[] = EXPENSE_CATEGORIES.map((c) => ({
      categoryId: c.id,
      usd: parseMoney(usd[c.id] || "0"),
      zwg: parseMoney(zwg[c.id] || "0"),
    }));
    await mutate({ op: "budgets", budgets });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalUsd = EXPENSE_CATEGORIES.reduce((sum, c) => sum + parseMoney(usd[c.id] || "0"), 0);
  const totalZwg = EXPENSE_CATEGORIES.reduce((sum, c) => sum + parseMoney(zwg[c.id] || "0"), 0);

  return (
    <form onSubmit={save} className="space-y-4">
      <ScreenTitle
        title="Project budget"
        subtitle="Set each bucket in USD$ and ZWG$ separately. Leave a box blank if that category is only in one currency."
      />
      {EXPENSE_CATEGORIES.map((c) => (
        <Card key={c.id} className="space-y-3">
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-[var(--muted)]">{c.hint}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="USD$">
              <input
                className={inputClass}
                inputMode="decimal"
                value={usd[c.id] ?? ""}
                onChange={(e) => setUsd((prev) => ({ ...prev, [c.id]: e.target.value }))}
                placeholder="0.00"
              />
            </Field>
            <Field label="ZWG$">
              <input
                className={inputClass}
                inputMode="decimal"
                value={zwg[c.id] ?? ""}
                onChange={(e) => setZwg((prev) => ({ ...prev, [c.id]: e.target.value }))}
                placeholder="0.00"
              />
            </Field>
          </div>
        </Card>
      ))}
      <p className="text-sm font-medium">
        Total: {formatMoney(totalUsd, "USD")} · {formatMoney(totalZwg, "ZWG")}
      </p>
      <PrimaryButton type="submit">{saved ? "Saved" : "Save budget"}</PrimaryButton>
    </form>
  );
}
