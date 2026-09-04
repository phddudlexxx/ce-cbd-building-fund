"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, Field, inputClass, PrimaryButton, ScreenTitle } from "@/components/ui";
import { parseMoney } from "@/lib/money";
import { useData } from "@/lib/use-data";

export default function SettingsPage() {
  const { store, mutate, loading } = useData();
  const [churchName, setChurchName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignGoalUsd, setCampaignGoalUsd] = useState("");
  const [campaignGoalZwg, setCampaignGoalZwg] = useState("");
  const [capturedBy, setCapturedBy] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!store) return;
    setChurchName(store.settings.churchName);
    setCampaignName(store.settings.campaignName);
    setCampaignGoalUsd(store.settings.campaignGoalUsd ? String(store.settings.campaignGoalUsd) : "");
    setCampaignGoalZwg(store.settings.campaignGoalZwg ? String(store.settings.campaignGoalZwg) : "");
    setCapturedBy(store.settings.capturedBy);
  }, [store]);

  if (loading || !store) return <p className="py-10 text-center text-[var(--muted)]">Loading settings…</p>;

  async function save(e: FormEvent) {
    e.preventDefault();
    await mutate({
      op: "settings",
      settings: {
        churchName: churchName.trim() || "Christ Embassy CBD",
        campaignName: campaignName.trim() || "Building Project",
        campaignGoalUsd: parseMoney(campaignGoalUsd),
        campaignGoalZwg: parseMoney(campaignGoalZwg),
        capturedBy: capturedBy.trim(),
      },
    });
    if (pin.length >= 4) {
      await mutate({ op: "pin", pin });
      setPin("");
    }
    setMessage("Saved.");
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <ScreenTitle title="Settings" subtitle="Books are kept in USD$ and ZWG$. Both are primary — neither is converted into the other." />
      <Card className="space-y-3">
        <Field label="Church name">
          <input className={inputClass} value={churchName} onChange={(e) => setChurchName(e.target.value)} />
        </Field>
        <Field label="Campaign name">
          <input className={inputClass} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
        </Field>
        <Field label="Campaign goal USD$">
          <input
            className={inputClass}
            inputMode="decimal"
            value={campaignGoalUsd}
            onChange={(e) => setCampaignGoalUsd(e.target.value)}
          />
        </Field>
        <Field label="Campaign goal ZWG$">
          <input
            className={inputClass}
            inputMode="decimal"
            value={campaignGoalZwg}
            onChange={(e) => setCampaignGoalZwg(e.target.value)}
          />
        </Field>
        <Field label="Your name (shown as captured by)">
          <input className={inputClass} value={capturedBy} onChange={(e) => setCapturedBy(e.target.value)} />
        </Field>
      </Card>
      <Card className="space-y-3">
        <Field label="New PIN" hint="Leave blank to keep the current PIN. Use at least 4 digits.">
          <input
            className={inputClass}
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="New PIN"
          />
        </Field>
      </Card>
      {message ? <p className="text-sm text-green-800">{message}</p> : null}
      <PrimaryButton type="submit">Save settings</PrimaryButton>
    </form>
  );
}
