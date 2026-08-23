const OTP_EXPIRY_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 30 * 1000;

export interface OtpEntry {
  otp: string;
  email: string;
  purpose: string;
  createdAt: number;
  expiresAt: number;
  cooldownUntil: number;
  verified: boolean;
  attempts: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OtpEntry> | undefined;
}

const otpStore: Map<string, OtpEntry> = globalThis.__otpStore ?? new Map();
if (!globalThis.__otpStore) globalThis.__otpStore = otpStore;

// Cleanup expired entries every 60s (only in Node.js runtime)
if (typeof setInterval !== 'undefined') {
  let lastCleanup = Date.now();
  setInterval(() => {
    const now = Date.now();
    if (now - lastCleanup < 55000) return;
    lastCleanup = now;
    for (const [key, entry] of otpStore) {
      if (now > entry.expiresAt) otpStore.delete(key);
    }
  }, 60000);
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpEntry(email: string): OtpEntry | undefined {
  return otpStore.get(email.toLowerCase());
}

export function setOtpEntry(email: string, entry: OtpEntry): void {
  otpStore.set(email.toLowerCase(), entry);
}

export function deleteOtpEntry(email: string): void {
  otpStore.delete(email.toLowerCase());
}

export function hasCooldown(email: string): { blocked: boolean; wait?: number } {
  const key = email.toLowerCase();
  const existing = otpStore.get(key);
  if (!existing) return { blocked: false };
  if (!existing.verified && Date.now() < existing.cooldownUntil) {
    return { blocked: true, wait: Math.ceil((existing.cooldownUntil - Date.now()) / 1000) };
  }
  return { blocked: false };
}

export { OTP_EXPIRY_MS, COOLDOWN_MS };
