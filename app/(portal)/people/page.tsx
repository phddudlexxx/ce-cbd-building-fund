"use client";

import { FormEvent, useState } from "react";
import { Card, Field, GhostButton, inputClass, PrimaryButton, ScreenTitle } from "@/components/ui";
import { PersonFields } from "@/components/PersonFields";
import {
  draftFromPerson,
  emptyPersonDraft,
  formatPerson,
  kindLabel,
  personFromDraft,
  personSearchText,
  validatePersonDraft,
  type PersonDraft,
} from "@/lib/people";
import type { Person } from "@/lib/types";
import { useData } from "@/lib/use-data";

export default function PeoplePage() {
  const { store, mutate, loading } = useData();
  const [draft, setDraft] = useState<PersonDraft>(() => emptyPersonDraft());
  const [editing, setEditing] = useState<Person | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  if (loading || !store) return <p className="py-10 text-center text-[var(--muted)]">Loading people…</p>;

  const people = store.people.filter((p) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return personSearchText(p).includes(s);
  });

  function startEdit(person: Person) {
    setEditing(person);
    setDraft(draftFromPerson(person));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(emptyPersonDraft());
    setError("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const problem = validatePersonDraft(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const record: Person = {
      id: editing?.id ?? crypto.randomUUID(),
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      ...personFromDraft(draft),
      notes: editing?.notes ?? "",
    };
    await mutate({ op: "upsert", collection: "people", record });
    cancelEdit();
  }

  return (
    <div className="space-y-4">
      <ScreenTitle
        title="People"
        subtitle="Tap Edit to fix a name or turn one person into a couple. Pledges and receipts stay on that giver."
      />
      <Card>
        <form onSubmit={save} className="space-y-3">
          {editing ? (
            <p className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm text-[var(--purple-deep)]">
              Editing <strong>{formatPerson(editing)}</strong>. Their pledges and cash stay attached.
            </p>
          ) : null}
          <PersonFields draft={draft} onChange={setDraft} />
          <Field label="Email (optional)">
            <input
              className={inputClass}
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              inputMode="email"
            />
          </Field>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <PrimaryButton type="submit">{editing ? "Save changes" : "Add giver"}</PrimaryButton>
          {editing ? (
            <GhostButton type="button" onClick={cancelEdit}>
              Cancel edit
            </GhostButton>
          ) : null}
        </form>
      </Card>
      <input
        className={inputClass}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search people, couples and families"
      />
      <div className="space-y-2">
        {people.map((p) => (
          <Card key={p.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{formatPerson(p)}</p>
              <p className="text-xs text-[var(--muted)]">
                {kindLabel(p.kind)}
                {p.phone ? ` · ${p.phone}` : ""}
              </p>
            </div>
            {p.id !== "anonymous" ? (
              <div className="flex shrink-0 gap-2">
                <GhostButton type="button" className="!w-auto px-3 py-2 text-sm" onClick={() => startEdit(p)}>
                  Edit
                </GhostButton>
                <GhostButton
                  type="button"
                  className="!w-auto px-3 py-2 text-sm text-red-800"
                  onClick={() => {
                    if (editing?.id === p.id) cancelEdit();
                    void mutate({ op: "delete", collection: "people", id: p.id });
                  }}
                >
                  Remove
                </GhostButton>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
