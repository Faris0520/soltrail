import assert from "node:assert/strict";
import test from "node:test";
import { getBase58Encoder } from "@solana/codecs-strings";
import { MEMO_PROGRAM_ADDRESS } from "@solana-program/memo";
import { snapshotFromParsedTransaction } from "./parse-transaction";
import { practiceMemo, verifyPracticeTransaction } from "./verify";

const wallet = "Wallet111111111111111111111111111111111111";
const memo = practiceMemo("mission-1");

function decodedMemoData(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  const digits = [0];
  for (const byte of bytes.subarray(zeros)) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      carry += digits[index] << 8;
      digits[index] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  return "1".repeat(zeros) + digits.reverse().map((digit) => alphabet[digit]).join("");
}

test("a matching memo transaction passes every check", () => {
  const snapshot = snapshotFromParsedTransaction({
    blockTime: 1_700_000_000,
    meta: { err: null, innerInstructions: [] },
    transaction: {
      message: {
        accountKeys: [{ pubkey: wallet, signer: true }],
        instructions: [{ programId: MEMO_PROGRAM_ADDRESS, parsed: memo }],
      },
    },
  });
  const result = verifyPracticeTransaction(snapshot, { wallet, memo });
  assert.equal(result.state, "passed");
  assert.equal(result.checks.every((check) => check.pass), true);
  assert.equal(result.memo, memo);
  assert.equal(result.blockTime, 1_700_000_000);
});

test("base58 memo data is read back as text", () => {
  const data = decodedMemoData(memo);
  const roundTrip = new TextDecoder().decode(getBase58Encoder().encode(data));
  assert.equal(roundTrip, memo);
  const snapshot = snapshotFromParsedTransaction({
    meta: { err: null },
    transaction: {
      message: {
        accountKeys: [{ pubkey: wallet, signer: true }],
        instructions: [{ programId: MEMO_PROGRAM_ADDRESS, data }],
      },
    },
  });
  assert.equal(verifyPracticeTransaction(snapshot, { wallet, memo }).state, "passed");
});

test("the wrong signer, a failed transaction, and a different note are rejected", () => {
  const wrongSigner = snapshotFromParsedTransaction({
    meta: { err: null },
    transaction: {
      message: {
        accountKeys: [{ pubkey: "Other", signer: true }],
        instructions: [{ programId: MEMO_PROGRAM_ADDRESS, parsed: memo }],
      },
    },
  });
  assert.equal(verifyPracticeTransaction(wrongSigner, { wallet, memo }).state, "failed");

  const failed = snapshotFromParsedTransaction({
    meta: { err: { InstructionError: [0, "Custom"] } },
    transaction: {
      message: {
        accountKeys: [{ pubkey: wallet, signer: true }],
        instructions: [{ programId: MEMO_PROGRAM_ADDRESS, parsed: memo }],
      },
    },
  });
  assert.equal(verifyPracticeTransaction(failed, { wallet, memo }).state, "failed");

  const otherNote = snapshotFromParsedTransaction({
    meta: { err: null },
    transaction: {
      message: {
        accountKeys: [{ pubkey: wallet, signer: true }],
        instructions: [{ programId: MEMO_PROGRAM_ADDRESS, parsed: "hello" }],
      },
    },
  });
  assert.equal(verifyPracticeTransaction(otherNote, { wallet, memo }).state, "failed");
});

test("a missing transaction stays not found", () => {
  const result = verifyPracticeTransaction(snapshotFromParsedTransaction(null), { wallet, memo });
  assert.equal(result.state, "not_found");
});
