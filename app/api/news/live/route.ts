import { NextResponse } from 'next/server';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning'],
  Ethereum: ['ethereum', 'eth', 'vitalik', 'layer 2', 'l2', 'staking'],
  DeFi: ['defi', 'decentralized finance', 'uniswap', 'aave', 'yield', 'liquidity'],
  NFT: ['nft', 'non-fungible', 'opensea', 'digital art'],
  Regulation: ['regulation', 'sec', 'legal', 'compliance', 'congress', 'ban'],
  Market: ['price', 'market', 'trading', 'bull', 'bear', 'rally', 'crash', 'volume', 'ath'],
  Altcoins: ['solana', 'cardano', 'polkadot', 'xrp', 'dogecoin', 'shiba', 'altcoin'],
};

function categorize(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return 'General';
}

function truncate(text: string, max = 200): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).trim() + '...';
}

interface RSSItem {
  title?: string;
  description?: string;
  content?: string;
  link?: string;
  author?: string;
  pubDate?: string;
  thumbnail?: string;
  enclosure?: { link?: string };
  categories?: string[];
}

async function fetchFromRSS(rssUrl: string, source: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`, {
      headers: { 'User-Agent': 'OnchyraNews/1.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];
    return data.items.map((item: RSSItem, i: number) => ({
      id: `${source}_${i}_${Date.now()}`,
      title: item.title || 'Untitled',
      summary: truncate(item.description || item.content || ''),
      source: item.author || source,
      url: item.link || '',
      imageUrl: item.thumbnail || item.enclosure?.link || '',
      category: categorize(`${item.title || ''} ${item.description || ''}`),
      publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Fetch from multiple RSS feeds via rss2json (free, no API key)
    const [cointelegraph, bitcoinist, cryptonews] = await Promise.all([
      fetchFromRSS('https://cointelegraph.com/rss', 'CoinTelegraph'),
      fetchFromRSS('https://bitcoinist.com/feed/', 'Bitcoinist'),
      fetchFromRSS('https://cryptonews.com/news/feed/', 'CryptoNews'),
    ]);

    const allArticles = [...cointelegraph, ...bitcoinist, ...cryptonews];

    // Deduplicate by title prefix
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      const prefix = String(a.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      if (seen.has(prefix)) return false;
      seen.add(prefix);
      return true;
    });

    // Sort by published date (newest first)
    unique.sort((a, b) => Number(b.publishedAt || 0) - Number(a.publishedAt || 0));

    return NextResponse.json({ articles: unique, count: unique.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ articles: [], count: 0, error: message });
  }
}
