import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOtpEntry } from '@/lib/otpStore';

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export async function GET(_request: NextRequest) {
  try {
    const now = Date.now();
    const map = new Map<
      string,
      {
        email: string;
        otp: string;
        createdAt: number;
        expiresAt: number;
        verified: boolean;
        attempts: number;
        usedAt: null;
        event: string;
        error: string;
      }
    >();

    try {
      const rows = await query(`SELECT * FROM otp_store ORDER BY created_at DESC LIMIT 100`);
      for (const r of rows.rows) {
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
            event: r.verified ? 'verified' : now > expires ? 'expired' : 'sent',
            error: '',
          });
        }
      }
    } catch (e: unknown) {
      console.warn('[OTP] PG otp_store unavailable:', e instanceof Error ? e.message : String(e));
    }

    for (const [key, entry] of getOtpIterator()) {
      if (!map.has(key)) {
        map.set(key, {
          email: key,
          otp: entry.otp,
          createdAt: entry.createdAt,
          expiresAt: entry.expiresAt,
          verified: entry.verified,
          attempts: entry.attempts,
          usedAt: null,
          event: entry.verified ? 'verified' : now > entry.expiresAt ? 'expired' : 'sent',
          error: '',
        });
      }
    }

    const list = [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json(list.slice(0, 200));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getOtpIterator() {
  // Access the global otpStore map
  const store = (globalThis as Record<string, unknown>).__otpStore as
    | Map<string, { otp: string; email: string; purpose: string; createdAt: number; expiresAt: number; cooldownUntil: number; verified: boolean; attempts: number }>
    | undefined;
  return store?.entries() ?? [][Symbol.iterator]();
}
