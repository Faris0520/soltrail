import assert from "node:assert/strict";
import test from "node:test";
import {
  balanceIncreased,
  completeStage,
  createEmptyProgress,
  displayStatus,
  ensureMemoId,
  frontierStage,
  markInProgress,
  normalizeProgress,
  noteStartBalance,
  questStatus,
  revokeFrom,
  stageProgress,
} from "./progress";
import { STAGE_ORDER, TOTAL_XP, type StageId } from "./quests";

const wallet = "Wallet111111111111111111111111111111111111";

function finishThrough(id: StageId): ReturnType<typeof createEmptyProgress> {
  let progress = createEmptyProgress(wallet);
  for (const stageId of STAGE_ORDER) {
    const patch =
      stageId === "send-memo" || stageId === "check-memo"
        ? { transactionSignature: "sig", memoId: "memo-1" }
        : {};
    progress = completeStage(progress, stageId, patch);
    if (stageId === id) break;
  }
  return progress;
}

test("a later stage stays locked", () => {
  const progress = createEmptyProgress(wallet);
  assert.equal(displayStatus(progress, "connect"), "available");
  assert.equal(displayStatus(progress, "see-address"), "locked");
  assert.equal(displayStatus(progress, "read-balance"), "locked");
  const skipped = completeStage(progress, "read-balance");
  assert.equal(skipped, progress);
  assert.equal(displayStatus(skipped, "read-balance"), "locked");
  assert.equal(skipped.totalXp, 0);
  assert.equal(frontierStage(progress), "connect");
});

test("xp is awarded once and the next stage unlocks", () => {
  const once = completeStage(createEmptyProgress(wallet), "connect");
  const twice = completeStage(once, "connect");
  assert.equal(once, twice);
  assert.equal(once.totalXp, 50);
  assert.equal(displayStatus(once, "see-address"), "available");
  assert.equal(displayStatus(once, "read-balance"), "locked");
});

test("the next quest stays locked until the previous quest ends", () => {
  const progress = finishThrough("see-address");
  assert.equal(displayStatus(progress, "read-balance"), "available");
  assert.equal(displayStatus(progress, "note-start"), "locked");
  assert.equal(questStatus(progress, "devnet-sol"), "locked");
  const opened = finishThrough("read-balance");
  assert.equal(questStatus(opened, "wallet-basics"), "completed");
  assert.equal(displayStatus(opened, "note-start"), "available");
  assert.equal(questStatus(opened, "devnet-sol"), "available");
});

test("the noted start is kept and arrival can be checked once", () => {
  let progress = finishThrough("read-balance");
  progress = noteStartBalance(progress, "1000");
  const again = noteStartBalance(progress, "9999");
  assert.equal(stageProgress(again, "note-start").balanceLamportsAtStart, "1000");
  assert.equal(balanceIncreased(again, 1000n), false);
  assert.equal(balanceIncreased(again, 1001n), true);
  progress = completeStage(again, "note-start");
  progress = completeStage(progress, "get-sol", { airdropSignature: "sig" });
  const done = completeStage(progress, "see-arrive");
  assert.equal(done.totalXp, 450);
  assert.equal(completeStage(done, "see-arrive").totalXp, 450);
});

test("a stored on-chain completion without a signature is dropped", () => {
  const raw = finishThrough("prepare-note");
  const send = raw.stages.find((stage) => stage.stageId === "send-memo");
  if (!send) throw new Error("missing send stage");
  send.status = "completed";
  send.xpAwarded = 200;
  const progress = normalizeProgress(JSON.parse(JSON.stringify(raw)), wallet);
  assert.equal(stageProgress(progress, "send-memo").status, "locked");
  assert.equal(displayStatus(progress, "send-memo"), "available");
  assert.equal(progress.totalXp, 500);
});

test("revoking the message stage removes its xp and locks the check", () => {
  let progress = finishThrough("prepare-note");
  progress = ensureMemoId(progress, "memo-1");
  progress = completeStage(progress, "send-memo", { transactionSignature: "sig", memoId: "memo-1" });
  progress = completeStage(progress, "check-memo", { transactionSignature: "sig" });
  assert.equal(progress.totalXp, 900);
  const revoked = revokeFrom(progress, "send-memo");
  assert.equal(revoked.totalXp, 500);
  assert.equal(displayStatus(revoked, "send-memo"), "available");
  assert.equal(displayStatus(revoked, "check-memo"), "locked");
  assert.equal(stageProgress(revoked, "send-memo").transactionSignature, "sig");
  assert.equal(stageProgress(revoked, "prepare-note").memoId, "memo-1");
});

test("an in-progress stage stays unfinished until it is verified", () => {
  let progress = completeStage(createEmptyProgress(wallet), "connect");
  progress = markInProgress(progress, "see-address");
  assert.equal(displayStatus(progress, "see-address"), "in_progress");
  assert.equal(progress.totalXp, 50);
  assert.equal(displayStatus(progress, "read-balance"), "locked");
});

test("clearing every stage awards the total once", () => {
  const progress = finishThrough("stay-devnet");
  const again = completeStage(progress, "stay-devnet");
  assert.equal(progress, again);
  assert.equal(progress.totalXp, TOTAL_XP);
  assert.equal(TOTAL_XP, 1600);
  assert.equal(frontierStage(progress), "stay-devnet");
  assert.equal(questStatus(progress, "your-key"), "completed");
});

test("progress saved through the check opens the fee stage next", () => {
  const finished = finishThrough("check-memo");
  const progress = normalizeProgress(JSON.parse(JSON.stringify(finished)), wallet);
  assert.equal(progress.stages.length, STAGE_ORDER.length);
  assert.equal(progress.totalXp, 900);
  assert.equal(displayStatus(progress, "read-fee"), "available");
  assert.equal(displayStatus(progress, "read-time"), "locked");
  assert.equal(displayStatus(progress, "name-program"), "locked");
});
