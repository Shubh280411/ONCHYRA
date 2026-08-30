import { NextRequest, NextResponse } from 'next/server';
import { get, all } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 as const };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 as const };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const distributions = await all('onx_distributions', 'created_at');
    const supply = await get('onx_supply', 'global', 'id');

    return NextResponse.json({
      distributions,
      supply: {
        maxSupply: 10000,
        publicAlloc: 8000,
        teamAlloc: 500,
        marketingAlloc: 500,
        liquidityAlloc: 1000,
        distributed: Number(supply?.distributed) || 0,
        remaining: 10000 - (Number(supply?.distributed) || 0),
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
