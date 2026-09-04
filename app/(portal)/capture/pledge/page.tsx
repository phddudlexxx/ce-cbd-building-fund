"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonPicker } from "@/components/PersonPicker";
import { CurrencyToggle, Field, inputClass, SaveBar, ScreenTitle } from "@/components/ui";
import { PLEDGE_FREQUENCIES } from "@/lib/categories";
import { asCurrency, lastCurrency, parseMoney, rememberCurrency, todayISO, type Currency } from "@/lib/money";
import type { Pledge } from "@/lib/types";
import { useData } from "@/lib/use-data";

const STATUSES: Pledge["status"][] = ["active", "fulfilled", "lapsed", "cancelled"];

function PledgeForm() {
  const { store, mutate } = useData();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const existing = store?.pledges.find((p) => p.id === editId);

  const [personId, setPersonId] = useState("");
  const [currency, setCurrency] = useState<Currency>(lastCurrency);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [startDate, setStartDate] = useState(todayISO());
  const [status, setStatus] = useState<Pledge["status"]>("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!existing) return;
    setPersonId(existing.personId);
    setCurrency(asCurrency(existing.currency));
    setAmount(String(existing.amount));
    setFrequency(existing.frequency);
    setStartDate(existing.startDate || todayISO());
    setStatus(existing.status);
    setNotes(existing.notes);
  }, [existing]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!personId) return setError("Choose who made the pledge.");
    const value = parseMoney(amount);
    if (value <= 0) return setError("Enter the pledged amount.");
    setSaving(true);
    setError("");
    rememberCurrency(currency);
    const record: Pledge = {
      id: existing?.id ?? crypto.randomUUID(),
      personId,
      amount: value,
      currency,
      frequency: frequency as Pledge["frequency"],
      startDate,
      endDate: existing?.endDate ?? "",
      notes,
      status,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    try {
      await mutate({ op: "upsert", collection: "pledges", record });
      router.push("/reports?tab=Pledges");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!existing) return;
    if (!confirm("Delete this pledge? Cash already received stays in the books.")) return;
    setSaving(true);
    try {
      await mutate({ op: "delete", collection: "pledges", id: existing.id });
      router.push("/reports?tab=Pledges");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <ScreenTitle
        title={existing ? "Edit pledge" : "New pledge"}
        subtitle="A promise to give. Record the cash later when it actually arrives."
      />
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
        {existing ? (
          <Field label="Status">
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as Pledge["status"])}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Note (optional)">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. towards the sanctuary" />
        </Field>
      </div>
      <SaveBar
        saving={saving}
        error={error}
        onCancel={() => undefined}
        onDelete={existing ? () => void onDelete() : undefined}
        label={existing ? "Save changes" : "Save pledge"}
      />
    </form>
  );
}

export default function PledgeCapturePage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-[var(--muted)]">Loading…</p>}>
      <PledgeForm />
    </Suspense>
  );
}
