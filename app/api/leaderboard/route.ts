import { NextRequest, NextResponse } from 'next/server';
import { get, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limitVal = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '100'), 200);
    const myUid = request.nextUrl.searchParams.get('myUid') || null;

    const rows = await query(
      `SELECT uid, name, referral_code, balance, ref_level1, ref_level2, ref_level3
       FROM "users" WHERE balance > 0 ORDER BY balance DESC LIMIT $1`,
      [limitVal]
    );

    const total = await query('SELECT COUNT(*) FROM "users"');
    const totalUsers = parseInt(total.rows[0]?.count as string || '0');

    let myRank: number | null = null;
    let myUserData: Record<string, unknown> | null = null;
    if (myUid) {
      const myRow = await get('users', myUid);
      if (myRow) {
        const ahead = await query(
          'SELECT COUNT(*) FROM "users" WHERE balance > $1',
          [myRow.balance || 0]
        );
        myRank = parseInt(ahead.rows[0]?.count as string || '0') + 1;
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

    const leaders = rows.rows.map((r, i) => ({
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
