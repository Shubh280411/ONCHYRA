import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { ethers } from 'ethers';

const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-bor.publicnode.com';
const MNEMONIC = process.env.HD_WALLET_SEED;
const GAS_AMOUNT = parseFloat(process.env.SWEEP_GAS_AMOUNT || '0.000003');

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

async function fundGas(index: number, network: string) {
  const provider = getProvider(network);
  const child = getChildWallet(index);
  const { wallet: master } = getMaster();
  const masterSigner = master!.connect(provider);
  const nativeBalance = await provider.getBalance(child.address);
  const needed = ethers.parseEther(GAS_AMOUNT.toString());
  if (nativeBalance >= needed) return { funded: false, reason: 'Already has gas' };
  const amount = needed - nativeBalance;
  const masterBal = await provider.getBalance(master!.address);
  if (masterBal < amount) return { funded: false, reason: 'Master insufficient: ' + ethers.formatEther(masterBal) + ' < ' + ethers.formatEther(amount) };
  const tx = await masterSigner.sendTransaction({ to: child.address, value: amount });
  await tx.wait();
  return { funded: true, txHash: tx.hash, amount: ethers.formatEther(amount) };
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

    const result = await fundGas(index, network);
    return NextResponse.json({ index, network, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
