"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonPicker } from "@/components/PersonPicker";
import { CurrencyToggle, Field, inputClass, SaveBar, ScreenTitle } from "@/components/ui";
import { GIFT_TYPES, PAYMENT_METHODS } from "@/lib/categories";
import { asCurrency, formatMoney, lastCurrency, parseMoney, rememberCurrency, todayISO, type Currency } from "@/lib/money";
import { pledgePaid } from "@/lib/summaries";
import type { Donation } from "@/lib/types";
import { useData } from "@/lib/use-data";

function CashForm() {
  const { store, mutate } = useData();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const existing = store?.donations.find((d) => d.id === editId);

  const [personId, setPersonId] = useState("");
  const [currency, setCurrency] = useState<Currency>(lastCurrency);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [giftType, setGiftType] = useState("donation");
  const [pledgeId, setPledgeId] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!existing) return;
    setPersonId(existing.personId);
    setCurrency(asCurrency(existing.currency));
    setAmount(String(existing.amount));
    setMethod(existing.method);
    setGiftType(existing.giftType);
    setPledgeId(existing.pledgeId);
    setReference(existing.reference);
    setDate(existing.date);
    setNotes(existing.notes);
  }, [existing]);

  const openPledges = useMemo(() => {
    if (!store || !personId) return [];
    return store.pledges.filter(
      (p) =>
        p.personId === personId &&
        asCurrency(p.currency) === currency &&
        (p.status === "active" || p.id === pledgeId),
    );
  }, [store, personId, currency, pledgeId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!personId) return setError("Choose who gave.");
    const value = parseMoney(amount);
    if (value <= 0) return setError("Enter the amount received.");
    if (giftType === "pledge-payment" && !pledgeId) return setError("Pick which pledge this pays.");
    setSaving(true);
    setError("");
    rememberCurrency(currency);
    const record: Donation = {
      id: existing?.id ?? crypto.randomUUID(),
      personId,
      amount: value,
      currency,
      date,
      method: method as Donation["method"],
      giftType: giftType as Donation["giftType"],
      pledgeId: giftType === "pledge-payment" ? pledgeId : "",
      reference,
      receiptNo: existing?.receiptNo ?? "",
      notes,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    try {
      await mutate({ op: "upsert", collection: "donations", record });
      router.push("/reports?tab=Cash");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!existing) return;
    if (!confirm("Delete this cash record? The receipt will no longer appear in reports.")) return;
    setSaving(true);
    try {
      await mutate({ op: "delete", collection: "donations", id: existing.id });
      router.push("/reports?tab=Cash");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <ScreenTitle
        title={existing ? "Edit cash in" : "Cash in"}
        subtitle="Only record money that has actually been received, in the currency it arrived."
      />
      <div className="space-y-4">
        {existing?.receiptNo ? (
          <p className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm">Receipt {existing.receiptNo}</p>
        ) : null}
        <PersonPicker value={personId} onChange={setPersonId} />
        <CurrencyToggle
          value={currency}
          onChange={(next) => {
            setCurrency(next);
            setPledgeId("");
          }}
        />
        <Field label={`Amount (${currency}$)`}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="How it came in">
          <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="What kind of gift">
          <select
            className={inputClass}
            value={giftType}
            onChange={(e) => {
              setGiftType(e.target.value);
              if (e.target.value !== "pledge-payment") setPledgeId("");
            }}
          >
            {GIFT_TYPES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        {giftType === "pledge-payment" ? (
          <Field label={`Against which ${currency}$ pledge`}>
            <select className={inputClass} value={pledgeId} onChange={(e) => setPledgeId(e.target.value)}>
              <option value="">Select pledge</option>
              {openPledges.map((p) => {
                const paid = store ? pledgePaid(store, p.id) : 0;
                return (
                  <option key={p.id} value={p.id}>
                    {formatMoney(p.amount, currency)} pledged · {formatMoney(Math.max(0, p.amount - paid), currency)} left
                  </option>
                );
              })}
            </select>
            {openPledges.length === 0 ? (
              <span className="mt-1 block text-xs text-amber-800">
                This person has no open {currency}$ pledges. Switch currency, save a pledge first, or record this as a one-off gift.
              </span>
            ) : null}
          </Field>
        ) : null}
        <Field label="Date received">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Bank / slip reference (optional)">
          <input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <SaveBar
        saving={saving}
        error={error}
        onCancel={() => undefined}
        onDelete={existing ? () => void onDelete() : undefined}
        label={existing ? "Save changes" : "Save cash in"}
      />
    </form>
  );
}

export default function CashCapturePage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-[var(--muted)]">Loading…</p>}>
      <CashForm />
    </Suspense>
  );
}
