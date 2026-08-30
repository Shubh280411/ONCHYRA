import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const balance = Number(user.onx_balance) || 0;
    const totalReceived = Number(user.onx_total_received) || 0;
    const airdropClaimed = user.onx_claimed === true;

    let allocation = { signup: 0, l1: 0, l2: 0, l3: 0 };
    const dist = await findWhere('onx_distributions', { uid }, 'created_at', 1);
    if (dist.length > 0) {
      const d = dist[0];
      allocation = {
        signup: Number(d.signup_onx) || 0,
        l1: Number(d.l1_onx) || 0,
        l2: Number(d.l2_onx) || 0,
        l3: Number(d.l3_onx) || 0,
      };
    }

    const supply = await get('onx_supply', 'global', 'id');
    const distributed = Number(supply?.distributed) || 0;

    return NextResponse.json({
      balance,
      totalReceived,
      allocation,
      airdropClaimed,
      tokenInfo: {
        maxSupply: 10000,
        publicAlloc: 8000,
        distributed,
        remaining: 10000 - distributed,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
