import { createClient } from "@solana/kit";
import { solanaDevnetRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";

const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export const client = createClient()
  .use(walletSigner({ chain: "solana:devnet" }))
  .use(
    solanaDevnetRpc({
      rpcUrl,
      // Kit defaults to version 1. Phantom still signs version 0 for this flow.
      transactionConfig: { version: 0 },
    }),
  );

export type AppClient = typeof client;

export const DEVNET_RPC_URL = rpcUrl;
