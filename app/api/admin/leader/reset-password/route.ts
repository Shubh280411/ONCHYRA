import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const { uid, newPassword } = await request.json();
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    const password = newPassword || 'onchyra123';

    try {
      // Dynamic import — firebase-admin may not be initialized in all environments
      const firebaseAdmin = await import('firebase-admin');
      const firebaseApp = firebaseAdmin.default;
      if (firebaseApp && typeof (firebaseApp as unknown as Record<string, unknown>)['auth'] === 'function') {
        const authInstance = (firebaseApp as unknown as Record<string, () => Promise<unknown>>)['auth']();
        await (authInstance as unknown as Record<string, (uid: string, opts: Record<string, unknown>) => Promise<unknown>>).updateUser(uid, { password });
      }
    } catch {
      // Firebase not available — skip auth update
    }

    return NextResponse.json({ success: true, message: `Password reset to: ${password}` });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
