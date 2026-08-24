import { QueryResult } from 'pg';

const SUPABASE_URL = 'https://kxndpctzygcitgxundnj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bmRwY3R6eWdjaXRneHVuZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDMzMDIsImV4cCI6MjA5NzcxOTMwMn0.NUXX9_HNpELPYwpqOqOauzuTBJK_C5sBhINtMGvU8f8';
const REST_URL = SUPABASE_URL + '/rest/v1/';

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function restGet(table: string, params: Record<string, string> = {}): Promise<Record<string, unknown>[]> {
  const url = new URL(table, REST_URL);
  url.searchParams.set('select', '*');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`REST GET ${table} failed:`, res.status, text.slice(0, 200));
    return [];
  }
  return res.json();
}

async function restPost(table: string, body: Record<string, unknown>, prefer = 'return=representation'): Promise<unknown> {
  const url = new URL(table, REST_URL);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { ...HEADERS, Prefer: prefer },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`REST POST ${table} failed:`, res.status, text.slice(0, 200));
    return null;
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) return res.json();
  return null;
}

async function restPatch(table: string, filter: string, body: Record<string, unknown>): Promise<unknown> {
  const url = new URL(table, REST_URL);
  url.searchParams.set(filter.split('=')[0], filter.split('=').slice(1).join('='));
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`REST PATCH ${table} failed:`, res.status, text.slice(0, 200));
    return null;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function restDelete(table: string, filter: string): Promise<void> {
  const url = new URL(table, REST_URL);
  url.searchParams.set(filter.split('=')[0], filter.split('=').slice(1).join('='));
  await fetch(url.toString(), {
    method: 'DELETE',
    headers: HEADERS,
  });
}

function makeEmptyResult(): QueryResult {
  return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
}

export async function query(text: string, params?: unknown[], _retry = true): Promise<QueryResult> {
  try {
    const lower = text.trim().toLowerCase();

    if (lower.startsWith('select count(*)')) {
      const tableMatch = text.match(/FROM\s+"?(\w+)"?\s*(?:WHERE)?/i);
      if (tableMatch) {
        const table = tableMatch[1];
        const url = new URL(table, REST_URL);
        url.searchParams.set('select', '*');
        const res = await fetch(url.toString(), {
          method: 'HEAD',
          headers: { ...HEADERS, Prefer: 'count=exact' },
        });
        const count = res.headers.get('content-range')?.split('/')[1];
        return { rows: [{ cnt: count || '0' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
      }
    }

    if (lower.startsWith('select') && !lower.includes('join') && !lower.includes('group by') && !lower.includes('union')) {
      const tableMatch = text.match(/FROM\s+"?(\w+)"?\s*/i);
      if (tableMatch) {
        const table = tableMatch[1];
        const params_: Record<string, string> = {};

        const whereMatch = text.match(/WHERE\s+(.+)/i);
        if (whereMatch && params) {
          const conditions = whereMatch[1].split(/\s+AND\s+/i);
          conditions.forEach((cond, i) => {
            const colMatch = cond.match(/"(\w+)"\s*=\s*\$\d+/);
            if (colMatch && params[i] !== undefined) {
              params_[colMatch[1]] = 'eq.' + String(params[i]);
            }
          });
        }

        const orderMatch = text.match(/ORDER\s+BY\s+"?(\w+)"?\s*(ASC|DESC)?/i);
        if (orderMatch) {
          params_.order = orderMatch[1] + '.' + (orderMatch[2] || 'ASC').toLowerCase();
        }

        const limitMatch = text.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          params_.limit = limitMatch[1];
        }

        const rows = await restGet(table, params_);
        return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
      }
    }

    if (lower.startsWith('insert into')) {
      const tableMatch = text.match(/INSERT\s+INTO\s+"?(\w+)"?\s*\(([^)]+)\)/i);
      if (tableMatch && params) {
        const table = tableMatch[1];
        const cols = tableMatch[2].split(',').map(c => c.trim().replace(/"/g, ''));
        const body: Record<string, unknown> = {};
        cols.forEach((col, i) => {
          if (params[i] !== undefined) body[col] = params[i];
        });
        await restPost(table, body, 'return=minimal');
        return makeEmptyResult();
      }
    }

    if (lower.startsWith('update') && lower.includes('set')) {
      const tableMatch = text.match(/UPDATE\s+"?(\w+)"?\s+SET\s+(.+?)\s+WHERE/i);
      if (tableMatch && params) {
        const table = tableMatch[1];
        const setPart = tableMatch[2];
        const setClauses = setPart.split(',');
        const body: Record<string, unknown> = {};
        let paramIdx = 0;

        setClauses.forEach((clause) => {
          const match = clause.trim().match(/"(\w+)"\s*=\s*(.*)/);
          if (match) {
            const col = match[1];
            const valPart = match[2].trim();
            if (valPart.startsWith('$')) {
              const idx = parseInt(valPart.replace('$', '')) - 1;
              if (params[idx] !== undefined) body[col] = params[idx];
            } else if (valPart.toLowerCase().includes('coalesce')) {
              const coalesceMatch = valPart.match(/COALESCE\s*\(\s*"?(\w+)"?\s*,\s*(\d+)\s*\)\s*\+\s*\$(\d+)/i);
              if (coalesceMatch) {
                const amount = params[parseInt(coalesceMatch[3]) - 1];
                if (amount !== undefined) body[col] = Number(amount);
              }
            } else {
              body[col] = valPart.replace(/'/g, '');
            }
            paramIdx++;
          }
        });

        const whereMatch = text.match(/WHERE\s+"?(\w+)"?\s*=\s*\$(\d+)/i);
        if (whereMatch) {
          const filterCol = whereMatch[1];
          const filterVal = params[parseInt(whereMatch[2]) - 1];
          if (filterVal !== undefined) {
            await restPatch(table, `${filterCol}=eq.${filterVal}`, body);
          }
        }
        return makeEmptyResult();
      }
    }

    if (lower.startsWith('delete from')) {
      const tableMatch = text.match(/DELETE\s+FROM\s+"?(\w+)"?\s+WHERE\s+"?(\w+)"?\s*=\s*\$(\d+)/i);
      if (tableMatch && params) {
        const table = tableMatch[1];
        const col = tableMatch[2];
        const val = params[parseInt(tableMatch[3]) - 1];
        if (val !== undefined) {
          await restDelete(table, `${col}=eq.${val}`);
        }
        return makeEmptyResult();
      }
    }

    if (lower.startsWith('insert') && lower.includes('on conflict')) {
      const tableMatch = text.match(/INTO\s+"?(\w+)"?\s*\(([^)]+)\)/i);
      if (tableMatch && params) {
        const table = tableMatch[1];
        const cols = tableMatch[2].split(',').map(c => c.trim().replace(/"/g, ''));
        const body: Record<string, unknown> = {};
        cols.forEach((col, i) => {
          if (params[i] !== undefined) body[col] = params[i];
        });
        await restPost(table, body, 'resolution=merge-duplicates,return=minimal');
        return makeEmptyResult();
      }
    }

    console.warn('[DB] Unhandled SQL pattern:', text.substring(0, 100));
    return makeEmptyResult();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[DB] Query error:', msg.substring(0, 200));
    return makeEmptyResult();
  }
}

export async function get(table: string, id: string, idColumn = 'uid'): Promise<Record<string, unknown> | null> {
  try {
    const rows = await restGet(table, { [idColumn]: 'eq.' + id, limit: '1' });
    return (rows[0] as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}

export async function set(table: string, id: string, data: Record<string, unknown>, idColumn = 'uid'): Promise<void> {
  data[idColumn] = id;
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) body[k] = v;
  }
  await restPost(table, body, 'resolution=merge-duplicates,return=minimal');
}

export async function update(table: string, id: string, data: Record<string, unknown>, idColumn = 'uid'): Promise<void> {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) body[k] = v;
  }
  if (Object.keys(body).length === 0) return;
  await restPatch(table, `${idColumn}=eq.${id}`, body);
}

export async function remove(table: string, id: string, idColumn = 'uid'): Promise<void> {
  await restDelete(table, `${idColumn}=eq.${id}`);
}

export async function all(table: string, orderByCol?: string | null, limitVal?: number | null): Promise<Record<string, unknown>[]> {
  const params: Record<string, string> = {};
  if (orderByCol) params.order = orderByCol + '.desc';
  if (limitVal) params.limit = String(limitVal);
  try {
    return await restGet(table, params);
  } catch {
    return [];
  }
}

export async function findWhere(
  table: string,
  conditions: Record<string, unknown>,
  orderByCol?: string | null,
  limitVal?: number | null
): Promise<Record<string, unknown>[]> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(conditions)) {
    if (v !== undefined && v !== null) params[k] = 'eq.' + String(v);
  }
  if (orderByCol) params.order = orderByCol + '.desc';
  if (limitVal) params.limit = String(limitVal);
  try {
    const rows = await restGet(table, params);
    return rows as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export async function increment(table: string, id: string, field: string, amount: number, idColumn = 'uid'): Promise<void> {
  try {
    const current = await get(table, id, idColumn);
    const val = current ? Number(current[field]) || 0 : 0;
    await restPatch(table, `${idColumn}=eq.${id}`, { [field]: val + amount });
  } catch (e) {
    console.error('[DB] increment error:', e);
  }
}

export async function incrementMulti(table: string, id: string, fields: Record<string, number>, idColumn = 'uid'): Promise<void> {
  try {
    const current = await get(table, id, idColumn);
    const body: Record<string, number> = {};
    for (const [f, amt] of Object.entries(fields)) {
      if (amt !== undefined && amt !== 0) {
        body[f] = (current ? Number(current[f]) || 0 : 0) + amt;
      }
    }
    if (Object.keys(body).length > 0) {
      await restPatch(table, `${idColumn}=eq.${id}`, body);
    }
  } catch (e) {
    console.error('[DB] incrementMulti error:', e);
  }
}

export async function arrayAppend(table: string, id: string, field: string, value: unknown, idColumn = 'uid'): Promise<void> {
  try {
    const current = await get(table, id, idColumn);
    let arr = current ? (current[field] as unknown[]) : [];
    if (!Array.isArray(arr)) arr = [];
    arr.push(value);
    await restPatch(table, `${idColumn}=eq.${id}`, { [field]: arr });
  } catch (e) {
    console.error('[DB] arrayAppend error:', e);
  }
}

export async function findWhereIn(
  table: string,
  field: string,
  values: unknown[],
  orderByCol?: string | null,
  limitVal?: number | null
): Promise<Record<string, unknown>[]> {
  if (!values || !values.length) return [];
  const params: Record<string, string> = {};
  params[field] = 'in.(' + values.map(v => encodeURIComponent(String(v))).join(',') + ')';
  if (orderByCol) params.order = orderByCol + '.desc';
  if (limitVal) params.limit = String(limitVal);
  try {
    return await restGet(table, params);
  } catch {
    return [];
  }
}

export async function countWhere(table: string, conditions: Record<string, unknown> = {}): Promise<number> {
  try {
    const url = new URL(table, REST_URL);
    url.searchParams.set('select', '*');
    for (const [k, v] of Object.entries(conditions)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, 'eq.' + String(v));
    }
    const res = await fetch(url.toString(), {
      method: 'HEAD',
      headers: { ...HEADERS, Prefer: 'count=exact' },
    });
    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      const count = contentRange.split('/')[1];
      return parseInt(count) || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function findPaginated(
  table: string,
  conditions: Record<string, unknown>,
  orderByCol: string,
  limitVal: number,
  offsetVal: number
): Promise<Record<string, unknown>[]> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(conditions)) {
    if (v !== undefined && v !== null) params[k] = 'eq.' + String(v);
  }
  params.order = orderByCol + '.desc';
  params.limit = String(limitVal);
  params.offset = String(offsetVal);
  try {
    return await restGet(table, params);
  } catch {
    return [];
  }
}

export async function closePool(): Promise<void> {
  // No-op for REST API
}

export async function getClient(): Promise<null> {
  return null;
}
