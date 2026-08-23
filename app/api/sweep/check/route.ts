import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere } from '@/lib/db';
import { ethers } from 'ethers';

const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-bor.publicnode.com';
const MNEMONIC = process.env.HD_WALLET_SEED;
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

let masterNode: ethers.HDNodeWallet | null = null;
let masterWallet: ethers.Wallet | null = null;

function getMaster() {
  if (!masterNode) {
    const m = ethers.Mnemonic.fromPhrase(MNEMONIC!);
    masterNode = ethers.HDNodeWallet.fromSeed(m.computeSeed());
    masterWallet = new ethers.Wallet(masterNode.derivePath("m/44'/60'/0'/0/0").privateKey);
  }
  return { node: masterNode, wallet: masterWallet };
}

function getProvider(network: string) {
  return new ethers.JsonRpcProvider(network === 'BEP20' ? BSC_RPC : POLYGON_RPC);
}

function getChildWallet(index: number) {
  const { node } = getMaster();
  const child = node.derivePath(`m/44/60/0/0/${index}`);
  return new ethers.Wallet(child.privateKey);
}

async function checkUSDT(index: number, provider: ethers.JsonRpcProvider) {
  const child = getChildWallet(index);
  const token = new ethers.Contract(USDT_CONTRACT, ERC20_ABI, provider);
  const raw = await token.balanceOf(child.address);
  const decimals = await token.decimals();
  return { address: child.address, balance: Number(ethers.formatUnits(raw, decimals)), raw };
}

async function checkPOL(index: number, provider: ethers.JsonRpcProvider) {
  const child = getChildWallet(index);
  const raw = await provider.getBalance(child.address);
  return { address: child.address, balance: Number(ethers.formatEther(raw)), raw };
}

async function checkBalance(index: number, network: string) {
  try {
    const provider = getProvider(network);
    if (network === 'BEP20') return checkUSDT(index, provider);
    return checkPOL(index, provider);
  } catch (e: any) {
    return { address: 'unknown', balance: -1, error: e.message };
  }
}

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const { network } = await request.json();
    if (!network) return NextResponse.json({ error: 'Network required' }, { status: 400 });

    const wallets = await findWhere('deposit_wallets', { network, used: false });

    const results: any[] = [];
    for (const w of wallets) {
      try {
        const info = await checkBalance(w.index as number, network);
        if (info.balance > 0) results.push({ index: w.index, address: info.address, balance: info.balance, docId: w.id });
      } catch (e: any) {
        console.error(`Check error index ${w.index}: ${e.message}`);
      }
    }

    return NextResponse.json({ network, checked: wallets.length, withBalance: results.length, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
