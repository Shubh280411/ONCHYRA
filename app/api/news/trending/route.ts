import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET() {
  try {
    const cached = await all('news_cache', 'published_at', 200);

    const articles = (cached as Record<string, unknown>[])
      .sort((a, b) => Number(b.published_at || 0) - Number(a.published_at || 0))
      .slice(0, 10);

    return NextResponse.json({ articles });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ articles: [], error: message });
  }
}
