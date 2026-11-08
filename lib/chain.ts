import { address, airdropFactory, lamports, signature as toSignature, type TransactionSigner } from "@solana/kit";
import { getAddMemoInstruction } from "@solana-program/memo";
import { explainSolanaError } from "./errors";
import { snapshotFromParsedTransaction } from "./parse-transaction";
import { client } from "./solana";
import {
  emptySnapshot,
  practiceMemo,
  verifyPracticeTransaction,
  type MemoTransactionSnapshot,
  type Verification,
} from "./verify";

const AIRDROP_LAMPORTS = 1_000_000_000n;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function readBalance(wallet: string): Promise<bigint> {
  const response = await withTimeout(
    client.rpc.getBalance(address(wallet), { commitment: "confirmed" }).send(),
    12_000,
  );
  return response.value;
}

export async function requestDevnetAirdrop(wallet: string): Promise<string> {
  const airdrop = airdropFactory({
    rpc: client.rpc,
    rpcSubscriptions: client.rpcSubscriptions,
  });
  const airdropSignature = await airdrop({
    commitment: "confirmed",
    recipientAddress: address(wallet),
    lamports: lamports(AIRDROP_LAMPORTS),
  });
  return String(airdropSignature);
}

export async function fetchSnapshot(signatureText: string): Promise<
  | { kind: "invalid" }
  | { kind: "unavailable"; message: string }
  | { kind: "snapshot"; snapshot: MemoTransactionSnapshot }
> {
  let parsedSignature: ReturnType<typeof toSignature>;
  try {
    parsedSignature = toSignature(signatureText.trim());
  } catch {
    return { kind: "invalid" };
  }
  try {
    const tx = await withTimeout(
      client.rpc
        .getTransaction(parsedSignature, {
          encoding: "jsonParsed",
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        })
        .send(),
      12_000,
    );
    return {
      kind: "snapshot",
      snapshot: tx ? snapshotFromParsedTransaction(tx) : emptySnapshot(),
    };
  } catch (error) {
    return { kind: "unavailable", message: explainSolanaError(error) };
  }
}

export async function confirmPracticeTransaction(
  signatureText: string,
  wallet: string,
  memoId: string,
): Promise<Verification> {
  const expected = { wallet, memo: practiceMemo(memoId) };
  let last = verifyPracticeTransaction(emptySnapshot(), expected);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const loaded = await fetchSnapshot(signatureText);
      if (loaded.kind === "invalid") {
        return verifyPracticeTransaction(emptySnapshot(), expected);
      }
      if (loaded.kind === "unavailable") {
        return {
          state: "unavailable",
          checks: [
            {
              label: "Transaction found",
              pass: false,
              detail: loaded.message,
            },
          ],
          memo: null,
          signer: null,
          blockTime: null,
        };
      }
      const verification = verifyPracticeTransaction(loaded.snapshot, expected);
      if (verification.state !== "not_found") return verification;
      last = verification;
    } catch (error) {
      return {
        state: "unavailable",
        checks: [
          {
            label: "Transaction found",
            pass: false,
            detail: explainSolanaError(error),
          },
        ],
        memo: null,
        signer: null,
        blockTime: null,
      };
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  return last;
}

export async function readMessageFee(signatureText: string): Promise<
  | { kind: "fee"; lamports: number }
  | { kind: "invalid" }
  | { kind: "missing" }
  | { kind: "unavailable"; message: string }
> {
  const loaded = await fetchSnapshot(signatureText);
  if (loaded.kind === "invalid") return { kind: "invalid" };
  if (loaded.kind === "unavailable") return loaded;
  if (!loaded.snapshot.found || loaded.snapshot.feeLamports === null) return { kind: "missing" };
  return { kind: "fee", lamports: loaded.snapshot.feeLamports };
}

export async function readMessageBlockTime(signatureText: string): Promise<
  | { kind: "time"; blockTime: number | null }
  | { kind: "invalid" }
  | { kind: "missing" }
  | { kind: "unavailable"; message: string }
> {
  const loaded = await fetchSnapshot(signatureText);
  if (loaded.kind === "invalid") return { kind: "invalid" };
  if (loaded.kind === "unavailable") return loaded;
  if (!loaded.snapshot.found) return { kind: "missing" };
  return { kind: "time", blockTime: loaded.snapshot.blockTime };
}

export async function readMemoProgram(
  signatureText: string,
  memo: string,
): Promise<
  | { kind: "program"; programId: string | null }
  | { kind: "invalid" }
  | { kind: "missing" }
  | { kind: "unavailable"; message: string }
> {
  const loaded = await fetchSnapshot(signatureText);
  if (loaded.kind === "invalid") return { kind: "invalid" };
  if (loaded.kind === "unavailable") return loaded;
  if (!loaded.snapshot.found) return { kind: "missing" };
  const matching = loaded.snapshot.memos.find((item) => item.text.trim() === memo);
  const programId = matching?.programId ?? loaded.snapshot.memos[0]?.programId ?? null;
  return { kind: "program", programId };
}

export async function airdropLanded(signatureText: string): Promise<
  | { kind: "confirmed" }
  | { kind: "pending" }
  | { kind: "failed" }
  | { kind: "invalid" }
  | { kind: "unavailable"; message: string }
> {
  const loaded = await fetchSnapshot(signatureText);
  if (loaded.kind === "invalid") return { kind: "invalid" };
  if (loaded.kind === "unavailable") return loaded;
  if (!loaded.snapshot.found) return { kind: "pending" };
  if (loaded.snapshot.err !== null) return { kind: "failed" };
  return { kind: "confirmed" };
}

export async function readLatestBlockhash(): Promise<string> {
  const response = await withTimeout(client.rpc.getLatestBlockhash({ commitment: "confirmed" }).send(), 12_000);
  return String(response.value.blockhash);
}

export async function readClusterGenesis(): Promise<string> {
  const hash = await withTimeout(client.rpc.getGenesisHash().send(), 12_000);
  return String(hash);
}

export async function readCurrentSlot(): Promise<bigint> {
  return withTimeout(client.rpc.getSlot({ commitment: "confirmed" }).send(), 12_000);
}

export async function sendPracticeMemo(memoId: string, signer: TransactionSigner): Promise<string> {
  const instruction = getAddMemoInstruction({
    memo: practiceMemo(memoId),
    signers: [signer],
  });
  const result = await client.sendTransaction([instruction]);
  return String(result.context.signature);
}
