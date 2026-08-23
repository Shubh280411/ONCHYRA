import { Pool, PoolClient, QueryResult } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    if (!DATABASE_URL) {
      console.warn('WARN: DATABASE_URL not set, PostgreSQL not available');
      return null;
    }
    const url = new URL(DATABASE_URL);
    pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.replace(/^\//, ''),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: { rejectUnauthorized: false },
      max: 3,
      min: 0,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 15000,
      allowExitOnIdle: true,
    });
    pool.on('error', (e) => {
      console.error('PG pool error:', e.message);
      pool = null;
    });
  }
  return pool;
}

function resetPool() {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
}

export async function query(text: string, params?: unknown[], _retry = true): Promise<QueryResult> {
  const p = getPool();
  if (!p) return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  try {
    return await p.query(text, params);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (_retry && (msg.includes('terminated') || msg.includes('ECONNRESET') || msg.includes('password authentication') || msg.includes('timeout'))) {
      console.warn('[PG] Connection lost, resetting pool and retrying...');
      resetPool();
      return query(text, params, false);
    }
    throw e;
  }
}

export async function get(table: string, id: string, idColumn = 'uid'): Promise<Record<string, unknown> | null> {
  const res = await query(`SELECT * FROM "${table}" WHERE "${idColumn}" = $1`, [id]);
  return (res.rows[0] as Record<string, unknown>) || null;
}

export async function set(table: string, id: string, data: Record<string, unknown>, idColumn = 'uid'): Promise<void> {
  data[idColumn] = id;
  const columns = Object.keys(data).filter(k => k !== idColumn && data[k] !== undefined);
  const values = columns.map(c => data[c]);
  const placeholders = values.map((_, i) => `$${i + 2}`);
  const setClauses = columns.map((c, i) => `"${c}" = $${i + 2}`);
  const colList = columns.map(c => `"${c}"`);
  await query(
    `INSERT INTO "${table}" ("${idColumn}", ${colList.join(', ')})
     VALUES ($1, ${placeholders.join(', ')})
     ON CONFLICT ("${idColumn}") DO UPDATE SET ${setClauses.join(', ')}`,
    [id, ...values]
  );
}

export async function update(table: string, id: string, data: Record<string, unknown>, idColumn = 'uid'): Promise<void> {
  const columns = Object.keys(data).filter(k => data[k] !== undefined);
  if (!columns.length) return;
  const setClauses = columns.map((c, i) => `"${c}" = $${i + 2}`);
  const values = columns.map(c => data[c]);
  await query(
    `UPDATE "${table}" SET ${setClauses.join(', ')} WHERE "${idColumn}" = $1`,
    [id, ...values]
  );
}

export async function remove(table: string, id: string, idColumn = 'uid'): Promise<void> {
  await query(`DELETE FROM "${table}" WHERE "${idColumn}" = $1`, [id]);
}

export async function all(table: string, orderByCol?: string | null, limitVal?: number | null): Promise<Record<string, unknown>[]> {
  let sql = `SELECT * FROM "${table}"`;
  if (orderByCol) sql += ` ORDER BY "${orderByCol}" DESC`;
  if (limitVal) sql += ` LIMIT ${limitVal}`;
  const res = await query(sql);
  return res.rows as Record<string, unknown>[];
}

export async function findWhere(
  table: string,
  conditions: Record<string, unknown>,
  orderByCol?: string | null,
  limitVal?: number | null
): Promise<Record<string, unknown>[]> {
  const clauses = Object.keys(conditions).map((c, i) => `"${c}" = $${i + 1}`);
  const values = Object.values(conditions);
  let sql = `SELECT * FROM "${table}" WHERE ${clauses.join(' AND ')}`;
  if (orderByCol) sql += ` ORDER BY "${orderByCol}" DESC`;
  if (limitVal) sql += ` LIMIT ${limitVal}`;
  const res = await query(sql, values);
  return res.rows as Record<string, unknown>[];
}

export async function increment(table: string, id: string, field: string, amount: number, idColumn = 'uid'): Promise<void> {
  await query(
    `UPDATE "${table}" SET "${field}" = COALESCE("${field}", 0) + $1 WHERE "${idColumn}" = $2`,
    [amount, id]
  );
}

export async function incrementMulti(table: string, id: string, fields: Record<string, number>, idColumn = 'uid'): Promise<void> {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined && v !== 0);
  if (!entries.length) return;
  const setClauses = entries.map(([f], i) => `"${f}" = COALESCE("${f}", 0) + $${i + 2}`);
  const values = entries.map(([, v]) => v);
  await query(
    `UPDATE "${table}" SET ${setClauses.join(', ')} WHERE "${idColumn}" = $1`,
    [id, ...values]
  );
}

export async function arrayAppend(table: string, id: string, field: string, value: unknown, idColumn = 'uid'): Promise<void> {
  await query(
    `UPDATE "${table}" SET "${field}" = COALESCE("${field}", '[]'::jsonb) || $1::jsonb WHERE "${idColumn}" = $2`,
    [JSON.stringify(value == null ? null : value), id]
  );
}

export async function findWhereIn(
  table: string,
  field: string,
  values: unknown[],
  orderByCol?: string | null,
  limitVal?: number | null
): Promise<Record<string, unknown>[]> {
  if (!values || !values.length) return [];
  const placeholders = values.map((_, i) => `$${i + 1}`);
  let sql = `SELECT * FROM "${table}" WHERE "${field}" IN (${placeholders.join(',')})`;
  if (orderByCol) sql += ` ORDER BY "${orderByCol}" DESC`;
  if (limitVal) sql += ` LIMIT ${limitVal}`;
  const res = await query(sql, values);
  return res.rows as Record<string, unknown>[];
}

export async function countWhere(table: string, conditions: Record<string, unknown> = {}): Promise<number> {
  const clauses = Object.keys(conditions).map((c, i) => `"${c}" = $${i + 1}`);
  const values = Object.values(conditions);
  let sql = `SELECT COUNT(*) as cnt FROM "${table}"`;
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
  const res = await query(sql, values);
  return parseInt((res.rows[0] as Record<string, unknown>)?.cnt as string || '0');
}

export async function findPaginated(
  table: string,
  conditions: Record<string, unknown>,
  orderByCol: string,
  limitVal: number,
  offsetVal: number
): Promise<Record<string, unknown>[]> {
  const clauses = Object.keys(conditions).map((c, i) => `"${c}" = $${i + 1}`);
  const values = Object.values(conditions);
  let sql = `SELECT * FROM "${table}"`;
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
  if (orderByCol) sql += ` ORDER BY "${orderByCol}" DESC`;
  sql += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const res = await query(sql, [...values, limitVal, offsetVal]);
  return res.rows as Record<string, unknown>[];
}

export async function closePool(): Promise<void> {
  if (pool) await pool.end();
}

export async function getClient(): Promise<PoolClient | null> {
  const p = getPool();
  if (!p) return null;
  return p.connect();
}
