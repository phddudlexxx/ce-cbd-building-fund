export type Currency = "USD" | "ZWG";

export const CURRENCIES: { id: Currency; label: string; name: string }[] = [
  { id: "USD", label: "USD$", name: "US dollar" },
  { id: "ZWG", label: "ZWG$", name: "Zimbabwe Gold" },
];

export function asCurrency(value: unknown): Currency {
  return value === "ZWG" ? "ZWG" : "USD";
}

export function formatMoney(amount: number, currency: Currency = "USD") {
  const n = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${currency}$${formatted}`;
}

export function formatPair(usd: number, zwg: number) {
  return `${formatMoney(usd, "USD")}  ·  ${formatMoney(zwg, "ZWG")}`;
}

export function parseMoney(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const LAST_CURRENCY = "ce-currency";

export function lastCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  return asCurrency(window.localStorage.getItem(LAST_CURRENCY));
}

export function rememberCurrency(currency: Currency) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_CURRENCY, currency);
}
