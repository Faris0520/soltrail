import assert from "node:assert/strict";
import test from "node:test";
import { MEMO_PROGRAM_ADDRESS } from "@solana-program/memo";
import {
  DEVNET_GENESIS_HASH,
  blockTimeRead,
  endpointIsDevnet,
  feeFromTransaction,
  matchDevnetGenesis,
  memoProgramMatches,
  messageFeeLamports,
  slotNumber,
} from "./cluster-read";

const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

test("the published Devnet genesis hash is the one recorded for that cluster", () => {
  assert.equal(DEVNET_GENESIS_HASH, "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG");
});

test("a fee read completes only when meta.fee is a lamport count", () => {
  assert.deepEqual(messageFeeLamports(5000), { complete: true, lamports: 5000 });
  assert.deepEqual(messageFeeLamports(0), { complete: true, lamports: 0 });
  assert.deepEqual(messageFeeLamports(5000n), { complete: true, lamports: 5000 });
  assert.equal(messageFeeLamports(undefined).complete, false);
  assert.equal(messageFeeLamports(null).complete, false);
  assert.equal(messageFeeLamports("5000").complete, false);
  assert.equal(messageFeeLamports(-1).complete, false);
  assert.equal(messageFeeLamports(1.5).complete, false);
  assert.deepEqual(feeFromTransaction({ meta: { fee: 5000 } }), { complete: true, lamports: 5000 });
  assert.deepEqual(feeFromTransaction({ meta: { fee: 5000n } }), { complete: true, lamports: 5000 });
  assert.equal(feeFromTransaction({ meta: {} }).complete, false);
  assert.equal(feeFromTransaction(null).complete, false);
  assert.equal(feeFromTransaction({}).complete, false);
});

test("a genesis read completes only when the hash matches published Devnet", () => {
  const match = matchDevnetGenesis(DEVNET_GENESIS_HASH);
  assert.equal(match.complete, true);
  if (match.complete) assert.equal(match.hash, DEVNET_GENESIS_HASH);

  const mainnet = matchDevnetGenesis(MAINNET_GENESIS_HASH);
  assert.equal(mainnet.complete, false);
  if (!mainnet.complete) {
    assert.equal(mainnet.hash, MAINNET_GENESIS_HASH);
    assert.match(mainnet.message, /not Devnet/);
  }

  const missing = matchDevnetGenesis(null);
  assert.equal(missing.complete, false);
  if (!missing.complete) assert.equal(missing.hash, null);

  const blank = matchDevnetGenesis("  ");
  assert.equal(blank.complete, false);
});

test("a block time clears only when Devnet provides an integer", () => {
  assert.deepEqual(blockTimeRead(1_700_000_000), { complete: true, blockTime: 1_700_000_000 });
  assert.equal(blockTimeRead(null).complete, false);
  assert.equal(blockTimeRead(undefined).complete, false);
  assert.equal(blockTimeRead("1700000000").complete, false);
});

test("the memo program matches only the program SolTrail sends", () => {
  assert.equal(memoProgramMatches(MEMO_PROGRAM_ADDRESS), true);
  assert.equal(memoProgramMatches("11111111111111111111111111111111"), false);
  assert.equal(memoProgramMatches(null), false);
});

test("a Devnet RPC host is recognized and a mainnet host is not", () => {
  assert.equal(endpointIsDevnet("https://api.devnet.solana.com"), true);
  assert.equal(endpointIsDevnet("https://api.mainnet-beta.solana.com"), false);
  assert.equal(endpointIsDevnet("not a url"), false);
});

test("a slot read completes only when the RPC returns a slot", () => {
  assert.deepEqual(slotNumber(123), { complete: true, slot: 123 });
  assert.deepEqual(slotNumber(0), { complete: true, slot: 0 });
  assert.deepEqual(slotNumber(123n), { complete: true, slot: 123 });
  assert.equal(slotNumber(undefined).complete, false);
  assert.equal(slotNumber(null).complete, false);
  assert.equal(slotNumber(-1).complete, false);
  assert.equal(slotNumber(1.2).complete, false);
  assert.equal(slotNumber("123").complete, false);
});
