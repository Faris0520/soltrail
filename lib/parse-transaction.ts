import { getBase58Encoder } from "@solana/codecs-strings";
import { MEMO_PROGRAM_ADDRESS } from "@solana-program/memo";
import { feeFromTransaction } from "./cluster-read";
import { emptySnapshot, type MemoHit, type MemoTransactionSnapshot } from "./verify";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function memoTextFromParsed(parsed: unknown): string | null {
  if (typeof parsed === "string") return parsed;
  if (!isRecord(parsed)) return null;
  if (typeof parsed.memo === "string") return parsed.memo;
  const info = parsed.info;
  if (typeof info === "string") return info;
  if (isRecord(info) && typeof info.memo === "string") return info.memo;
  return null;
}

function memoTextFromData(data: unknown): string | null {
  if (typeof data !== "string" || data.length === 0) return null;
  try {
    const bytes = getBase58Encoder().encode(data);
    const text = new TextDecoder().decode(bytes);
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

function collectInstruction(instruction: unknown, into: MemoHit[]) {
  if (!isRecord(instruction)) return;
  const programId = typeof instruction.programId === "string" ? instruction.programId : "";
  if (programId !== MEMO_PROGRAM_ADDRESS) return;
  const text = memoTextFromParsed(instruction.parsed) ?? memoTextFromData(instruction.data);
  if (text) into.push({ programId, text });
}

function collectList(value: unknown, into: MemoHit[]) {
  if (!Array.isArray(value)) return;
  for (const instruction of value) collectInstruction(instruction, into);
}

export function snapshotFromParsedTransaction(tx: unknown): MemoTransactionSnapshot {
  if (!isRecord(tx)) return emptySnapshot();
  const meta = isRecord(tx.meta) ? tx.meta : null;
  const transaction = isRecord(tx.transaction) ? tx.transaction : null;
  const message = transaction && isRecord(transaction.message) ? transaction.message : null;
  if (!message) return emptySnapshot();

  const signers: string[] = [];
  if (Array.isArray(message.accountKeys)) {
    for (const account of message.accountKeys) {
      if (!isRecord(account)) continue;
      if (account.signer === true && typeof account.pubkey === "string") {
        signers.push(account.pubkey);
      }
    }
  }

  const memos: MemoHit[] = [];
  collectList(message.instructions, memos);
  if (meta && Array.isArray(meta.innerInstructions)) {
    for (const group of meta.innerInstructions) {
      if (isRecord(group)) collectList(group.instructions, memos);
    }
  }

  const fee = feeFromTransaction(tx);
  return {
    found: true,
    err: meta ? meta.err : null,
    signers,
    memos,
    blockTime: typeof tx.blockTime === "number" ? tx.blockTime : null,
    feeLamports: fee.complete ? fee.lamports : null,
  };
}
