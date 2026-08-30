import { NextRequest, NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getOtpEntry } from '@/lib/otpStore';

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export async function GET(_request: NextRequest) {
  try {
    const now = Date.now();
    const map = new Map<string, {
      email: string; otp: string; createdAt: number; expiresAt: number;
      verified: boolean; attempts: number; usedAt: null; event: string; error: string; purpose: string;
    }>();

    try {
      const rows = await all('otp_store', 'created_at', 100);
      for (const r of rows) {
        const key = (r.email as string || '').toLowerCase();
        const created = toNum(r.created_at);
        const expires = toNum(r.expires_at);
        if (!map.has(key) || created > map.get(key)!.createdAt) {
          map.set(key, {
            email: (r.email as string) || '',
            otp: (r.otp as string) || '',
            createdAt: created,
            expiresAt: expires,
            verified: !!r.verified,
            attempts: toNum(r.attempts),
            usedAt: null,
            purpose: (r.purpose as string) || '',
            event: (r.purpose as string) || (r.verified ? 'verified' : now > expires ? 'expired' : 'sent'),
            error: '',
          });
        }
      }
    } catch (e: unknown) {
      console.warn('[OTP] PG otp_store unavailable:', e instanceof Error ? e.message : String(e));
    }

    const store = (globalThis as Record<string, unknown>).__otpStore as
      | Map<string, { otp: string; email: string; purpose: string; createdAt: number; expiresAt: number; cooldownUntil: number; verified: boolean; attempts: number }>
      | undefined;
    if (store) {
      for (const [key, entry] of store.entries()) {
        if (!map.has(key)) {
          map.set(key, {
            email: key,
            otp: entry.otp,
            createdAt: entry.createdAt,
            expiresAt: entry.expiresAt,
            verified: entry.verified,
            attempts: entry.attempts,
            usedAt: null,
            purpose: entry.purpose || '',
            event: entry.purpose || (entry.verified ? 'verified' : now > entry.expiresAt ? 'expired' : 'sent'),
            error: '',
          });
        }
      }
    }

    const list = [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json(list.slice(0, 200));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
