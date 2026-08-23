import https from 'https';

interface PriceCache {
  price: number;
  time: number;
}

const SOURCES = [
  { url: 'https://api.binance.com/api/v3/ticker/price?symbol=POLUSDT', parse: (d: { price?: string }) => parseFloat(d.price || '0') },
  { url: 'https://api.binance.com/api/v3/ticker/price?symbol=MATICUSDT', parse: (d: { price?: string }) => parseFloat(d.price || '0') },
  { url: 'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd', parse: (d: Record<string, { usd?: number }>) => d['matic-network']?.usd },
];

let cache: PriceCache = { price: 0, time: 0 };

function httpsGet(url: string, timeoutMs = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, rejectUnauthorized: false }, res => {
      let d = '';
      res.on('data', (c: Buffer) => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchPolPrice(): Promise<number | null> {
  for (const src of SOURCES) {
    try {
      const body = await httpsGet(src.url);
      const data = JSON.parse(body);
      const p = src.parse(data);
      if (p && p > 0.001) return p;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[PRICE] Fail', src.url.split('?')[0], msg.slice(0, 50));
    }
  }
  return null;
}

export async function getPrice(): Promise<number> {
  if (Date.now() - cache.time < 60000 && cache.price > 0) return cache.price;
  const p = await fetchPolPrice();
  if (p) { cache = { price: p, time: Date.now() }; return p; }
  return cache.price || 0;
}

export async function getPriceCached(): Promise<{ price: number }> {
  const p = await getPrice();
  return { price: p };
}
