import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const u = await get('users', uid);
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({
      activePackage: u.active_package || 'none',
      packageBoost: u.package_boost || 1,
      packageUsage: u.package_usage || 0,
      packageCap: u.package_cap || 0,
      packageStatus: u.package_status || 'none',
      remainingCap: Math.max(0, ((u.package_cap as number) || 0) - ((u.package_usage as number) || 0)),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
