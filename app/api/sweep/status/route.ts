import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';
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

export async function GET() {
  try {
    const { wallet: master } = getMaster();
    const networks = ['BEP20', 'Polygon'];
    const info: Record<string, any> = {};

    for (const net of networks) {
      try {
        const provider = getProvider(net);
        const bal = await provider.getBalance(master!.address);
        if (net === 'BEP20') {
          const token = new ethers.Contract(USDT_CONTRACT, ERC20_ABI, provider);
          const usdtRaw = await token.balanceOf(master!.address);
          const decimals = await token.decimals();
          info[net] = {
            masterAddress: master!.address,
            nativeBalance: ethers.formatEther(bal),
            tokenBalance: ethers.formatUnits(usdtRaw, decimals),
            tokenSymbol: 'USDT',
          };
        } else {
          info[net] = {
            masterAddress: master!.address,
            nativeBalance: ethers.formatEther(bal),
            tokenSymbol: 'POL',
          };
        }
      } catch (e: any) {
        info[net] = { masterAddress: master!.address, error: e.message };
      }
    }

    return NextResponse.json(info);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
