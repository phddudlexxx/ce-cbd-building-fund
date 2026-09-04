import type {
  ExpenseCategoryId,
  GiftTypeId,
  InKindTypeId,
  PaymentMethodId,
  PersonKindId,
  PersonRoleId,
  PersonTitleId,
  PledgeFrequencyId,
} from "./categories";
import type { Currency } from "./money";

export type Person = {
  id: string;
  kind: PersonKindId;
  title: PersonTitleId | "";
  firstName: string;
  lastName: string;
  title2: PersonTitleId | "";
  firstName2: string;
  lastName2: string;
  name: string;
  phone: string;
  email: string;
  role: PersonRoleId;
  notes: string;
  createdAt: string;
};

export type Pledge = {
  id: string;
  personId: string;
  amount: number;
  currency: Currency;
  frequency: PledgeFrequencyId;
  startDate: string;
  endDate: string;
  notes: string;
  status: "active" | "fulfilled" | "lapsed" | "cancelled";
  createdAt: string;
};

export type Donation = {
  id: string;
  personId: string;
  amount: number;
  currency: Currency;
  date: string;
  method: PaymentMethodId;
  giftType: GiftTypeId;
  pledgeId: string;
  reference: string;
  receiptNo: string;
  notes: string;
  createdAt: string;
};

export type InKind = {
  id: string;
  personId: string;
  description: string;
  type: InKindTypeId;
  quantity: number;
  unit: string;
  estimatedValue: number;
  currency: Currency;
  categoryId: ExpenseCategoryId;
  date: string;
  receivedBy: string;
  notes: string;
  createdAt: string;
};

export type Expense = {
  id: string;
  categoryId: ExpenseCategoryId;
  amount: number;
  currency: Currency;
  date: string;
  payee: string;
  description: string;
  invoiceNo: string;
  method: PaymentMethodId;
  paid: boolean;
  notes: string;
  createdAt: string;
};

export type BudgetLine = {
  categoryId: ExpenseCategoryId;
  usd: number;
  zwg: number;
};

export type Settings = {
  churchName: string;
  campaignName: string;
  campaignGoalUsd: number;
  campaignGoalZwg: number;
  capturedBy: string;
  pinHash?: string;
};

export type Store = {
  settings: Settings;
  budgets: BudgetLine[];
  people: Person[];
  pledges: Pledge[];
  donations: Donation[];
  inKind: InKind[];
  expenses: Expense[];
  nextReceipt: number;
};

export type CollectionName =
  | "people"
  | "pledges"
  | "donations"
  | "inKind"
  | "expenses";

export type Mutation =
  | { op: "upsert"; collection: "people"; record: Person }
  | { op: "upsert"; collection: "pledges"; record: Pledge }
  | { op: "upsert"; collection: "donations"; record: Donation }
  | { op: "upsert"; collection: "inKind"; record: InKind }
  | { op: "upsert"; collection: "expenses"; record: Expense }
  | { op: "delete"; collection: CollectionName; id: string }
  | { op: "settings"; settings: Partial<Omit<Settings, "pinHash">> }
  | { op: "pin"; pin: string }
  | { op: "budgets"; budgets: BudgetLine[] };
