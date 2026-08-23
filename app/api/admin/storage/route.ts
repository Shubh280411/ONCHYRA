import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const sizeRes = await query(`SELECT pg_database_size(current_database()) AS total_bytes`);
    const totalBytes = sizeRes.rows[0]?.total_bytes || 0;

    const tableRes = await query(`
      SELECT
        relname AS table_name,
        pg_total_relation_size(relid) AS total_bytes,
        pg_relation_size(relid) AS data_bytes,
        pg_indexes_size(relid) AS index_bytes,
        n_live_tup AS row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
    `);

    return NextResponse.json({
      totalBytes,
      totalMB: (Number(totalBytes) / 1024 / 1024).toFixed(2),
      tableSizes: tableRes.rows.map((t: Record<string, unknown>) => ({
        table: t.table_name,
        totalMB: (Number(t.total_bytes) / 1024 / 1024).toFixed(2),
        dataMB: (Number(t.data_bytes) / 1024 / 1024).toFixed(2),
        indexMB: (Number(t.index_bytes) / 1024 / 1024).toFixed(2),
        rows: t.row_count,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
