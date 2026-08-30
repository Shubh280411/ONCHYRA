import { NextRequest, NextResponse } from 'next/server';
import { findWhere, update } from '@/lib/db';

const MNEMONIC = process.env.HD_WALLET_SEED;
const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-bor.publicnode.com';
const USDT_BSC_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

async function rpcCall(rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
}

async function getNonce(rpcUrl: string, address: string): Promise<number> {
  const result = await rpcCall(rpcUrl, 'eth_getNonce', [address, 'latest']);
  return parseInt(result as string, 16);
}

async function getGasPrice(rpcUrl: string): Promise<bigint> {
  const result = await rpcCall(rpcUrl, 'eth_gasPrice', []);
  return BigInt(result as string);
}

async function sendRawTx(rpcUrl: string, signedTx: string): Promise<string> {
  return await rpcCall(rpcUrl, 'eth_sendRawTransaction', [signedTx]) as string;
}

export async function POST(request: NextRequest) {
  try {
    const { walletId, action } = await request.json();

    if (!walletId || !['sweep_pol', 'sweep_usdt'].includes(action)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const { Wallet, Mnemonic, HDNodeWallet, JsonRpcProvider, Contract, parseUnits, formatUnits } = await import('ethers');

    const mnemonic = Mnemonic.fromPhrase(MNEMONIC!);
    const seed = mnemonic.computeSeed();
    const masterNode = HDNodeWallet.fromSeed(seed);
    const masterWallet = masterNode.derivePath("m/44/60/0/0/0");

    const dw = await findWhere('deposit_wallets', { address: 'neq.__none__' }, 'created_at', 500);
    const wallet = dw.find(w => w.id === walletId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

    const path = wallet.path as string;
    const network = wallet.network as string;
    const childAddress = (wallet.address as string).toLowerCase();

    if (!path) return NextResponse.json({ error: 'Wallet has no derivation path' }, { status: 400 });

    const childWallet = masterNode.derivePath(path);

    if (childWallet.address.toLowerCase() !== childAddress) {
      return NextResponse.json({ error: 'Address mismatch' }, { status: 400 });
    }

    if (action === 'sweep_pol') {
      const provider = new JsonRpcProvider(POLYGON_RPC);
      const connectedMaster = masterWallet.connect(provider);
      const connectedChild = childWallet.connect(provider);

      const childBalance = await provider.getBalance(childAddress);
      if (childBalance === BigInt(0)) {
        return NextResponse.json({ error: 'Child wallet has 0 POL' }, { status: 400 });
      }

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(30000000000);
      const gasLimit = BigInt(21000);
      const gasCost = gasPrice * gasLimit;

      if (childBalance <= gasCost) {
        return NextResponse.json({ error: `Insufficient POL for gas. Need ${formatUnits(gasCost, 18)} POL` }, { status: 400 });
      }

      const sendAmount = childBalance - gasCost;
      const masterAddress = masterWallet.address;

      const tx = await connectedChild.sendTransaction({
        to: masterAddress,
        value: sendAmount,
        gasLimit,
        gasPrice,
        chainId: 137,
      });

      await update('deposit_wallets', walletId, {
        swept: true,
        swept_at: Date.now(),
        sweep_tx: tx.hash,
      }, 'id');

      return NextResponse.json({
        success: true,
        txHash: tx.hash,
        amount: formatUnits(sendAmount, 18),
        token: 'POL',
        from: childAddress,
        to: masterAddress.toLowerCase(),
      });

    } else if (action === 'sweep_usdt') {
      const provider = new JsonRpcProvider(BSC_RPC);
      const connectedMaster = masterWallet.connect(provider);
      const connectedChild = childWallet.connect(provider);

      const usdtContract = new Contract(USDT_BSC_CONTRACT, USDT_ABI, connectedChild);
      const usdtBalance: bigint = await usdtContract.balanceOf(childAddress);

      if (usdtBalance === BigInt(0)) {
        return NextResponse.json({ error: 'Child wallet has 0 USDT' }, { status: 400 });
      }

      const decimals: number = await usdtContract.decimals();
      const childBnbBalance = await provider.getBalance(childAddress);

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(3000000000);
      const estimatedGas = BigInt(65000);
      const gasCost = gasPrice * estimatedGas;

      if (childBnbBalance < gasCost) {
        const bnbToSend = gasCost + BigInt(100000000000000);
        const fundNonce = await getNonce(BSC_RPC, masterWallet.address);
        const fundTx = await connectedMaster.sendTransaction({
          to: childAddress,
          value: bnbToSend,
          nonce: fundNonce,
          gasLimit: BigInt(21000),
          gasPrice,
          chainId: 56,
        });
        await fundTx.wait();

        await new Promise(r => setTimeout(r, 3000));
      }

      const sweepTx = await usdtContract.transfer(masterWallet.address, usdtBalance);
      await sweepTx.wait();

      await update('deposit_wallets', walletId, {
        swept: true,
        swept_at: Date.now(),
        sweep_tx: sweepTx.hash,
      }, 'id');

      return NextResponse.json({
        success: true,
        txHash: sweepTx.hash,
        amount: formatUnits(usdtBalance, decimals),
        token: 'USDT',
        from: childAddress,
        to: masterWallet.address.toLowerCase(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[SWEEP] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
