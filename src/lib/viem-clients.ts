import {
  createWalletClient,
  createPublicClient,
  http,
  type WalletClient,
  type Chain,
  type Transport,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { abstractTestnet } from "viem/chains";
import { eip712WalletActions } from "viem/zksync";

// Public client — read-only, safe to create at module level
export const publicClient = createPublicClient({
  chain: abstractTestnet,
  transport: http(),
});

// Extended wallet client type with zkSync EIP-712 actions
export type ExtendedWalletClient = WalletClient<Transport, Chain, Account> &
  ReturnType<typeof eip712WalletActions>;

// Per-request wallet client factory.
// Creates a fresh wallet client scoped to a single API request.
// Replaces the old module-level singleton to prevent multi-user signer contamination.

export function createPerRequestWalletClient(
  privateKey: string
): ExtendedWalletClient {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: abstractTestnet,
    transport: http(),
  }).extend(eip712WalletActions()) as unknown as ExtendedWalletClient;
}
