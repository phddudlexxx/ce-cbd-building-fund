"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyToggle, Field, inputClass, SaveBar, ScreenTitle } from "@/components/ui";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/categories";
import { lastCurrency, parseMoney, rememberCurrency, todayISO, type Currency } from "@/lib/money";
import type { Expense } from "@/lib/types";
import { useData } from "@/lib/use-data";

export default function ExpenseCapturePage() {
  const { mutate } = useData();
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("structure");
  const [currency, setCurrency] = useState<Currency>(lastCurrency);
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [invoiceNo, setInvoiceNo] = useState("");
  const [method, setMethod] = useState("eft");
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cat = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = parseMoney(amount);
    if (value <= 0) return setError("Enter the amount.");
    if (!payee.trim()) return setError("Who was this paid to?");
    if (!description.trim()) return setError("A short description helps the report stay readable.");
    setSaving(true);
    setError("");
    rememberCurrency(currency);
    const record: Expense = {
      id: crypto.randomUUID(),
      categoryId: categoryId as Expense["categoryId"],
      amount: value,
      currency,
      date,
      payee: payee.trim(),
      description: description.trim(),
      invoiceNo: invoiceNo.trim(),
      method: method as Expense["method"],
      paid,
      notes,
      createdAt: new Date().toISOString(),
    };
    try {
      await mutate({ op: "upsert", collection: "expenses", record });
      router.push("/capture");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <ScreenTitle
        title="Spend"
        subtitle="Pick one of the eleven building buckets. Do not create a new category for every supplier or bag of cement."
      />
      <div className="space-y-4">
        <Field label="Category">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {cat ? <span className="mt-1 block text-xs text-[var(--muted)]">{cat.hint}</span> : null}
        </Field>
        <CurrencyToggle value={currency} onChange={setCurrency} />
        <Field label={`Amount (${currency}$)`}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Paid to">
          <input
            className={inputClass}
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="Supplier or contractor"
          />
        </Field>
        <Field label="What for">
          <input
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 2 000 bricks + delivery"
          />
        </Field>
        <Field label="Date">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Invoice / slip no. (optional)">
          <input className={inputClass} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
        </Field>
        <Field label="Paid with">
          <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="size-5" />
          <span className="text-sm font-medium">Already paid</span>
        </label>
        <Field label="Note (optional)">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <SaveBar saving={saving} error={error} onCancel={() => undefined} label="Save expense" />
    </form>
  );
}
