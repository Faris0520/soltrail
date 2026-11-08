import { MEMO_PROGRAM_ADDRESS } from "@solana-program/memo";

export const MEMO_MARKER = "SOLTRAIL|QUEST=HELLO_SOLANA";

export function practiceMemo(id: string): string {
  return `${MEMO_MARKER}|ID=${id}`;
}

export type MemoHit = {
  programId: string;
  text: string;
};

export type MemoTransactionSnapshot = {
  found: boolean;
  err: unknown;
  signers: string[];
  memos: MemoHit[];
  blockTime: number | null;
  feeLamports: number | null;
};

export type VerificationState = "passed" | "failed" | "not_found" | "unavailable";

export type VerificationCheck = {
  label: string;
  pass: boolean;
  detail: string;
};

export type Verification = {
  state: VerificationState;
  checks: VerificationCheck[];
  memo: string | null;
  signer: string | null;
  blockTime: number | null;
};

export function emptySnapshot(): MemoTransactionSnapshot {
  return { found: false, err: null, signers: [], memos: [], blockTime: null, feeLamports: null };
}

export function verifyPublicMemo(snapshot: MemoTransactionSnapshot): Verification {
  if (!snapshot.found) {
    return verifyPracticeTransaction(snapshot, { wallet: "", memo: "" });
  }
  const memo = snapshot.memos.find(
    (item) => item.programId === MEMO_PROGRAM_ADDRESS && /^SOLTRAIL\|QUEST=HELLO_SOLANA\|ID=[A-Za-z0-9-]+$/.test(item.text.trim()),
  );
  const succeeded = snapshot.err === null;
  const hasSigner = snapshot.signers.length > 0;
  const checks: VerificationCheck[] = [
    { label: "Transaction found", pass: true, detail: "Devnet returned this signature." },
    {
      label: "Transaction succeeded",
      pass: succeeded,
      detail: succeeded ? "The transaction has no error." : "The transaction recorded an error.",
    },
    {
      label: "Signer is present",
      pass: hasSigner,
      detail: hasSigner ? "The transaction has a signer." : "The transaction has no signer.",
    },
    {
      label: "Memo program and note",
      pass: Boolean(memo),
      detail: memo ? "The note is a SolTrail practice message." : "The note is not a SolTrail practice message.",
    },
  ];
  return {
    state: checks.every((check) => check.pass) ? "passed" : "failed",
    checks,
    memo: memo?.text ?? snapshot.memos[0]?.text ?? null,
    signer: snapshot.signers[0] ?? null,
    blockTime: snapshot.blockTime,
  };
}
export function verifyPracticeTransaction(
  snapshot: MemoTransactionSnapshot,
  expected: { wallet: string; memo: string },
): Verification {
  if (!snapshot.found) {
    return {
      state: "not_found",
      checks: [
        {
          label: "Transaction found",
          pass: false,
          detail: "Devnet has no transaction for this signature yet.",
        },
      ],
      memo: null,
      signer: snapshot.signers[0] ?? null,
      blockTime: snapshot.blockTime,
    };
  }

  const succeeded = snapshot.err === null;
  const signerMatches = snapshot.signers.includes(expected.wallet);
  const matching = snapshot.memos.find(
    (memo) => memo.programId === MEMO_PROGRAM_ADDRESS && memo.text.trim() === expected.memo,
  );
  const memoText = matching?.text ?? snapshot.memos[0]?.text ?? null;
  const checks: VerificationCheck[] = [
    {
      label: "Transaction found",
      pass: true,
      detail: "Devnet returned this signature.",
    },
    {
      label: "Transaction succeeded",
      pass: succeeded,
      detail: succeeded ? "The transaction has no error." : "The transaction recorded an error.",
    },
    {
      label: "Signer matches this wallet",
      pass: signerMatches,
      detail: signerMatches
        ? "The connected wallet signed this transaction."
        : "The signer on this transaction is a different address.",
    },
    {
      label: "Memo program and note",
      pass: Boolean(matching),
      detail: matching
        ? "The note matches this mission."
        : `The note does not match, or it did not come from the Memo program SolTrail uses.`,
    },
  ];

  return {
    state: checks.every((check) => check.pass) ? "passed" : "failed",
    checks,
    memo: memoText,
    signer: snapshot.signers[0] ?? null,
    blockTime: snapshot.blockTime,
  };
}
