import { Injectable } from '@nestjs/common';
import { parseEther, formatEther, formatGwei } from 'viem';
import { publicClient, createPerRequestWalletClient } from '../lib/viem-clients';
import type { ExtendedWalletClient } from '../lib/viem-clients';
import { ERC20_ABI, ERC20_BYTECODE } from '../lib/contract';
import { PrismaService } from '../prisma/prisma.service';

type ToolHandler = (
  args: Record<string, string>,
  wc: ExtendedWalletClient,
  addr: `0x${string}`,
) => Promise<string>;

const handlers: Record<string, ToolHandler> = {
  send_transaction: async ({ to, value }, wc) => {
    const txHash = await wc.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(value ?? '0.01'),
    });
    return `Transaction sent. Tx Hash: ${txHash}\nhttps://explorer.testnet.abs.xyz/tx/${txHash}`;
  },

  deploy_erc20: async ({ name, symbol, initialSupply }, wc) => {
    const supply = parseFloat(initialSupply || '1000000000');
    const hash = await wc.deployContract({
      abi: ERC20_ABI,
      bytecode: ERC20_BYTECODE,
      args: [name, symbol, supply],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return `${name} (${symbol}) deployed at: ${receipt.contractAddress}\nhttps://explorer.testnet.abs.xyz/address/${receipt.contractAddress}`;
  },

  estimate_gas: async ({ to, value }, _wc, addr) => {
    const gasUnits = await publicClient.estimateGas({
      account: addr,
      to: to as `0x${string}`,
      value: parseEther(value ?? '0.01'),
    });
    const gasPrice = await publicClient.getGasPrice();
    const totalCost = gasUnits * gasPrice;
    return JSON.stringify({
      gas_units: gasUnits.toString(),
      gas_price_gwei: formatGwei(gasPrice),
      total_cost_eth: formatEther(totalCost),
    });
  },
};

@Injectable()
export class ExecuteToolService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    toolName: string,
    args: Record<string, string>,
  ): Promise<{ result: string }> {
    const activeWallet = await this.prisma.wallet.findFirst({
      where: { user_id: userId, is_active: true },
    });

    if (!activeWallet) {
      throw new Error('No active wallet found');
    }

    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
      throw new Error('Server signer not configured');
    }

    const walletClient = createPerRequestWalletClient(pk);
    const walletAddress = activeWallet.address as `0x${string}`;

    const handler = handlers[toolName];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const result = await handler(args, walletClient, walletAddress);
    return { result };
  }
}
