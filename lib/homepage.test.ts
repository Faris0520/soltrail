import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { QUESTS } from "./quests";

const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("homepage shows the trail before the learn page", () => {
  assert.match(source, /from "@\/lib\/quests"/);
  assert.match(source, /QUESTS\.map/);
  assert.match(source, /quest\.title/);
  assert.match(source, /quest\.summary/);
  assert.match(source, /quest\.stages\.length/);
  for (const quest of QUESTS) {
    assert.equal(source.includes(`"${quest.title}"`), false, quest.title);
  }
  assert.equal(source.includes("Play stage"), false);
  assert.match(source, /Learn Solana by doing/);
  assert.match(source, /new to Solana/);
  assert.match(source, /How it works/);
  assert.match(source, /connect a wallet on Devnet/);
  assert.match(source, /clear stages in order/);
  assert.match(source, /keep progress in this browser/);
  assert.match(source, /localStorage/);
  assert.match(source, /The quests/);
  assert.match(source, /What you will actually do/);
  assert.match(source, /public address and the Devnet balance/);
  assert.match(source, /in-app airdrop or the public faucet/);
  assert.match(source, /Memo program/);
  assert.match(source, /block time/);
  assert.match(source, /genesis hash with Devnet/);
  assert.match(source, /You do these on Devnet/);
  assert.match(source, /Before you start/);
  assert.match(source, /browser wallet \(Phantom\)/);
  assert.match(source, /Solana Devnet/);
  assert.match(source, /keep the progress record/);
  assert.match(source, /mainnet SOL/);
  assert.match(source, /does not create an account/);
  assert.match(source, /\/solana-learn-hero\.png/);
  assert.match(source, /three-dimensional illustration/);
  assert.match(source, /SolTrail never asks for a private key/);
  assert.match(source, /recovery phrase/);
  assert.match(source, /A signature opens in the wallet/);
  assert.equal((source.match(/Open the quests/g) ?? []).length, 2);
  assert.equal((source.match(/href="\/learn"/g) ?? []).length, 3);
  assert.match(source, /sm:grid-cols-2/);
  assert.match(source, /xl:grid-cols-3/);
  assert.match(source, /motion-safe:enabled:active:scale-\[0\.96\]/);
  assert.match(source, /transition-\[scale\]/);
  assert.equal(source.includes("—"), false);
  for (const word of ["unlock", "seamless", "journey", "elevate", "robust", "empower", "next-level"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
