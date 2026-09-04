"use client";

import { useMemo, useState } from "react";
import type { Person } from "@/lib/types";
import {
  draftFromPerson,
  emptyPersonDraft,
  formatPerson,
  personFromDraft,
  personSearchText,
  validatePersonDraft,
  type PersonDraft,
} from "@/lib/people";
import { useData } from "@/lib/use-data";
import { PersonFields } from "./PersonFields";
import { Field, inputClass } from "./ui";

export function PersonPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { store, mutate } = useData();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PersonDraft>(() => emptyPersonDraft());
  const [error, setError] = useState("");

  const people = store?.people ?? [];
  const selected = people.find((p) => p.id === value);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? people.filter((p) => personSearchText(p).includes(q)) : people;
    return list.slice(0, 8);
  }, [people, query]);

  async function savePerson(existing?: Person) {
    const problem = validatePersonDraft(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const record: Person = {
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      ...personFromDraft(draft),
      notes: existing?.notes ?? "",
    };
    await mutate({ op: "upsert", collection: "people", record });
    onChange(record.id);
    setAdding(false);
    setEditing(false);
    setDraft(emptyPersonDraft());
    setQuery("");
  }

  if (selected && !adding && !editing) {
    return (
      <Field label="Who">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
          <div className="min-w-0">
            <p className="font-medium">{formatPerson(selected)}</p>
            {selected.phone ? <p className="text-xs text-[var(--muted)]">{selected.phone}</p> : null}
          </div>
          <div className="flex shrink-0 gap-3">
            {selected.id !== "anonymous" ? (
              <button
                type="button"
                className="text-sm font-medium text-[var(--purple)]"
                onClick={() => {
                  setDraft(draftFromPerson(selected));
                  setEditing(true);
                  setError("");
                }}
              >
                Edit
              </button>
            ) : null}
            <button
              type="button"
              className="text-sm font-medium text-[var(--purple)]"
              onClick={() => onChange("")}
            >
              Change
            </button>
          </div>
        </div>
      </Field>
    );
  }

  if (selected && editing) {
    return (
      <div className="space-y-3 rounded-xl border border-[var(--gold)] bg-[#fffaf0] p-3">
        <p className="text-sm font-medium">Edit giver — pledges stay attached</p>
        <PersonFields draft={draft} onChange={setDraft} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="button"
          onClick={() => void savePerson(selected)}
          className="w-full rounded-xl bg-[var(--purple)] py-3 font-semibold text-white"
        >
          Save changes
        </button>
        <button
          type="button"
          className="w-full py-2 text-sm font-medium text-[var(--muted)]"
          onClick={() => {
            setEditing(false);
            setError("");
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Who" hint="Search a name or add a person, couple or family.">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a name or phone"
          autoComplete="off"
        />
      </Field>
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        {matches.map((p) => (
          <button
            type="button"
            key={p.id}
            className="flex w-full items-center justify-between border-b border-[var(--line)] px-3 py-3 text-left last:border-0"
            onClick={() => onChange(p.id)}
          >
            <span className="font-medium">{formatPerson(p)}</span>
            <span className="text-xs text-[var(--muted)]">{p.phone}</span>
          </button>
        ))}
        <button
          type="button"
          className="w-full px-3 py-3 text-left text-sm font-semibold text-[var(--purple)]"
          onClick={() => {
            setAdding(true);
            setDraft(emptyPersonDraft(query));
            setError("");
          }}
        >
          + Add new giver{query ? `: ${query}` : ""}
        </button>
      </div>
      {adding ? (
        <div className="space-y-3 rounded-xl border border-[var(--gold)] bg-[#fffaf0] p-3">
          <PersonFields draft={draft} onChange={setDraft} />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            onClick={() => void savePerson()}
            className="w-full rounded-xl bg-[var(--purple)] py-3 font-semibold text-white"
          >
            Save giver
          </button>
        </div>
      ) : null}
    </div>
  );
}
