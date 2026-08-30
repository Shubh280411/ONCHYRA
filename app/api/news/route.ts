import { NextRequest, NextResponse } from 'next/server';
import { findWhere, all } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const cached = await all('news_cache', 'published_at', 500);

    if (!cached.length) {
      return NextResponse.json({ articles: [], total: 0, page, hasMore: false });
    }

    let filtered = cached as Record<string, unknown>[];

    if (category && category !== 'All') {
      filtered = filtered.filter((a) => a.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a) => {
        const title = String(a.title || '').toLowerCase();
        const summary = String(a.summary || '').toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const articles = filtered.slice(start, start + limit);

    return NextResponse.json({ articles, total, page, hasMore: start + limit < total });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ articles: [], total: 0, page: 1, hasMore: false, error: message });
  }
}
