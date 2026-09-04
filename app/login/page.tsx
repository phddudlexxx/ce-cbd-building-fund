"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "login", pin }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("That PIN is not right. Try again.");
      return;
    }
    router.replace(params.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">PIN</span>
        <input
          className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-[var(--purple)]"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="••••"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || pin.length < 4}
        className="w-full rounded-2xl bg-[var(--purple)] py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Opening…" : "Open the books"}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        First use PIN is <strong>1234</strong>. Change it under More → Settings.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-[var(--purple-deep)] px-5 py-10 text-white">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Christ Embassy CBD
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-tight">
          Building Fund
        </h1>
        <p className="mt-3 text-sm text-white/75">
          Capture pledges, cash, gifts in kind and building spend. Reports stay a tap away.
        </p>
        <div className="mt-8 rounded-3xl bg-[var(--cream)] p-5 text-[var(--ink)]">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
