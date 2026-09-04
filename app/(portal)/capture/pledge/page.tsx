"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonPicker } from "@/components/PersonPicker";
import { CurrencyToggle, Field, inputClass, SaveBar, ScreenTitle } from "@/components/ui";
import { PLEDGE_FREQUENCIES } from "@/lib/categories";
import { lastCurrency, parseMoney, rememberCurrency, todayISO, type Currency } from "@/lib/money";
import type { Pledge } from "@/lib/types";
import { useData } from "@/lib/use-data";

export default function PledgeCapturePage() {
  const { mutate } = useData();
  const router = useRouter();
  const [personId, setPersonId] = useState("");
  const [currency, setCurrency] = useState<Currency>(lastCurrency);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [startDate, setStartDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!personId) return setError("Choose who made the pledge.");
    const value = parseMoney(amount);
    if (value <= 0) return setError("Enter the pledged amount.");
    setSaving(true);
    setError("");
    rememberCurrency(currency);
    const record: Pledge = {
      id: crypto.randomUUID(),
      personId,
      amount: value,
      currency,
      frequency: frequency as Pledge["frequency"],
      startDate,
      endDate: "",
      notes,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    try {
      await mutate({ op: "upsert", collection: "pledges", record });
      router.push("/capture");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <ScreenTitle title="New pledge" subtitle="A promise to give. Record the cash later when it actually arrives." />
      <div className="space-y-4">
        <PersonPicker value={personId} onChange={setPersonId} />
        <CurrencyToggle value={currency} onChange={setCurrency} />
        <Field label={`Amount pledged (${currency}$)`}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="How they plan to give">
          <select className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {PLEDGE_FREQUENCIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pledge date">
          <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. towards the sanctuary" />
        </Field>
      </div>
      <SaveBar saving={saving} error={error} onCancel={() => undefined} label="Save pledge" />
    </form>
  );
}
