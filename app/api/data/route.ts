import { NextRequest, NextResponse } from "next/server";
import {
  clearSession,
  createPendingOtp,
  createSession,
  hasPendingOtp,
  hasSession,
  verifyPin,
} from "@/lib/auth";
import { getStore, mutateStore, publicStore } from "@/lib/db";
import { canResendOtp, clearOtp, createOtpCode, saveOtp, verifyOtp } from "@/lib/otp";
import { maskPhone, otpPhone, sendOtpSms, smsConfigured } from "@/lib/sms";
import type { Mutation } from "@/lib/types";

type LoginBody =
  | Mutation
  | { op: "login"; pin: string }
  | { op: "verify-otp"; code: string }
  | { op: "resend-otp" }
  | { op: "logout" };

async function sendFreshCode() {
  const code = createOtpCode();
  await saveOtp(code);
  await sendOtpSms(otpPhone(), code);
}

export async function GET() {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const store = await getStore();
  return NextResponse.json(publicStore(store));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as LoginBody;

  if (body.op === "login") {
    const store = await getStore();
    if (!verifyPin(body.pin, store.settings.pinHash || "")) {
      return NextResponse.json({ error: "That PIN is not right. Try again." }, { status: 401 });
    }
    // Without Africa's Talking keys on the NAS, PIN alone signs in so the books stay reachable.
    if (!smsConfigured()) {
      await clearOtp();
      await createSession();
      return NextResponse.json({ ok: true, needOtp: false });
    }
    try {
      await sendFreshCode();
    } catch (err) {
      await clearOtp();
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not send the SMS code." },
        { status: 503 },
      );
    }
    await createPendingOtp();
    return NextResponse.json({ ok: true, needOtp: true, phone: maskPhone(otpPhone()) });
  }

  if (body.op === "resend-otp") {
    if (!(await hasPendingOtp())) {
      return NextResponse.json({ error: "Enter your PIN first." }, { status: 401 });
    }
    if (!smsConfigured()) {
      return NextResponse.json(
        { error: "SMS is not configured on the server. Set AT_USERNAME and AT_API_KEY on the NAS." },
        { status: 503 },
      );
    }
    const gate = await canResendOtp();
    if (!gate.ok) {
      return NextResponse.json(
        { error: `Wait ${Math.ceil(gate.waitMs / 1000)} seconds before sending another code.` },
        { status: 429 },
      );
    }
    try {
      await sendFreshCode();
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not send the SMS code." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, phone: maskPhone(otpPhone()) });
  }

  if (body.op === "verify-otp") {
    if (!(await hasPendingOtp())) {
      return NextResponse.json({ error: "Enter your PIN first." }, { status: 401 });
    }
    const result = await verifyOtp(body.code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    await createSession();
    return NextResponse.json({ ok: true });
  }

  if (body.op === "logout") {
    await clearOtp();
    await clearSession();
    return NextResponse.json({ ok: true });
  }

  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const store = await mutateStore(body);
    return NextResponse.json(publicStore(store));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save" },
      { status: 400 },
    );
  }
}
