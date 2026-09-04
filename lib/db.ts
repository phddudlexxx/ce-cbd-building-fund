import "server-only";
import { copyFile, mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { EXPENSE_CATEGORIES } from "./categories";
import { hashPin } from "./auth";
import { asCurrency } from "./money";
import { formatPerson, migratePerson } from "./people";
import type { Donation, Mutation, Person, Store } from "./types";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");
const tmpPath = path.join(dataDir, "store.json.tmp");

let writeQueue: Promise<void> = Promise.resolve();

export function emptyStore(): Store {
  return {
    settings: {
      churchName: "Christ Embassy CBD",
      campaignName: "Building Project",
      campaignGoalUsd: 0,
      campaignGoalZwg: 0,
      capturedBy: "",
      pinHash: "",
    },
    budgets: EXPENSE_CATEGORIES.map((c) => ({ categoryId: c.id, usd: 0, zwg: 0 })),
    people: [
      {
        id: "anonymous",
        kind: "anonymous",
        title: "",
        firstName: "",
        lastName: "",
        title2: "",
        firstName2: "",
        lastName2: "",
        name: "Anonymous giver",
        phone: "",
        email: "",
        role: "anonymous",
        notes: "Use when the giver does not want to be named.",
        createdAt: new Date().toISOString(),
      },
    ],
    pledges: [],
    donations: [],
    inKind: [],
    expenses: [],
    nextReceipt: 1,
  };
}

async function readStore(): Promise<Store> {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return migrate(parsed);
  } catch {
    const fresh = emptyStore();
    fresh.settings.pinHash = hashPin(process.env.APP_PIN || "1234");
    await persist(fresh);
    return fresh;
  }
}

function migrate(store: Store): Store {
  const base = emptyStore();
  const incoming = store.settings as Store["settings"] & {
    campaignGoal?: number;
  };
  return {
    ...base,
    ...store,
    settings: {
      ...base.settings,
      churchName: incoming.churchName || base.settings.churchName,
      campaignName: incoming.campaignName || base.settings.campaignName,
      campaignGoalUsd: incoming.campaignGoalUsd ?? incoming.campaignGoal ?? 0,
      campaignGoalZwg: incoming.campaignGoalZwg ?? 0,
      capturedBy: incoming.capturedBy ?? "",
      pinHash: incoming.pinHash || base.settings.pinHash,
    },
    budgets: (store.budgets?.length ? store.budgets : base.budgets).map((line) => {
      const old = line as { categoryId: typeof line.categoryId; usd?: number; zwg?: number; amount?: number };
      return {
        categoryId: old.categoryId,
        usd: old.usd ?? old.amount ?? 0,
        zwg: old.zwg ?? 0,
      };
    }),
    people: (store.people ?? base.people).map((p) => migratePerson(p)),
    pledges: (store.pledges ?? []).map((p) => ({ ...p, currency: asCurrency(p.currency) })),
    donations: (store.donations ?? []).map((d) => ({ ...d, currency: asCurrency(d.currency) })),
    inKind: (store.inKind ?? []).map((g) => ({ ...g, currency: asCurrency(g.currency) })),
    expenses: (store.expenses ?? []).map((e) => ({ ...e, currency: asCurrency(e.currency) })),
    nextReceipt: store.nextReceipt || 1,
  };
}

async function persist(store: Store) {
  await mkdir(dataDir, { recursive: true });
  try {
    await copyFile(storePath, `${storePath}.bak`);
  } catch {
    /* first save has nothing to back up */
  }
  const json = JSON.stringify(store, null, 2);
  await writeFile(tmpPath, json, "utf8");
  await rename(tmpPath, storePath);
}

export function getStore() {
  return readStore();
}

export function mutateStore(mutation: Mutation) {
  const run = writeQueue.then(async () => {
    if (mutation.op === "import") {
      const next = migrate(mutation.store);
      if (!next.people?.length) {
        throw new Error("That file does not look like the building-fund books.");
      }
      await persist(next);
      return next;
    }
    const store = await readStore();
    applyMutation(store, mutation);
    await persist(store);
    return store;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function refreshPledgeStatus(store: Store, pledgeId: string) {
  if (!pledgeId) return;
  const pledge = store.pledges.find((p) => p.id === pledgeId);
  if (!pledge || pledge.status === "cancelled") return;
  const paid = store.donations
    .filter((d) => d.pledgeId === pledgeId)
    .reduce((sum, d) => sum + d.amount, 0);
  if (paid >= pledge.amount) pledge.status = "fulfilled";
  else if (pledge.status === "fulfilled") pledge.status = "active";
}

function applyMutation(store: Store, mutation: Mutation) {
  switch (mutation.op) {
    case "upsert": {
      const list = store[mutation.collection] as Array<{ id: string }>;
      const idx = list.findIndex((item) => item.id === mutation.record.id);
      let oldPledgeId = "";
      if (mutation.collection === "people") {
        const rec = mutation.record as Person;
        rec.name = formatPerson(rec);
      }
      if (mutation.collection === "donations") {
        const rec = mutation.record as Store["donations"][number];
        if (!rec.receiptNo) {
          rec.receiptNo = `CE-${String(store.nextReceipt).padStart(5, "0")}`;
          store.nextReceipt += 1;
        }
      }
      if (idx >= 0) {
        if (mutation.collection === "donations") {
          oldPledgeId = (list[idx] as Donation).pledgeId;
        }
        list[idx] = mutation.record;
      } else list.unshift(mutation.record);
      if (mutation.collection === "donations") {
        const rec = mutation.record as Donation;
        if (oldPledgeId) refreshPledgeStatus(store, oldPledgeId);
        refreshPledgeStatus(store, rec.pledgeId);
      }
      return;
    }
    case "delete": {
      const list = store[mutation.collection] as Array<{ id: string }>;
      const removed = list.find((item) => item.id === mutation.id);
      store[mutation.collection] = list.filter((item) => item.id !== mutation.id) as never;
      if (mutation.collection === "donations" && removed) {
        refreshPledgeStatus(store, (removed as Donation).pledgeId);
      }
      return;
    }
    case "settings": {
      store.settings = { ...store.settings, ...mutation.settings };
      return;
    }
    case "pin": {
      store.settings.pinHash = hashPin(mutation.pin);
      return;
    }
    case "budgets": {
      store.budgets = mutation.budgets;
      return;
    }
  }
}

export function publicStore(store: Store) {
  const { pinHash: _pin, ...settings } = store.settings;
  return { ...store, settings };
}
