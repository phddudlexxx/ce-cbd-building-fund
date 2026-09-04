import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { cookies } from "next/headers";

const COOKIE = "ce_session";
const PENDING = "ce_otp_pending";
const DEV_SECRET = "christ-embassy-cbd-building-fund-dev-secret";

let cachedSecret = "";

function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (cachedSecret) return cachedSecret;
  if (process.env.NODE_ENV !== "production") {
    cachedSecret = DEV_SECRET;
    return cachedSecret;
  }
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "auth-secret.txt");
  mkdirSync(dir, { recursive: true });
  if (existsSync(file)) {
    const stored = readFileSync(file, "utf8").trim();
    if (stored) {
      cachedSecret = stored;
      return cachedSecret;
    }
  }
  cachedSecret = randomBytes(48).toString("base64");
  writeFileSync(file, cachedSecret, { mode: 0o600 });
  return cachedSecret;
}

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = scryptSync(pin, salt, 32).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
  } catch {
    return false;
  }
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function createSession() {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions(60 * 60 * 24 * 30));
  jar.delete(PENDING);
}

export async function createPendingOtp() {
  const exp = Date.now() + 1000 * 60 * 10;
  const payload = Buffer.from(JSON.stringify({ step: "otp", exp })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(PENDING, token, cookieOptions(60 * 10));
}

export async function hasPendingOtp() {
  const jar = await cookies();
  const token = jar.get(PENDING)?.value;
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { step?: string; exp: number };
    return data.step === "otp" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(PENDING);
}

export async function hasSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (sign(payload) !== sig) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return data.exp > Date.now();
  } catch {
    return false;
  }
}
