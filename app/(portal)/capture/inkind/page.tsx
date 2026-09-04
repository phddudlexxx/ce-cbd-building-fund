"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonPicker } from "@/components/PersonPicker";
import { CurrencyToggle, Field, inputClass, SaveBar, ScreenTitle } from "@/components/ui";
import { EXPENSE_CATEGORIES, INKIND_TYPES } from "@/lib/categories";
import { asCurrency, lastCurrency, parseMoney, rememberCurrency, todayISO, type Currency } from "@/lib/money";
import type { InKind } from "@/lib/types";
import { useData } from "@/lib/use-data";

function InKindForm() {
  const { store, mutate } = useData();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const existing = store?.inKind.find((g) => g.id === editId);

  const [personId, setPersonId] = useState("");
  const [currency, setCurrency] = useState<Currency>(lastCurrency);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("materials");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("items");
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState("structure");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!existing) return;
    setPersonId(existing.personId);
    setCurrency(asCurrency(existing.currency));
    setDescription(existing.description);
    setType(existing.type);
    setQuantity(String(existing.quantity));
    setUnit(existing.unit);
    setValue(String(existing.estimatedValue));
    setCategoryId(existing.categoryId);
    setDate(existing.date);
    setNotes(existing.notes);
  }, [existing]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!personId) return setError("Choose who gave this.");
    if (!description.trim()) return setError("Say what was given — e.g. 1 000 bricks.");
    const estimatedValue = parseMoney(value);
    if (estimatedValue <= 0) return setError("Put a fair estimate of what this would have cost.");
    setSaving(true);
    setError("");
    rememberCurrency(currency);
    const record: InKind = {
      id: existing?.id ?? crypto.randomUUID(),
      personId,
      description: description.trim(),
      type: type as InKind["type"],
      quantity: Number(quantity) || 1,
      unit: unit.trim() || "items",
      estimatedValue,
      currency,
      categoryId: categoryId as InKind["categoryId"],
      date,
      receivedBy: existing?.receivedBy || store?.settings.capturedBy || "",
      notes,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    try {
      await mutate({ op: "upsert", collection: "inKind", record });
      router.push("/reports?tab=In-kind");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!existing) return;
    if (!confirm("Delete this in-kind gift?")) return;
    setSaving(true);
    try {
      await mutate({ op: "delete", collection: "inKind", id: existing.id });
      router.push("/reports?tab=In-kind");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <ScreenTitle
        title={existing ? "Edit gift in kind" : "Gift in kind"}
        subtitle="This does not increase cash. It reduces what we still need to buy in that building category."
      />
      <div className="space-y-4">
        <PersonPicker value={personId} onChange={setPersonId} />
        <CurrencyToggle value={currency} onChange={setCurrency} />
        <Field label="What was given">
          <input
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Clay bricks, 230mm"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input
              className={inputClass}
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field label="Unit">
            <input
              className={inputClass}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bricks, bags, days"
            />
          </Field>
        </div>
        <Field label="Kind of gift">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
            {INKIND_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Estimated value (${currency}$)`} hint="What we would have paid if we bought it, in the currency of that quote.">
          <input
            className={inputClass}
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Offsets which building cost" hint="Bricks go to Structure. A donated PA system goes to Audio, visual & IT.">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date received">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
        label={existing ? "Save changes" : "Save in-kind gift"}
      />
    </form>
  );
}

export default function InKindCapturePage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-[var(--muted)]">Loading…</p>}>
      <InKindForm />
    </Suspense>
  );
}
