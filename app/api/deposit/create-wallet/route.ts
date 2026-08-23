import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

const MNEMONIC = process.env.HD_WALLET_SEED;
if (!MNEMONIC) console.error('HD_WALLET_SEED not set in .env');

let masterNode: unknown = null;

async function getMasterNode() {
  if (masterNode) return masterNode;
  const { Mnemonic, HDNodeWallet } = await import('ethers');
  const mnemonic = Mnemonic.fromPhrase(MNEMONIC!);
  const seed = mnemonic.computeSeed();
  masterNode = HDNodeWallet.fromSeed(seed);
  return masterNode;
}

let memCounter: number | null = null;
let counterInitialized = false;

async function getNextIndex(): Promise<number> {
  if (!counterInitialized) {
    try {
      const row = await get('settings', 'hdWalletCounter', 'key');
      memCounter = row ? parseInt(String((row as Record<string, unknown>).nextIndex || 1)) : 1;
    } catch {
      memCounter = 1;
    }
    counterInitialized = true;
  }
  const next = memCounter!;
  memCounter = next + 1;
  query(
    `INSERT INTO settings (key, value) VALUES ('hdWalletCounter', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = $1::jsonb`,
    [JSON.stringify({ nextIndex: memCounter })]
  ).catch(e => console.warn('[HD] Failed to persist counter:', e instanceof Error ? e.message : String(e)));
  if (next < 1) return 1;
  return next;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, network } = body;

    if (!['BEP20', 'Polygon'].includes(network)) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    const node = await getMasterNode();
    const { HDNodeWallet } = await import('ethers');
    const index = await getNextIndex();
    const path = `m/44/60/0/0/${index}`;
    const child = (node as InstanceType<typeof HDNodeWallet>).derivePath(path);
    const address = child.address.toLowerCase();

    await query(
      `INSERT INTO deposit_wallets (id, uid, network, address, path, "index", used, created_at)
       VALUES ('dw_' || $1 || '_' || $2, $1, $3, $4, $5, $6, false, $7)`,
      [uid, Date.now(), network, address, path, index, Date.now()]
    );

    console.log(`[HD] Generated address ${address} for uid=${uid} network=${network} index=${index}`);
    return NextResponse.json({ address, network, index });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
