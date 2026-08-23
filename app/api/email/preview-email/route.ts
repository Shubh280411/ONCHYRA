import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

function usernameReplace(html: string, name?: string) {
  return html.replace(/\{\{\s*USERNAME\s*\}\}/gi, name || 'User');
}

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

    const { customHtml } = await request.json();
    if (!customHtml) {
      return NextResponse.json({ success: false, message: 'customHtml is required' }, { status: 400 });
    }

    const html = usernameReplace(customHtml, 'John Doe');
    return NextResponse.json({ success: true, html });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
