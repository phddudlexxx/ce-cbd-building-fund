import "server-only";

const AT_URL = "https://api.africastalking.com/version1/messaging";

export function otpPhone() {
  const raw = (process.env.OTP_PHONE || "+263773400256").trim();
  return normalizeZimPhone(raw);
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `+${digits.slice(0, 3)} ••• ••${digits.slice(-4)}`;
}

export function normalizeZimPhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("263") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+263${digits.slice(1)}`;
  if (digits.length === 9) return `+263${digits}`;
  return trimmed.startsWith("+") ? trimmed : `+${digits}`;
}

export function smsConfigured() {
  return Boolean(process.env.AT_USERNAME?.trim() && process.env.AT_API_KEY?.trim());
}

export async function sendOtpSms(phone: string, code: string) {
  const username = process.env.AT_USERNAME?.trim();
  const apiKey = process.env.AT_API_KEY?.trim();
  const from = process.env.AT_SENDER_ID?.trim();
  if (!username || !apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[OTP] Africa's Talking not set. Code for ${maskPhone(phone)} is ${code}`);
      return;
    }
    throw new Error("SMS is not configured on the server. Set AT_USERNAME and AT_API_KEY on the NAS.");
  }

  const form = new URLSearchParams({
    username,
    to: phone,
    message: `Your CE CBD Building Fund login code is ${code}. It expires in 5 minutes.`,
  });
  if (from) form.set("from", from);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(AT_URL, {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("The SMS service timed out. Check the NAS can reach Africa's Talking.");
    }
    throw new Error("Could not reach the SMS service. Try again in a moment.");
  } finally {
    clearTimeout(timer);
  }

  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error("Could not send the SMS code. Try again in a moment.");
  }

  try {
    const parsed = JSON.parse(raw) as {
      SMSMessageData?: { Message?: string; Recipients?: Array<{ status?: string; number?: string }> };
    };
    const recipients = parsed.SMSMessageData?.Recipients ?? [];
    const failed = recipients.filter((r) => (r.status ?? "").toLowerCase() !== "success");
    if (recipients.length > 0 && failed.length > 0) {
      throw new Error("Africa's Talking could not deliver the SMS. Check the number and airtime.");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Africa's Talking")) throw err;
  }
}
