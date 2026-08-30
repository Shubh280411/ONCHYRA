import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

function codeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const base = 0x1F1E6;
  const c = code.toUpperCase();
  return String.fromCodePoint(base + c.charCodeAt(0) - 65, base + c.charCodeAt(1) - 65);
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  DE: 'Germany', FR: 'France', JP: 'Japan', CN: 'China', BR: 'Brazil', RU: 'Russia',
  KR: 'South Korea', NG: 'Nigeria', ZA: 'South Africa', AE: 'UAE', SA: 'Saudi Arabia',
  PK: 'Pakistan', BD: 'Bangladesh', PH: 'Philippines', ID: 'Indonesia', MY: 'Malaysia',
  TH: 'Thailand', VN: 'Vietnam', TR: 'Turkey', EG: 'Egypt', KE: 'Kenya', GH: 'Ghana',
  MX: 'Mexico', IT: 'Italy', ES: 'Spain', NL: 'Netherlands', SE: 'Sweden', PL: 'Poland',
  AR: 'Argentina', CO: 'Colombia', CL: 'Chile', PE: 'Peru', NP: 'Nepal', LK: 'Sri Lanka',
  MM: 'Myanmar', SG: 'Singapore', NZ: 'New Zealand', IE: 'Ireland', PT: 'Portugal',
  GR: 'Greece', IL: 'Israel', UA: 'Ukraine', ET: 'Ethiopia', TZ: 'Tanzania', UG: 'Uganda',
};

export async function GET() {
  try {
    const users = await all('users', 'created_at', 10);
    const recent = users
      .slice(0, 5)
      .map((u: Record<string, unknown>) => ({
        name: String(u.name || 'New User'),
        createdAt: Number(u.created_at) || 0,
        country: String(u.country || ''),
        flag: codeToFlag(String(u.country || '')),
        countryName: COUNTRY_NAMES[String(u.country || '')] || '',
      }));
    return NextResponse.json(recent);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
