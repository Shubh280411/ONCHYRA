const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Shubh%40280411@db.kxndpctzygcitgxundnj.supabase.co:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      user_name TEXT DEFAULT '',
      user_email TEXT DEFAULT '',
      subject TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      created_at BIGINT DEFAULT 0,
      updated_at BIGINT DEFAULT 0
    )
  `);
  console.log('support_tickets table created');

  await client.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      sender_name TEXT DEFAULT '',
      message TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT false,
      created_at BIGINT DEFAULT 0
    )
  `);
  console.log('support_messages table created');

  await client.query('ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY');

  await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO anon');
  await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated');
  await client.query('GRANT ALL ON public.support_tickets TO service_role');

  await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO anon');
  await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated');
  await client.query('GRANT ALL ON public.support_messages TO service_role');

  console.log('Permissions granted');

  await client.end();
  console.log('Done!');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
