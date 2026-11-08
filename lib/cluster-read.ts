import { MEMO_PROGRAM_ADDRESS } from "@solana-program/memo";

// Published Devnet genesis hash, confirmed with getGenesisHash on
// https://api.devnet.solana.com (EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG).
export const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

export type FeeRead = { complete: true; lamports: number } | { complete: false };

export type GenesisRead =
  | { complete: true; hash: string }
  | { complete: false; hash: string | null; message: string };

export type SlotRead = { complete: true; slot: number } | { complete: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function messageFeeLamports(fee: unknown): FeeRead {
  if (typeof fee === "bigint") {
    if (fee < 0n || fee > BigInt(Number.MAX_SAFE_INTEGER)) return { complete: false };
    return { complete: true, lamports: Number(fee) };
  }
  if (typeof fee === "number" && Number.isSafeInteger(fee) && fee >= 0) {
    return { complete: true, lamports: fee };
  }
  return { complete: false };
}

export function feeFromTransaction(tx: unknown): FeeRead {
  if (!isRecord(tx) || !isRecord(tx.meta) || !("fee" in tx.meta)) return { complete: false };
  return messageFeeLamports(tx.meta.fee);
}

export function matchDevnetGenesis(hash: unknown): GenesisRead {
  if (typeof hash !== "string") {
    return { complete: false, hash: null, message: "Devnet did not return a genesis hash." };
  }
  const value = hash.trim();
  if (!value) {
    return { complete: false, hash: null, message: "Devnet did not return a genesis hash." };
  }
  if (value === DEVNET_GENESIS_HASH) return { complete: true, hash: value };
  return { complete: false, hash: value, message: "This RPC is not Devnet." };
}

export type BlockTimeRead = { complete: true; blockTime: number } | { complete: false };

export function blockTimeRead(value: unknown): BlockTimeRead {
  if (typeof value === "number" && Number.isInteger(value)) return { complete: true, blockTime: value };
  return { complete: false };
}

export function memoProgramMatches(programId: unknown): boolean {
  return typeof programId === "string" && programId === MEMO_PROGRAM_ADDRESS;
}

export function endpointIsDevnet(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().split(".").includes("devnet");
  } catch {
    return false;
  }
}

export function slotNumber(slot: unknown): SlotRead {
  if (typeof slot === "bigint") {
    if (slot < 0n || slot > BigInt(Number.MAX_SAFE_INTEGER)) return { complete: false };
    return { complete: true, slot: Number(slot) };
  }
  if (typeof slot === "number" && Number.isSafeInteger(slot) && slot >= 0) {
    return { complete: true, slot };
  }
  return { complete: false };
}
