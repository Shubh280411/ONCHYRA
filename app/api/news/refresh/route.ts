import { NextResponse } from 'next/server';
import { all, set } from '@/lib/db';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning network'],
  ethereum: ['ethereum', 'eth', 'vitalik', 'layer 2', 'l2'],
  defi: ['defi', 'decentralized finance', 'uniswap', 'aave', 'compound', 'yield', 'liquidity pool', 'amm'],
  nft: ['nft', 'non-fungible', 'opensea', 'jpeg', 'digital art'],
  regulation: ['regulation', 'sec', 'legal', 'law', 'compliance', 'ban', 'cftc', 'congress'],
  market: ['price', 'market', 'trading', 'bull', 'bear', 'rally', 'crash', 'volume', 'all-time high', 'ath'],
  altcoins: ['altcoin', 'altcoins', 'solana', 'sol', 'cardano', 'ada', 'polkadot', 'dot', 'xrp', 'dogecoin', 'doge', 'shiba'],
};

function categorize(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return 'general';
}

function truncate(text: string, maxLen = 200): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).trim() + '...';
}

function isDuplicate(title: string, existingTitles: string[]): boolean {
  const prefix = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
  return existingTitles.some((t) => {
    const existing = t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    return prefix === existing;
  });
}

async function fetchFromRSS2JSON(): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(
      'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss',
      { headers: { 'User-Agent': 'OnchyraNews/1.0' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];
    return data.items.map((item: Record<string, unknown>, i: number) => ({
      id: `rss_${i}_${Date.now()}`,
      title: String(item.title || 'Untitled'),
      summary: truncate(String(item.description || item.content || '')),
      source: String(item.author || 'CoinTelegraph'),
      source_url: String(item.link || ''),
      image: String(item.thumbnail || (item.enclosure as Record<string, string>)?.link || ''),
      category: categorize(`${String(item.title || '')} ${String(item.description || '')}`),
      published_at: item.pubDate ? new Date(String(item.pubDate)).getTime() : Date.now(),
      created_at: Date.now(),
    }));
  } catch {
    return [];
  }
}

async function fetchFromCryptoCompare(): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {
      headers: { 'User-Agent': 'OnchyraNews/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.Data || []).map((item: Record<string, unknown>, i: number) => ({
      id: `cc_${item.id || i}_${Date.now()}`,
      title: String(item.title || 'Untitled'),
      summary: truncate(String(item.body || item.description || '')),
      source: String(item.source || 'CryptoCompare'),
      source_url: String(item.url || ''),
      image: String(item.imageurl || ''),
      category: categorize(`${String(item.title || '')} ${String(item.categories || '')}`),
      published_at: item.published_on ? Number(item.published_on) * 1000 : Date.now(),
      created_at: Date.now(),
    }));
  } catch {
    return [];
  }
}

async function doRefresh() {
  try {
    const existing = await all('news_cache', 'published_at', 1000);
    const existingTitles = existing.map((a) => String(a.title || ''));

    // Try multiple sources
    let fetched = await fetchFromRSS2JSON();
    if (fetched.length === 0) {
      fetched = await fetchFromCryptoCompare();
    }

    let saved = 0;
    let duplicatesSkipped = 0;

    for (const article of fetched) {
      if (isDuplicate(String(article.title || ''), existingTitles)) {
        duplicatesSkipped++;
        continue;
      }
      existingTitles.push(String(article.title || ''));
      await set('news_cache', String(article.id), article, 'id');
      saved++;
    }

    return NextResponse.json({ fetched: fetched.length, saved, duplicatesSkipped, source: fetched.length > 0 ? 'rss' : 'none' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ fetched: 0, saved: 0, duplicatesSkipped: 0, error: message });
  }
}

export async function POST() { return doRefresh(); }
export async function GET() { return doRefresh(); }
