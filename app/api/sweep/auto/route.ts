import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, update } from '@/lib/db';
import { ethers } from 'ethers';

const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-bor.publicnode.com';
const MNEMONIC = process.env.HD_WALLET_SEED;
const GAS_AMOUNT = parseFloat(process.env.SWEEP_GAS_AMOUNT || '0.000003');
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

    const networks = ['BEP20', 'Polygon'];
    const all: any[] = [];

    for (const network of networks) {
      const wallets = await findWhere('deposit_wallets', { network, used: false });

      for (const w of wallets) {
        try {
          const info = await checkBalance(w.index as number, network);
          if (info.balance > 0.01) {
            if (network === 'BEP20') {
              try { await fundGas(w.index as number, network); } catch (e) {}
            }
            const result = await sweepWallet(w.index as number, network);
            const symbol = network === 'BEP20' ? 'USDT' : 'POL';
            all.push({ index: w.index, network, balance: info.balance, swept: result.swept, txHash: result.txHash || null, symbol });
            if (result.swept > 0) {
              await update('deposit_wallets', w.id as string, { swept: true, swept_at: Date.now(), sweep_tx: result.txHash }, 'id');
            }
          }
        } catch (e: any) {
          console.error(`AutoSweep error index ${w.index}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ swept: all.length, results: all });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
