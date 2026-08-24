import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, countWhere } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limitVal = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '100'), 200);
    const myUid = request.nextUrl.searchParams.get('myUid') || null;

    const allRows = await findWhere('users', { balance: 'gt.0' }, 'balance', limitVal);
    const totalUsers = await countWhere('users');

    let myRank: number | null = null;
    let myUserData: Record<string, unknown> | null = null;
    if (myUid) {
      const myRow = await get('users', myUid);
      if (myRow) {
        const aheadRows = await findWhere('users', { balance: 'gt.' + (myRow.balance || 0) });
        myRank = aheadRows.length + 1;
        myUserData = {
          uid: myUid,
          name: myRow.name,
          balance: Number(myRow.balance) || 0,
          refLevel1: Number(myRow.ref_level1) || 0,
          refLevel2: Number(myRow.ref_level2) || 0,
          refLevel3: Number(myRow.ref_level3) || 0,
        };
      }
    }

    const leaders = allRows.map((r, i) => ({
      uid: r.uid,
      name: r.name || 'Anonymous',
      rank: i + 1,
      balance: Number(r.balance) || 0,
      refLevel1: Number(r.ref_level1) || 0,
      refLevel2: Number(r.ref_level2) || 0,
      refLevel3: Number(r.ref_level3) || 0,
    }));

    return NextResponse.json({ leaders, totalUsers, myRank, myUserData });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
