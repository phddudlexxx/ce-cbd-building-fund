"use client";

import { PERSON_KINDS, PERSON_ROLES, PERSON_TITLES } from "@/lib/categories";
import type { PersonDraft } from "@/lib/people";
import { Field, inputClass } from "./ui";

export function PersonFields({
  draft,
  onChange,
  showContact = true,
}: {
  draft: PersonDraft;
  onChange: (draft: PersonDraft) => void;
  showContact?: boolean;
}) {
  function set<K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="mb-1.5 block text-sm font-medium">Giving as</span>
        <div className="grid grid-cols-2 gap-2">
          {PERSON_KINDS.map((kind) => {
            const active = draft.kind === kind.id;
            return (
              <button
                key={kind.id}
                type="button"
                onClick={() => {
                  const next = { ...draft, kind: kind.id };
                  if (kind.id === "company") next.role = "company";
                  else if (draft.role === "company") next.role = "member";
                  if (kind.id === "couple" && next.lastName && !next.lastName2) {
                    next.lastName2 = next.lastName;
                  }
                  onChange(next);
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  active
                    ? "border-[var(--purple)] bg-[var(--purple)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--ink)]"
                }`}
              >
                {kind.name}
              </button>
            );
          })}
        </div>
      </div>

      {draft.kind === "individual" ? (
        <>
          <TitleField label="Title" value={draft.title} onChange={(title) => set("title", title)} />
          <Field label="First name">
            <input
              className={inputClass}
              value={draft.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Dudley"
            />
          </Field>
          <Field label="Surname">
            <input
              className={inputClass}
              value={draft.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Mutero"
            />
          </Field>
        </>
      ) : null}

      {draft.kind === "couple" ? (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">First person</p>
          <TitleField label="Title" value={draft.title} onChange={(title) => set("title", title)} />
          <Field label="First name">
            <input
              className={inputClass}
              value={draft.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Dudley"
            />
          </Field>
          <Field label="Surname">
            <input
              className={inputClass}
              value={draft.lastName}
              onChange={(e) => {
                const value = e.target.value;
                const next = { ...draft, lastName: value };
                if (!draft.lastName2 || draft.lastName2 === draft.lastName) {
                  next.lastName2 = value;
                }
                onChange(next);
              }}
              placeholder="Mutero"
            />
          </Field>
          <p className="pt-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Second person</p>
          <TitleField label="Title" value={draft.title2} onChange={(title) => set("title2", title)} />
          <Field label="First name">
            <input
              className={inputClass}
              value={draft.firstName2}
              onChange={(e) => set("firstName2", e.target.value)}
              placeholder="Rufaro"
            />
          </Field>
          <Field label="Surname" hint="Copied from the first person. Change it only if it is different.">
            <input
              className={inputClass}
              value={draft.lastName2}
              onChange={(e) => set("lastName2", e.target.value)}
              placeholder="Mutero"
            />
          </Field>
          <p className="text-xs text-[var(--muted)]">Saves as e.g. Br Dudley &amp; Ps Rufaro Mutero</p>
        </>
      ) : null}

      {draft.kind === "family" ? (
        <Field label="Family name" hint="Saves as Mutero Family">
          <input
            className={inputClass}
            value={draft.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="Mutero"
          />
        </Field>
      ) : null}

      {draft.kind === "company" ? (
        <Field label="Company name">
          <input
            className={inputClass}
            value={draft.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </Field>
      ) : null}

      {showContact ? (
        <>
          {draft.kind !== "company" ? (
            <Field label="Member or visitor">
              <select
                className={inputClass}
                value={draft.role}
                onChange={(e) => set("role", e.target.value as PersonDraft["role"])}
              >
                {PERSON_ROLES.filter((r) => r.id === "member" || r.id === "visitor").map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Phone (optional)">
            <input
              className={inputClass}
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              inputMode="tel"
            />
          </Field>
        </>
      ) : null}
    </div>
  );
}

function TitleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PersonDraft["title"];
  onChange: (title: PersonDraft["title"]) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value as PersonDraft["title"])}
      >
        {PERSON_TITLES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
