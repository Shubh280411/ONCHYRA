import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, countWhere } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limitVal = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '100'), 200);
    const myUid = request.nextUrl.searchParams.get('myUid') || null;

    const allRows = await findWhere('users', { onx_balance: 'gt.0' }, 'onx_balance', limitVal);
    const totalUsers = await countWhere('users');

    let myRank: number | null = null;
    let myUserData: Record<string, unknown> | null = null;
    if (myUid) {
      const myRow = await get('users', myUid);
      if (myRow) {
        const myOnx = Number(myRow.onx_balance) || 0;
        const aheadRows = await findWhere('users', { onx_balance: 'gt.' + myOnx });
        myRank = aheadRows.length + 1;
        myUserData = {
          uid: myUid,
          name: myRow.name,
          onxBalance: myOnx,
        };
      }
    }

    const leaders = allRows.map((r, i) => ({
      uid: r.uid,
      name: r.name || 'Anonymous',
      rank: i + 1,
      onxBalance: Number(r.onx_balance) || 0,
      onxClaimed: Number(r.onx_total_received) || 0,
    }));

    return NextResponse.json({ leaders, totalUsers, myRank, myUserData });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
