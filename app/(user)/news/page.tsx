'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: number;
  url: string;
  imageUrl: string;
  category: string;
}

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

function truncate(text: string, max = 180): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).trim() + '...';
}

const ALL_CATS = ['All', 'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Regulation', 'Market', 'Altcoins', 'General'];

const CAT_COLORS: Record<string, string> = {
  Bitcoin: '#f59e0b', Ethereum: '#60a5fa', DeFi: '#a78bfa', NFT: '#ec4899',
  Regulation: '#ef4444', Market: '#22c55e', Altcoins: '#14b8a6', General: 'rgba(255,255,255,0.4)',
};

export default function NewsPage() {
  const { uid } = useAuth();
  const apiUrl = detectApiUrl();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchNews = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      // Server-side fetch - no CORS issues
      const res = await fetch(`${apiUrl}/api/news/live`);
      if (!res.ok) throw new Error('Failed to fetch news');

      const data = await res.json();
      const items = (data.articles || []) as NewsArticle[];

      if (items.length > 0) {
        setArticles(items);
      } else {
        setError(data.error ? `API error: ${data.error}` : 'No news articles found. Try refreshing.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      setError(`Failed to load news: ${msg}. Try refreshing.`);
    }
    setLoading(false);
    setRefreshing(false);
  }, [apiUrl]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const filtered = articles.filter((a) => {
    if (category !== 'All' && a.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.summary.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(167,139,250,0.1)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontFamily: SG, fontSize: 11, letterSpacing: 2, color: '#a78bfa', fontWeight: 800, textTransform: 'uppercase' as const, marginTop: 16 }}>Loading News</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: INTER }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .news-card{animation:fadeUp 0.3s ease forwards}
        .news-scroll{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}
        .news-scroll::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 22, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Crypto News</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 2 }}>Live updates from the crypto world</div>
          </div>
          <button onClick={fetchNews} disabled={refreshing} style={{
            background: refreshing ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#a78bfa,#60a5fa)',
            color: refreshing ? 'rgba(255,255,255,0.3)' : '#000',
            border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 900, fontSize: 11,
            cursor: refreshing ? 'not-allowed' : 'pointer', letterSpacing: 0.5,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 3 21 9 15 9" />
            </svg>
            {refreshing ? 'LOADING...' : 'REFRESH'}
          </button>
        </div>

        {/* SEARCH */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontFamily: INTER, fontSize: 13, fontWeight: 500, width: '100%' }}
          />
        </div>

        {/* CATEGORIES */}
        <div className="news-scroll" style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
          {ALL_CATS.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              background: category === cat ? (CAT_COLORS[cat] || '#a78bfa') + '22' : 'rgba(255,255,255,0.04)',
              color: category === cat ? (CAT_COLORS[cat] || '#a78bfa') : 'rgba(255,255,255,0.4)',
              border: category === cat ? `1px solid ${(CAT_COLORS[cat] || '#a78bfa')}44` : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '7px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s',
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: 16, textAlign: 'center', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ARTICLES */}
        {filtered.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
            </svg>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginTop: 12 }}>No articles found</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Try a different category or search term</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filtered.map((article, i) => (
              <div key={article.id} className="news-card" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 18, overflow: 'hidden', animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                transition: '0.2s', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* IMAGE */}
                {article.imageUrl ? (
                  <div style={{ width: '100%', height: 160, overflow: 'hidden', position: 'relative' }}>
                    <img src={article.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 10, left: 10, background: (CAT_COLORS[article.category] || '#a78bfa') + 'cc', borderRadius: 8, padding: '4px 10px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                      {article.category}
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 100, background: `linear-gradient(135deg, ${(CAT_COLORS[article.category] || '#a78bfa')}15, rgba(96,165,250,0.08))`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={(CAT_COLORS[article.category] || '#a78bfa')} strokeWidth="1.5" strokeLinecap="round" opacity="0.3">
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                    </svg>
                    <div style={{ position: 'absolute', top: 10, left: 10, background: (CAT_COLORS[article.category] || '#a78bfa') + 'cc', borderRadius: 8, padding: '4px 10px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                      {article.category}
                    </div>
                  </div>
                )}

                {/* CONTENT */}
                <div style={{ padding: '16px 18px 18px' }}>
                  <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 14, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.summary}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: CAT_COLORS[article.category] || '#a78bfa' }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{article.source}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>&middot;</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{formatTimeAgo(article.publishedAt)}</span>
                    </div>
                    {article.url && (
                      <a href={article.url} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: 9, fontWeight: 800, color: '#a78bfa', textDecoration: 'none',
                        padding: '5px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.1)',
                        border: '1px solid rgba(167,139,250,0.15)', letterSpacing: 0.5,
                      }}>
                        READ
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COUNT */}
        {filtered.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
            Showing {filtered.length} of {articles.length} articles
          </div>
        )}

      </div>
    </div>
  );
}
