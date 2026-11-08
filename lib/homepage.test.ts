import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { QUESTS } from "./quests";

const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("homepage source does not render the quest catalog", () => {
  assert.equal(source.includes("QUESTS"), false);
  assert.equal(source.includes("quest.title"), false);
  assert.equal(source.includes("Play stage"), false);
  assert.equal(source.includes("@/lib/quests"), false);
  for (const quest of QUESTS) {
    assert.equal(source.includes(quest.title), false, quest.title);
    for (const stage of quest.stages) {
      assert.equal(source.includes(stage.title), false, stage.title);
    }
  }
  assert.match(source, /Learn Solana by doing/);
  assert.match(source, /new to Solana/);
  assert.match(source, /connect a wallet on Devnet/);
  assert.match(source, /clear stages in order/);
  assert.match(source, /keep progress in this browser/);
  assert.match(source, /localStorage/);
  assert.equal(source.includes("Solana Devnet"), false);
  assert.match(source, /\/solana-learn-hero\.png/);
  assert.match(source, /three-dimensional illustration/);
  assert.match(source, /SolTrail never asks for a private key/);
  assert.match(source, /recovery phrase/);
  assert.match(source, /A signature opens in the wallet/);
  assert.match(source, /Open the quests/);
  assert.match(source, /href="\/learn"/);
  assert.equal((source.match(/Open the quests/g) ?? []).length, 1);
  assert.equal((source.match(/href="\/learn"/g) ?? []).length, 1);
});
