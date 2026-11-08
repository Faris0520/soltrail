import { ON_CHAIN_STAGES, STAGE_ORDER, STAGE_XP, questById, type QuestId, type StageId } from "./quests";

export type StageStatus = "locked" | "available" | "in_progress" | "completed";

export type StageProgress = {
  stageId: StageId;
  status: StageStatus;
  completedAt?: string;
  transactionSignature?: string;
  xpAwarded: number;
  memoId?: string;
  balanceLamportsAtStart?: string;
  airdropSignature?: string;
};

export type UserProgress = {
  walletAddress: string;
  network: "devnet";
  totalXp: number;
  stages: StageProgress[];
  updatedAt: string;
};

const STORAGE_PREFIX = "soltrail.progress.v2.";
const onChain = new Set<string>(ON_CHAIN_STAGES);

export function storageKey(walletAddress: string): string {
  return `${STORAGE_PREFIX}${walletAddress}`;
}

export function createEmptyProgress(walletAddress: string): UserProgress {
  return {
    walletAddress,
    network: "devnet",
    totalXp: 0,
    stages: STAGE_ORDER.map((stageId) => ({
      stageId,
      status: "locked",
      xpAwarded: 0,
    })),
    updatedAt: new Date(0).toISOString(),
  };
}

function isStageId(value: string): value is StageId {
  return (STAGE_ORDER as readonly string[]).includes(value);
}

function retotal(progress: UserProgress): UserProgress {
  return {
    ...progress,
    totalXp: progress.stages.reduce((sum, stage) => sum + stage.xpAwarded, 0),
    updatedAt: new Date().toISOString(),
  };
}

function enforceOrder(stages: StageProgress[]): StageProgress[] {
  let open = true;
  return stages.map((stage) => {
    if (!open) {
      return { ...stage, status: "locked", xpAwarded: 0, completedAt: undefined };
    }
    if (stage.status !== "completed") open = false;
    return stage;
  });
}

export function normalizeProgress(value: unknown, walletAddress: string): UserProgress {
  const empty = createEmptyProgress(walletAddress);
  if (!value || typeof value !== "object") return empty;
  const record = value as Partial<UserProgress>;
  if (record.walletAddress !== walletAddress || record.network !== "devnet" || !Array.isArray(record.stages)) {
    return empty;
  }

  const saved = new Map<StageId, Partial<StageProgress>>();
  for (const stage of record.stages) {
    if (!stage || typeof stage !== "object") continue;
    const id = (stage as Partial<StageProgress>).stageId;
    if (typeof id === "string" && isStageId(id)) saved.set(id, stage as Partial<StageProgress>);
  }

  const sendSignature = saved.get("send-memo")?.transactionSignature;
  const memoSignature = typeof sendSignature === "string" ? sendSignature : undefined;

  const stages = STAGE_ORDER.map((stageId) => {
    const source = saved.get(stageId);
    const signature = typeof source?.transactionSignature === "string" ? source.transactionSignature : undefined;
    let status: StageStatus =
      source?.status === "completed" || source?.status === "in_progress" ? source.status : "locked";
    if (onChain.has(stageId) && status === "completed" && !memoSignature) status = "locked";
    return {
      stageId,
      status,
      completedAt: typeof source?.completedAt === "string" ? source.completedAt : undefined,
      transactionSignature: signature,
      xpAwarded: status === "completed" ? STAGE_XP[stageId] : 0,
      memoId: typeof source?.memoId === "string" ? source.memoId : undefined,
      balanceLamportsAtStart:
        typeof source?.balanceLamportsAtStart === "string" ? source.balanceLamportsAtStart : undefined,
      airdropSignature: typeof source?.airdropSignature === "string" ? source.airdropSignature : undefined,
    } satisfies StageProgress;
  });

  return retotal({
    walletAddress,
    network: "devnet",
    totalXp: 0,
    stages: enforceOrder(stages),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : empty.updatedAt,
  });
}

export function stageProgress(progress: UserProgress, id: StageId): StageProgress {
  const stage = progress.stages.find((item) => item.stageId === id);
  if (!stage) throw new Error(`Missing stage ${id}`);
  return stage;
}

export function displayStatus(progress: UserProgress, id: StageId): StageStatus {
  const index = STAGE_ORDER.indexOf(id);
  const previousDone = index === 0 || stageProgress(progress, STAGE_ORDER[index - 1]).status === "completed";
  const stage = stageProgress(progress, id);
  if (!previousDone) return "locked";
  if (stage.status === "completed") return "completed";
  if (stage.status === "in_progress") return "in_progress";
  return "available";
}

export function questStatus(progress: UserProgress, id: QuestId): StageStatus {
  const statuses = questById(id).stages.map((stage) => displayStatus(progress, stage.id));
  if (statuses.every((status) => status === "completed")) return "completed";
  if (statuses.some((status) => status === "completed" || status === "in_progress")) return "in_progress";
  if (statuses[0] === "available") return "available";
  return "locked";
}

export function frontierStage(progress: UserProgress): StageId {
  return STAGE_ORDER.find((id) => displayStatus(progress, id) !== "completed") ?? STAGE_ORDER[STAGE_ORDER.length - 1];
}

export function trailCleared(progress: UserProgress): boolean {
  return STAGE_ORDER.every((id) => displayStatus(progress, id) === "completed");
}

function replaceStage(progress: UserProgress, id: StageId, next: StageProgress): UserProgress {
  return retotal({
    ...progress,
    stages: progress.stages.map((stage) => (stage.stageId === id ? next : stage)),
  });
}

type StagePatch = Partial<
  Pick<StageProgress, "transactionSignature" | "memoId" | "airdropSignature" | "balanceLamportsAtStart">
>;

export function completeStage(progress: UserProgress, id: StageId, patch: StagePatch = {}): UserProgress {
  if (displayStatus(progress, id) === "locked") return progress;
  const current = stageProgress(progress, id);
  if (current.status === "completed") {
    const transactionSignature = patch.transactionSignature ?? current.transactionSignature;
    const memoId = patch.memoId ?? current.memoId;
    const airdropSignature = patch.airdropSignature ?? current.airdropSignature;
    const balanceLamportsAtStart = patch.balanceLamportsAtStart ?? current.balanceLamportsAtStart;
    if (
      transactionSignature === current.transactionSignature &&
      memoId === current.memoId &&
      airdropSignature === current.airdropSignature &&
      balanceLamportsAtStart === current.balanceLamportsAtStart
    ) {
      return progress;
    }
    return replaceStage(progress, id, {
      ...current,
      transactionSignature,
      memoId,
      airdropSignature,
      balanceLamportsAtStart,
      xpAwarded: STAGE_XP[id],
    });
  }
  return replaceStage(progress, id, {
    ...current,
    ...patch,
    status: "completed",
    completedAt: new Date().toISOString(),
    xpAwarded: STAGE_XP[id],
  });
}

export function markInProgress(progress: UserProgress, id: StageId, patch: StagePatch = {}): UserProgress {
  if (displayStatus(progress, id) === "locked" || displayStatus(progress, id) === "completed") return progress;
  const current = stageProgress(progress, id);
  return replaceStage(progress, id, { ...current, ...patch, status: "in_progress", xpAwarded: 0 });
}

export function noteStartBalance(progress: UserProgress, lamports: string): UserProgress {
  const status = displayStatus(progress, "note-start");
  if (status === "locked" || status === "completed") return progress;
  const stage = stageProgress(progress, "note-start");
  if (stage.balanceLamportsAtStart) return progress;
  return replaceStage(progress, "note-start", { ...stage, balanceLamportsAtStart: lamports });
}

export function balanceIncreased(progress: UserProgress, lamports: bigint): boolean {
  const start = stageProgress(progress, "note-start").balanceLamportsAtStart;
  if (!start) return false;
  try {
    return lamports > BigInt(start);
  } catch {
    return false;
  }
}

export function ensureMemoId(progress: UserProgress, memoId: string): UserProgress {
  if (displayStatus(progress, "prepare-note") === "locked") return progress;
  const stage = stageProgress(progress, "prepare-note");
  if (stage.memoId) return progress;
  return replaceStage(progress, "prepare-note", { ...stage, memoId });
}

export function revokeFrom(progress: UserProgress, id: StageId): UserProgress {
  const start = STAGE_ORDER.indexOf(id);
  return retotal({
    ...progress,
    stages: progress.stages.map((stage, index) => {
      if (index < start) return stage;
      return { ...stage, status: "locked", xpAwarded: 0, completedAt: undefined };
    }),
  });
}

export function loadProgress(walletAddress: string): { progress: UserProgress; storage: "ok" | "unavailable" } {
  if (typeof localStorage === "undefined") {
    return { progress: createEmptyProgress(walletAddress), storage: "unavailable" };
  }
  try {
    const raw = localStorage.getItem(storageKey(walletAddress));
    if (!raw) return { progress: createEmptyProgress(walletAddress), storage: "ok" };
    return { progress: normalizeProgress(JSON.parse(raw), walletAddress), storage: "ok" };
  } catch {
    return { progress: createEmptyProgress(walletAddress), storage: "unavailable" };
  }
}

export function saveProgress(progress: UserProgress): boolean {
  if (!progress.walletAddress || typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(storageKey(progress.walletAddress), JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function questXpEarned(progress: UserProgress, id: QuestId): number {
  return questById(id).stages.reduce((sum, stage) => sum + stageProgress(progress, stage.id).xpAwarded, 0);
}
