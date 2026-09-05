"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"pin" | "otp">("pin");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(body: object) {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      phone?: string;
      needOtp?: boolean;
    };
    return { ok: res.ok, status: res.status, data };
  }

  async function onPin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await post({ op: "login", pin });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.data.error ||
          "The PIN may be correct, but the SMS code could not be sent. Try again in a moment.",
      );
      return;
    }
    if (!res.data.needOtp) {
      router.replace(params.get("next") || "/");
      router.refresh();
      return;
    }
    setPhone(res.data.phone || "");
    setStep("otp");
  }

  async function onOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await post({ op: "verify-otp", code });
    setBusy(false);
    if (!res.ok) {
      setError(res.data.error || "That code is not right.");
      if (res.data.error?.includes("PIN")) {
        setStep("pin");
        setCode("");
      }
      return;
    }
    router.replace(params.get("next") || "/");
    router.refresh();
  }

  async function resend() {
    setBusy(true);
    setError("");
    const res = await post({ op: "resend-otp" });
    setBusy(false);
    if (!res.ok) setError(res.data.error || "Could not send another code.");
    else setPhone(res.data.phone || phone);
  }

  if (step === "otp") {
    return (
      <form onSubmit={onOtp} className="space-y-4">
        <p className="text-sm text-[var(--muted)]">
          We sent a 6-digit code to <strong className="text-[var(--ink)]">{phone}</strong>.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">SMS code</span>
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-[var(--purple)]"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full rounded-2xl bg-[var(--purple)] py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : "Confirm and open"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void resend()}
          className="w-full text-sm font-medium text-[var(--purple)]"
        >
          Send another code
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("pin");
            setCode("");
            setError("");
          }}
          className="w-full text-xs text-[var(--muted)]"
        >
          Use a different PIN
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onPin} className="space-y-4">
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
        {busy ? "Sending code…" : "Send SMS code"}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        After the PIN, a code is sent to the church accountant phone.
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
