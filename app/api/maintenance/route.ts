import { NextRequest, NextResponse } from 'next/server';
import { get, set } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 as const };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 as const };
  return null;
}

export async function GET() {
  try {
    const row = await get('settings', 'maintenance', 'key');
    const data = (row ? (row as Record<string, unknown>).value : { enabled: false }) as Record<string, unknown>;

    if (data.enabled && data.endAt && Date.now() > (data.endAt as number)) {
      data.enabled = false;
      data.autoDisabled = true;
      await set('settings', 'maintenance', { value: data }, 'key');
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { enabled, message, countdown, endAt, durationHours } = body;

    const row = await get('settings', 'maintenance', 'key');
    const current: Record<string, unknown> = row ? ((row as Record<string, unknown>).value as Record<string, unknown>) : {};

    current.enabled = !!enabled;
    if (message !== undefined) current.message = message;
    if (endAt !== undefined) current.endAt = endAt;
    if (durationHours !== undefined) current.durationHours = durationHours;
    if (enabled) {
      if (!current.startedAt) current.startedAt = Date.now();
      if (endAt) current.endAt = endAt;
    }
    current.updatedAt = Date.now();

    await set('settings', 'maintenance', { value: current }, 'key');

    return NextResponse.json({ success: true, enabled: !!enabled });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
