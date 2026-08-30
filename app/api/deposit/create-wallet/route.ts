import { NextRequest, NextResponse } from 'next/server';
import { get, set, update } from '@/lib/db';

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
  set('settings', 'hdWalletCounter', { nextIndex: memCounter }, 'key').catch(e =>
    console.warn('[HD] Failed to persist counter:', e instanceof Error ? e.message : String(e))
  );
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

    const dwId = 'dw_' + uid.slice(0, 8) + '_' + Date.now();
    await set('deposit_wallets', dwId, {
      uid,
      network,
      address,
      path,
      index,
      used: false,
      created_at: Date.now(),
    }, 'id');

    console.log(`[HD] Generated address ${address} for uid=${uid} network=${network} index=${index}`);
    return NextResponse.json({ address, network, index });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
