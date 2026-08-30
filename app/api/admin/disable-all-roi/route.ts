import { NextResponse } from 'next/server';
import { all, set } from '@/lib/db';

export async function POST() {
  try {
    const users = await all('users', 'created_at', 5000);
    let updated = 0;

    for (const user of users) {
      const uid = user.uid as string;
      if (!uid) continue;
      // Only update if roi_enabled is not already false
      if (user.roi_enabled === false || user.roi_enabled === 'false') continue;
      await set('users', uid, { ...user, roi_enabled: false }, 'uid');
      updated++;
    }

    return NextResponse.json({ success: true, total: users.length, updated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
