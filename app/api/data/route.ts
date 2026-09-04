import { NextRequest, NextResponse } from "next/server";
import { clearSession, createSession, hasSession, verifyPin } from "@/lib/auth";
import { getStore, mutateStore, publicStore } from "@/lib/db";
import type { Mutation } from "@/lib/types";

export async function GET() {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const store = await getStore();
  return NextResponse.json(publicStore(store));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Mutation | { op: "login"; pin: string } | { op: "logout" };

  if (body.op === "login") {
    const store = await getStore();
    if (!verifyPin(body.pin, store.settings.pinHash || "")) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }
    await createSession();
    return NextResponse.json({ ok: true });
  }

  if (body.op === "logout") {
    await clearSession();
    return NextResponse.json({ ok: true });
  }

  if (!(await hasSession())) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const store = await mutateStore(body);
  return NextResponse.json(publicStore(store));
}
