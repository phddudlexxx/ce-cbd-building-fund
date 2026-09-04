import { EXPENSE_CATEGORIES, type ExpenseCategoryId } from "./categories";
import { asCurrency, type Currency } from "./money";
import { formatPerson } from "./people";
import type { Store } from "./types";

export function personName(store: Store, id: string) {
  const person = store.people.find((p) => p.id === id);
  if (!person) return "Unknown";
  return formatPerson(person);
}

export function pledgePaid(store: Store, pledgeId: string) {
  const pledge = store.pledges.find((p) => p.id === pledgeId);
  const currency = asCurrency(pledge?.currency);
  return store.donations
    .filter((d) => d.pledgeId === pledgeId && asCurrency(d.currency) === currency)
    .reduce((sum, d) => sum + d.amount, 0);
}

export type CurrencyTotals = {
  pledged: number;
  cashIn: number;
  inKindValue: number;
  spentPaid: number;
  spentUnpaid: number;
  spentAll: number;
  outstandingPledges: number;
  budgetTotal: number;
  cashAvailable: number;
  fundingReceived: number;
  goal: number;
};

function totalsFor(store: Store, currency: Currency): CurrencyTotals {
  const pledged = store.pledges
    .filter((p) => p.status !== "cancelled" && asCurrency(p.currency) === currency)
    .reduce((sum, p) => sum + p.amount, 0);
  const cashIn = store.donations
    .filter((d) => asCurrency(d.currency) === currency)
    .reduce((sum, d) => sum + d.amount, 0);
  const inKindValue = store.inKind
    .filter((g) => asCurrency(g.currency) === currency)
    .reduce((sum, g) => sum + g.estimatedValue, 0);
  const spentPaid = store.expenses
    .filter((e) => e.paid && asCurrency(e.currency) === currency)
    .reduce((sum, e) => sum + e.amount, 0);
  const spentUnpaid = store.expenses
    .filter((e) => !e.paid && asCurrency(e.currency) === currency)
    .reduce((sum, e) => sum + e.amount, 0);
  const spentAll = spentPaid + spentUnpaid;
  const outstandingPledges = store.pledges
    .filter((p) => p.status === "active" && asCurrency(p.currency) === currency)
    .reduce((sum, p) => sum + Math.max(0, p.amount - pledgePaid(store, p.id)), 0);
  const budgetTotal = store.budgets.reduce(
    (sum, b) => sum + (currency === "USD" ? b.usd : b.zwg),
    0,
  );
  const cashAvailable = cashIn - spentPaid;
  const fundingReceived = cashIn + inKindValue;
  const goal = currency === "USD" ? store.settings.campaignGoalUsd : store.settings.campaignGoalZwg;

  return {
    pledged,
    cashIn,
    inKindValue,
    spentPaid,
    spentUnpaid,
    spentAll,
    outstandingPledges,
    budgetTotal,
    cashAvailable,
    fundingReceived,
    goal,
  };
}

function categoryLine(store: Store, categoryId: ExpenseCategoryId, currency: Currency) {
  const budget =
    (currency === "USD"
      ? store.budgets.find((b) => b.categoryId === categoryId)?.usd
      : store.budgets.find((b) => b.categoryId === categoryId)?.zwg) ?? 0;
  const spent = store.expenses
    .filter((e) => e.categoryId === categoryId && asCurrency(e.currency) === currency)
    .reduce((sum, e) => sum + e.amount, 0);
  const inKind = store.inKind
    .filter((g) => g.categoryId === categoryId && asCurrency(g.currency) === currency)
    .reduce((sum, g) => sum + g.estimatedValue, 0);
  return { budget, spent, inKind, remaining: budget - spent - inKind };
}

export function summarise(store: Store) {
  return {
    usd: totalsFor(store, "USD"),
    zwg: totalsFor(store, "ZWG"),
    byCategory: EXPENSE_CATEGORIES.map((cat) => ({
      id: cat.id as ExpenseCategoryId,
      name: cat.name,
      hint: cat.hint,
      usd: categoryLine(store, cat.id, "USD"),
      zwg: categoryLine(store, cat.id, "ZWG"),
    })),
  };
}
