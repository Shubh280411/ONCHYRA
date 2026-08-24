export function cc(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cc);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())] = v;
  }
  return out;
}

export function ccArray(arr: unknown[]): unknown[] {
  return arr.map(cc);
}

export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())] = v;
  }
  return out;
}

export function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, (c: string) => '_' + c.toLowerCase())] = v;
  }
  return out;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function detectApiUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('onc_api');
  if (stored) return stored;
  return '';
}

export function getUid(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('onc_uid');
}

export function setUid(uid: string): void {
  localStorage.setItem('onc_uid', uid);
}

export function clearUid(): void {
  localStorage.removeItem('onc_uid');
}
