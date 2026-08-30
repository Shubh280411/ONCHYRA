import { NextResponse } from 'next/server';
import { findWhere, increment, update, set } from '@/lib/db';
import { getPrice } from '@/lib/priceFetcher';

const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-bor.publicnode.com';
const USDT_BSC_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const MNEMONIC = process.env.HD_WALLET_SEED;

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

let cachedMasterNode: unknown = null;

async function getMasterNode() {
  if (cachedMasterNode) return cachedMasterNode;
  const { Mnemonic, HDNodeWallet } = await import('ethers');
  const mnemonic = Mnemonic.fromPhrase(MNEMONIC!);
  const seed = mnemonic.computeSeed();
  cachedMasterNode = HDNodeWallet.fromSeed(seed);
  return cachedMasterNode;
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  return data.result;
}

async function rpcBatch(rpcUrl: string, calls: { method: string; params: unknown[] }[]): Promise<unknown[]> {
  const body = calls.map((c, i) => ({ jsonrpc: '2.0', id: i, method: c.method, params: c.params }));
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.sort((a: { id: number }, b: { id: number }) => a.id - b.id).map((r: { result: unknown }) => r.result);
}

async function getBscUsdtTxHash(address: string): Promise<string> {
  try {
    const latestHex = await rpcCall(BSC_RPC, 'eth_blockNumber', []) as string;
    const latest = parseInt(latestHex, 16);
    const from = '0x' + Math.max(0, latest - 200).toString(16);
    const to = '0x' + latest.toString(16);
    const padded = address.toLowerCase().replace('0x', '').padStart(64, '0');
    const result = await rpcCall(BSC_RPC, 'eth_getLogs', [{
      fromBlock: from, toBlock: to,
      address: USDT_BSC_CONTRACT,
      topics: [TRANSFER_TOPIC, null, '0x' + padded],
    }]);
    if (Array.isArray(result) && result.length > 0) return result[result.length - 1].transactionHash;
  } catch {}
  return '';
}

async function getBscUsdtBalance(address: string): Promise<number> {
  const padded = address.toLowerCase().replace('0x', '').padStart(64, '0');
  const calldata = '0x70a08231' + padded;
  const result = await rpcCall(BSC_RPC, 'eth_call', [{ to: USDT_BSC_CONTRACT, data: calldata }, 'latest']);
  if (!result || result === '0x') return 0;
  return parseInt(result as string, 16) / 1e18;
}

async function getPolygonPolBalance(address: string): Promise<number> {
  const result = await rpcCall(POLYGON_RPC, 'eth_getBalance', [address, 'latest']);
  if (!result) return 0;
  return parseInt(result as string, 16) / 1e18;
}

async function getPolygonPolTxHash(address: string): Promise<string> {
  try {
    const latestHex = await rpcCall(POLYGON_RPC, 'eth_blockNumber', []) as string;
    const latest = parseInt(latestHex, 16);
    const target = address.toLowerCase();
    const BATCH = 50;
    for (let offset = 0; offset < 500; offset += BATCH) {
      const calls: { method: string; params: unknown[] }[] = [];
      for (let i = 0; i < BATCH && (offset + i) < 500; i++) {
        const bn = '0x' + (latest - offset - i).toString(16);
        calls.push({ method: 'eth_getBlockByNumber', params: [bn, true] });
      }
      const blocks = await rpcBatch(POLYGON_RPC, calls);
      for (const block of blocks) {
        if (!block || !(block as Record<string, unknown>).transactions) continue;
        const txs = (block as Record<string, unknown>).transactions as Record<string, unknown>[];
        for (const tx of txs) {
          if (tx.to && (tx.to as string).toLowerCase() === target && tx.hash) return tx.hash as string;
        }
      }
    }
  } catch {}
  return '';
}

async function autoSweep(childAddress: string, path: string, network: string): Promise<{ swept: boolean; txHash?: string; amount?: string; error?: string }> {
  try {
    const { HDNodeWallet, JsonRpcProvider, Contract, parseUnits, formatUnits } = await import('ethers');
    const masterNode = await getMasterNode() as InstanceType<typeof HDNodeWallet>;
    const masterWallet = masterNode.derivePath("m/44/60/0/0/0");
    const childWallet = masterNode.derivePath(path);

    if (childWallet.address.toLowerCase() !== childAddress.toLowerCase()) {
      return { swept: false, error: 'Address mismatch' };
    }

    if (network === 'Polygon') {
      const provider = new JsonRpcProvider(POLYGON_RPC);
      const child = childWallet.connect(provider);
      const balance = await provider.getBalance(childAddress);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(30000000000);
      const gasCost = gasPrice * BigInt(21000);
      if (balance <= gasCost) return { swept: false, error: 'Insufficient POL for gas' };

      const sendAmount = balance - gasCost;
      const tx = await child.sendTransaction({
        to: masterWallet.address,
        value: sendAmount,
        gasLimit: BigInt(21000),
        gasPrice,
        chainId: 137,
      });

      console.log(`[SWEEP] POL swept: ${formatUnits(sendAmount, 18)} POL | TX: ${tx.hash}`);
      return { swept: true, txHash: tx.hash, amount: formatUnits(sendAmount, 18) };

    } else if (network === 'BEP20') {
      const provider = new JsonRpcProvider(BSC_RPC);
      const master = masterWallet.connect(provider);
      const child = childWallet.connect(provider);

      const usdtContract = new Contract(USDT_BSC_CONTRACT, USDT_ABI, child);
      const usdtBalance: bigint = await usdtContract.balanceOf(childAddress);
      if (usdtBalance === BigInt(0)) return { swept: false, error: 'No USDT to sweep' };

      const decimals: number = await usdtContract.decimals();
      const childBnb = await provider.getBalance(childAddress);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(3000000000);
      const gasCost = gasPrice * BigInt(65000);

      if (childBnb < gasCost) {
        const fundAmount = gasCost + BigInt(100000000000000);
        const fundTx = await master.sendTransaction({
          to: childAddress,
          value: fundAmount,
          gasLimit: BigInt(21000),
          gasPrice,
          chainId: 56,
        });
        await fundTx.wait();
        console.log(`[SWEEP] BNB gas funded: ${formatUnits(fundAmount, 18)} BNB → ${childAddress}`);
        await new Promise(r => setTimeout(r, 3000));
      }

      const sweepTx = await usdtContract.transfer(masterWallet.address, usdtBalance);
      await sweepTx.wait();

      console.log(`[SWEEP] USDT swept: ${formatUnits(usdtBalance, decimals)} USDT | TX: ${sweepTx.hash}`);
      return { swept: true, txHash: sweepTx.hash, amount: formatUnits(usdtBalance, decimals) };
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[SWEEP] Auto sweep failed:', msg);
    return { swept: false, error: msg };
  }
  return { swept: false, error: 'Unknown network' };
}

export async function GET() {
  try {
    const wallets = await findWhere('deposit_wallets', { used: 'eq.false' });
    const results: { address: string; network: string; detected: number; credited: boolean; txHash?: string; sweep?: { swept: boolean; txHash?: string; amount?: string; error?: string } }[] = [];

    const polPrice = await getPrice().catch(() => 1);

    for (const w of wallets) {
      const address = w.address as string;
      const network = w.network as string;
      const uid = w.uid as string;
      const path = w.path as string;
      let detected = 0;

      try {
        if (network === 'BEP20') {
          detected = await getBscUsdtBalance(address);
        } else if (network === 'Polygon') {
          detected = await getPolygonPolBalance(address);
        }
      } catch { continue; }

      if (detected <= 0) {
        results.push({ address, network, detected: 0, credited: false });
        continue;
      }

      if (detected > 100000) {
        console.error(`[SWEEP] Suspicious amount ${detected} ${network} on ${address} - skipping`);
        results.push({ address, network, detected, credited: false });
        continue;
      }

      let usdAmount = detected;
      let polAmt = 0;
      if (network === 'Polygon') {
        polAmt = detected;
        usdAmount = detected * (polPrice || 1);
      }

      const depId = 'dep_' + uid.slice(0, 8) + '_' + Date.now();
      const existing = await findWhere('deposits', { uid, address: address.toLowerCase() });
      const alreadyCredited = existing.some(d => {
        const amt = Number(d.amount) || 0;
        return Math.abs(amt - usdAmount) < 0.01;
      });

      if (alreadyCredited) {
        results.push({ address, network, detected, credited: false });
        continue;
      }

      let txHash = '';
      if (network === 'BEP20') {
        txHash = await getBscUsdtTxHash(address);
      } else {
        txHash = await getPolygonPolTxHash(address);
      }
      if (!txHash) txHash = 'pending_tx';

      await set('deposits', depId, {
        uid, address: address.toLowerCase(), network,
        amount: usdAmount, tx_hash: txHash, status: 'completed',
        pol_amount: polAmt, pol_price: polPrice,
        confirmed_at: Date.now(), created_at: Date.now(),
      }, 'id');

      await increment('users', uid, 'wallet_balance', usdAmount);
      await increment('users', uid, 'total_deposits', usdAmount);
      await update('deposit_wallets', w.id as string, {
        used: true, used_at: Date.now(), auto_detected: true
      }, 'id');

      let sweepResult: { swept: boolean; txHash?: string; amount?: string; error?: string } | undefined;
      if (path) {
        console.log(`[SWEEP] Auto sweeping ${network} from ${address}...`);
        sweepResult = await autoSweep(address, path, network);
        if (sweepResult.swept) {
          await update('deposit_wallets', w.id as string, {
            swept: true, swept_at: Date.now(), sweep_tx: sweepResult.txHash || null,
          }, 'id');
        }
      }

      results.push({ address, network, detected, credited: true, txHash, sweep: sweepResult });
    }

    return NextResponse.json({ scanned: wallets.length, results });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
