"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DataProvider, useData } from "@/lib/use-data";
import { CURRENCIES, rememberCurrency, type Currency } from "@/lib/money";

const nav = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/capture", label: "Capture", icon: PlusIcon },
  { href: "/reports", label: "Reports", icon: ChartIcon },
  { href: "/more", label: "More", icon: MoreIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <ShellFrame>{children}</ShellFrame>
    </DataProvider>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { store, loading } = useData();

  return (
    <div className="min-h-dvh bg-[var(--cream)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--purple)] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--gold)]">
              {store?.settings.churchName ?? "Christ Embassy CBD"}
            </p>
            <h1 className="truncate font-[family-name:var(--font-display)] text-lg leading-tight">
              {store?.settings.campaignName ?? "Building Project"}
            </h1>
          </div>
          {loading ? (
            <span className="text-xs text-white/70">Loading…</span>
          ) : (
            <Link
              href="/capture"
              className="rounded-full bg-[var(--gold)] px-3 py-1.5 text-sm font-semibold text-[var(--purple-deep)]"
            >
              Capture
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--line)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  active ? "text-[var(--purple)]" : "text-[var(--muted)]"
                }`}
              >
                <item.icon active={active} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function ScreenTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--purple-deep)]">
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(46,15,69,0.04)] ${className}`}>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (currency: Currency) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Currency</span>
      <div className="grid grid-cols-2 gap-2">
        {CURRENCIES.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                rememberCurrency(c.id);
                onChange(c.id);
              }}
              className={`rounded-xl border px-3 py-3 text-base font-semibold ${
                active
                  ? "border-[var(--purple)] bg-[var(--purple)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink)]"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--cream)] px-3 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--purple)] focus:bg-white";

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-2xl bg-[var(--purple)] px-4 py-3.5 text-base font-semibold text-white disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-medium text-[var(--ink)] ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function SaveBar({
  saving,
  error,
  onCancel,
  onDelete,
  label = "Save",
}: {
  saving: boolean;
  error: string;
  onCancel: () => void;
  onDelete?: () => void;
  label?: string;
}) {
  const router = useRouter();
  return (
    <div className="mt-6 space-y-3">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <PrimaryButton type="submit" disabled={saving}>
        {saving ? "Saving…" : label}
      </PrimaryButton>
      {onDelete ? (
        <button
          type="button"
          disabled={saving}
          onClick={onDelete}
          className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-800 disabled:opacity-50"
        >
          Delete this record
        </button>
      ) : null}
      <GhostButton
        type="button"
        onClick={() => {
          onCancel();
          router.back();
        }}
      >
        Cancel
      </GhostButton>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={active ? "currentColor" : "currentColor"}
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {active ? <circle cx="12" cy="5" r="1.5" fill="currentColor" /> : null}
    </svg>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" opacity={active ? 1 : 0.55} />
      <circle cx="18" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}
