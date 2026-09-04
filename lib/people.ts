import {
  PERSON_KINDS,
  PERSON_TITLES,
  type PersonKindId,
  type PersonRoleId,
  type PersonTitleId,
} from "./categories";
import type { Person } from "./types";

export type PersonDraft = {
  kind: Exclude<PersonKindId, "anonymous">;
  title: PersonTitleId | "";
  firstName: string;
  lastName: string;
  title2: PersonTitleId | "";
  firstName2: string;
  lastName2: string;
  phone: string;
  email: string;
  role: PersonRoleId;
};

function titleLabel(id: string) {
  return PERSON_TITLES.find((t) => t.id === id)?.label ?? "";
}

function named(title: string, first: string, last: string) {
  return [titleLabel(title), first.trim(), last.trim()].filter(Boolean).join(" ");
}

export function formatPerson(person: Partial<Person> & { name?: string }) {
  if (person.kind === "anonymous" || person.id === "anonymous") {
    return person.name?.trim() || "Anonymous giver";
  }
  if (person.kind === "company") {
    return (person.lastName || person.firstName || person.name || "Company").trim();
  }
  if (person.kind === "family") {
    const family = (person.lastName || person.firstName || "").trim();
    if (!family) return person.name?.trim() || "Family";
    return /family$/i.test(family) ? family : `${family} Family`;
  }
  if (person.kind === "couple") {
    const last1 = (person.lastName ?? "").trim();
    const last2 = (person.lastName2 ?? "").trim() || last1;
    const sameSurname = Boolean(last1 && last2 && last1.toLowerCase() === last2.toLowerCase());
    const a = named(person.title ?? "", person.firstName ?? "", sameSurname ? "" : last1);
    const b = named(person.title2 ?? "", person.firstName2 ?? "", last2);
    if (a && b) return `${a} & ${b}`;
    return a || b || person.name?.trim() || "Couple";
  }
  const individual = named(person.title ?? "", person.firstName ?? "", person.lastName ?? "");
  return individual || person.name?.trim() || "Unknown";
}

export function emptyPersonDraft(seed = ""): PersonDraft {
  return {
    kind: "individual",
    title: "br",
    firstName: seed,
    lastName: "",
    title2: "sr",
    firstName2: "",
    lastName2: "",
    phone: "",
    email: "",
    role: "member",
  };
}

function asTitle(value: string | undefined): PersonTitleId | "" {
  return PERSON_TITLES.some((t) => t.id === value) ? (value as PersonTitleId) : "";
}

export function draftFromPerson(person: Person): PersonDraft {
  const kind =
    person.kind === "couple" || person.kind === "family" || person.kind === "company" || person.kind === "individual"
      ? person.kind
      : "individual";
  return {
    kind,
    title: asTitle(person.title) || "br",
    firstName: person.firstName || (kind === "individual" ? person.name : ""),
    lastName: person.lastName || (kind === "company" || kind === "family" ? person.name.replace(/ family$/i, "") : ""),
    title2: asTitle(person.title2) || "sr",
    firstName2: person.firstName2 || "",
    lastName2: person.lastName2 || person.lastName || "",
    phone: person.phone || "",
    email: person.email || "",
    role: person.role === "company" || person.role === "anonymous" ? (kind === "company" ? "company" : "member") : person.role,
  };
}

export function personFromDraft(draft: PersonDraft): Omit<Person, "id" | "createdAt"> {
  const role: PersonRoleId =
    draft.kind === "company" ? "company" : draft.role === "company" || draft.role === "anonymous" ? "member" : draft.role;
  const record: Omit<Person, "id" | "createdAt"> = {
    kind: draft.kind,
    title: draft.kind === "individual" || draft.kind === "couple" ? draft.title : "",
    firstName: draft.kind === "company" || draft.kind === "family" ? "" : draft.firstName.trim(),
    lastName:
      draft.kind === "company"
        ? draft.lastName.trim() || draft.firstName.trim()
        : draft.kind === "family"
          ? draft.lastName.trim()
          : draft.lastName.trim(),
    title2: draft.kind === "couple" ? draft.title2 : "",
    firstName2: draft.kind === "couple" ? draft.firstName2.trim() : "",
    lastName2: draft.kind === "couple" ? (draft.lastName2.trim() || draft.lastName.trim()) : "",
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    role,
    notes: "",
    name: "",
  };
  return { ...record, name: formatPerson(record) };
}

export function validatePersonDraft(draft: PersonDraft) {
  if (draft.kind === "individual") {
    if (!draft.title) return "Pick a title.";
    if (!draft.firstName.trim()) return "Enter the first name.";
  }
  if (draft.kind === "couple") {
    if (!draft.title || !draft.title2) return "Both people need a title.";
    if (!draft.firstName.trim() || !draft.firstName2.trim()) return "Enter both first names.";
  }
  if (draft.kind === "family" && !draft.lastName.trim()) return "Enter the family name, e.g. Mutero.";
  if (draft.kind === "company" && !draft.lastName.trim() && !draft.firstName.trim()) {
    return "Enter the company name.";
  }
  return "";
}

export function personSearchText(person: Person) {
  return [
    formatPerson(person),
    person.firstName,
    person.lastName,
    person.firstName2,
    person.lastName2,
    person.phone,
    person.email,
  ]
    .join(" ")
    .toLowerCase();
}

export function migratePerson(person: Person): Person {
  const kind: PersonKindId =
    person.kind ||
    (person.role === "anonymous" || person.id === "anonymous"
      ? "anonymous"
      : person.role === "company"
        ? "company"
        : "individual");
  const next: Person = {
    ...person,
    kind,
    title: person.title ?? "",
    firstName: person.firstName ?? "",
    lastName: person.lastName ?? "",
    title2: person.title2 ?? "",
    firstName2: person.firstName2 ?? "",
    lastName2: person.lastName2 ?? "",
  };
  if (kind === "individual" && !next.firstName && person.name && person.name !== "Anonymous giver") {
    next.firstName = person.name;
  }
  next.name = formatPerson(next);
  return next;
}

export function kindLabel(kind: string) {
  if (kind === "anonymous") return "Anonymous";
  return PERSON_KINDS.find((k) => k.id === kind)?.name ?? kind;
}
