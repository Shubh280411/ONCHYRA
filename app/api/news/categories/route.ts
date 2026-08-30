import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

const CATEGORIES = [
  { id: 'bitcoin', name: 'Bitcoin' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'defi', name: 'DeFi' },
  { id: 'nft', name: 'NFT' },
  { id: 'regulation', name: 'Regulation' },
  { id: 'market', name: 'Market' },
  { id: 'altcoins', name: 'Altcoins' },
  { id: 'general', name: 'General' },
];

export async function GET() {
  try {
    const cached = await all('news_cache', 'published_at', 1000);
    const counts: Record<string, number> = {};

    for (const article of cached) {
      const cat = String(article.category || 'general');
      counts[cat] = (counts[cat] || 0) + 1;
    }

    const categories = CATEGORIES.map((c) => ({
      ...c,
      count: counts[c.id] || 0,
    }));

    return NextResponse.json({ categories });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ categories: CATEGORIES.map((c) => ({ ...c, count: 0 })), error: message });
  }
}
