import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, update } from '@/lib/db';
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

async function sweepUSDT(index: number, provider: ethers.JsonRpcProvider) {
  const child = getChildWallet(index);
  const { wallet: master } = getMaster();
  const token = new ethers.Contract(USDT_CONTRACT, ERC20_ABI, provider);
  const decimals = await token.decimals();
  const rawBalance = await token.balanceOf(child.address);
  if (rawBalance <= BigInt(0)) return { swept: 0, reason: 'No balance' };
  const childSigner = child.connect(provider);
  const tokenSigner = token.connect(childSigner);
  const tx = await (tokenSigner as ethers.Contract).getFunction("transfer")(master!.address, rawBalance);
  const receipt = await tx.wait();
  const amount = Number(ethers.formatUnits(rawBalance, decimals));
  return { swept: amount, txHash: receipt!.hash, gasUsed: receipt!.gasUsed?.toString() };
}

async function sweepPOL(index: number, provider: ethers.JsonRpcProvider) {
  const child = getChildWallet(index);
  const { wallet: master } = getMaster();
  const rawBalance = await provider.getBalance(child.address);
  if (rawBalance <= BigInt(0)) return { swept: 0, reason: 'No balance' };
  const childSigner = child.connect(provider);
  const gasReserve = ethers.parseEther('0.01');
  if (rawBalance <= gasReserve) return { swept: 0, reason: 'Only gas reserve' };
  const sweepAmount = rawBalance - gasReserve;
  const tx = await childSigner.sendTransaction({ to: master!.address, value: sweepAmount });
  const receipt = await tx.wait();
  const amount = Number(ethers.formatEther(sweepAmount));
  return { swept: amount, txHash: receipt!.hash, gasUsed: receipt!.gasUsed?.toString() };
}

async function sweepWallet(index: number, network: string) {
  const provider = getProvider(network);
  if (network === 'BEP20') return sweepUSDT(index, provider);
  return sweepPOL(index, provider);
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

    const { index, network } = await request.json();
    if (index === undefined || !network) return NextResponse.json({ error: 'Index and network required' }, { status: 400 });

    const result = await sweepWallet(index, network);
    if (result.swept > 0) {
      const wallets = await findWhere('deposit_wallets', { index, network });
      if (wallets.length) {
        await update('deposit_wallets', wallets[0].id as string, { swept: true, swept_at: Date.now(), sweep_tx: result.txHash }, 'id');
      }
    }

    return NextResponse.json({ index, network, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
