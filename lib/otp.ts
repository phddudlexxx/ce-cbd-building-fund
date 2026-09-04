import "server-only";
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const otpPath = path.join(process.cwd(), "data", "otp-pending.json");
const TTL_MS = 5 * 60 * 1000;
const RESEND_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;

type Pending = {
  hash: string;
  exp: number;
  attempts: number;
  sentAt: number;
};

async function readPending(): Promise<Pending | null> {
  try {
    const raw = await readFile(otpPath, "utf8");
    if (raw.trim() === "null") return null;
    const parsed = JSON.parse(raw) as Pending;
    if (!parsed?.hash) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writePending(pending: Pending | null) {
  await mkdir(path.dirname(otpPath), { recursive: true });
  if (!pending) {
    await writeFile(otpPath, "null", "utf8");
    return;
  }
  await writeFile(otpPath, JSON.stringify(pending), "utf8");
}

function hashCode(code: string, salt: string) {
  return `${salt}:${scryptSync(code, salt, 32).toString("hex")}`;
}

function checkCode(code: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(code, salt, 32).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(next, "hex"));
  } catch {
    return false;
  }
}

export function createOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function saveOtp(code: string) {
  const salt = randomBytes(16).toString("hex");
  const pending: Pending = {
    hash: hashCode(code, salt),
    exp: Date.now() + TTL_MS,
    attempts: 0,
    sentAt: Date.now(),
  };
  await writePending(pending);
}

export async function canResendOtp() {
  const pending = await readPending();
  if (!pending?.exp) return { ok: true as const };
  const wait = pending.sentAt + RESEND_MS - Date.now();
  if (wait > 0) return { ok: false as const, waitMs: wait };
  return { ok: true as const };
}

export async function verifyOtp(code: string) {
  const pending = await readPending();
  if (!pending?.hash || pending.exp < Date.now()) {
    return { ok: false as const, error: "That code has expired. Enter your PIN again." };
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    await writePending(null);
    return { ok: false as const, error: "Too many tries. Enter your PIN again." };
  }
  pending.attempts += 1;
  if (!checkCode(code.replace(/\D/g, "").slice(0, 6), pending.hash)) {
    await writePending(pending);
    return { ok: false as const, error: "That code is not right. Try again." };
  }
  await writePending(null);
  return { ok: true as const };
}

export async function clearOtp() {
  await writePending(null);
}
