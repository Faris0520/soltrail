export const QUEST_ORDER = [
  "wallet-basics",
  "devnet-sol",
  "first-message",
  "the-receipt",
  "the-clock",
  "your-key",
] as const;

export type QuestId = (typeof QUEST_ORDER)[number];

export const STAGE_ORDER = [
  "connect",
  "see-address",
  "read-balance",
  "note-start",
  "get-sol",
  "see-arrive",
  "prepare-note",
  "send-memo",
  "check-memo",
  "read-fee",
  "read-time",
  "name-program",
  "read-slot",
  "prove-devnet",
  "read-blockhash",
  "short-form",
  "leave-return",
  "stay-devnet",
] as const;

export type StageId = (typeof STAGE_ORDER)[number];

export const ON_CHAIN_STAGES = ["send-memo", "check-memo", "read-fee", "read-time", "name-program"] as const satisfies readonly StageId[];

export type StageCopy = {
  id: StageId;
  title: string;
  xp: number;
  detail: string;
};

export type QuestCopy = {
  id: QuestId;
  title: string;
  summary: string;
  stages: StageCopy[];
};

export const QUESTS: QuestCopy[] = [
  {
    id: "wallet-basics",
    title: "Wallet Basics",
    summary: "Connect a wallet, show its public key, and read the Devnet balance.",
    stages: [
      {
        id: "connect",
        title: "Connect",
        xp: 50,
        detail: "This stage clears when a wallet public key is connected.",
      },
      {
        id: "see-address",
        title: "See your address",
        xp: 50,
        detail: "Show the full public key. The stage clears when that address is on the page.",
      },
      {
        id: "read-balance",
        title: "Read your balance",
        xp: 100,
        detail: "Ask Devnet for the balance. The stage clears when getBalance returns. The result is shown in SOL and lamports.",
      },
    ],
  },
  {
    id: "devnet-sol",
    title: "Devnet SOL",
    summary: "Note the starting balance, get practice SOL, and see it arrive.",
    stages: [
      {
        id: "note-start",
        title: "Note the start",
        xp: 50,
        detail: "Read the balance as this stage opens and keep that number as the start.",
      },
      {
        id: "get-sol",
        title: "Get practice SOL",
        xp: 100,
        detail: "Request a Devnet airdrop, or open the public faucet.",
      },
      {
        id: "see-arrive",
        title: "See it arrive",
        xp: 100,
        detail: "This clears only when the balance is higher than the noted start, or the airdrop signature is confirmed.",
      },
    ],
  },
  {
    id: "first-message",
    title: "First Message",
    summary: "Prepare a note, send it with the Memo program, and check the transaction.",
    stages: [
      {
        id: "prepare-note",
        title: "Prepare the note",
        xp: 50,
        detail: "Read the exact note before you sign anything.",
      },
      {
        id: "send-memo",
        title: "Send it",
        xp: 200,
        detail: "Your wallet signs, and Devnet confirms a Memo transaction.",
      },
      {
        id: "check-memo",
        title: "Check it",
        xp: 200,
        detail: "Check the signature, a null error, the matching signer, the Memo program, and the exact note.",
      },
    ],
  },
  {
    id: "the-receipt",
    title: "The Receipt",
    summary: "Read the fee, the time, and the program on that same transaction.",
    stages: [
      {
        id: "read-fee",
        title: "Read the fee",
        xp: 100,
        detail: "Read meta.fee in lamports from the message transaction. This clears only when Devnet returns it.",
      },
      {
        id: "read-time",
        title: "Read the time",
        xp: 50,
        detail: "Read blockTime from that transaction. If Devnet returns null, the stage stays open.",
      },
      {
        id: "name-program",
        title: "Name the program",
        xp: 100,
        detail: "Show the Memo program address on the verified transaction. This clears when it matches the program SolTrail used.",
      },
    ],
  },
  {
    id: "the-clock",
    title: "The Clock",
    summary: "Read the slot, prove this RPC is Devnet, and read a blockhash.",
    stages: [
      {
        id: "read-slot",
        title: "Read the slot",
        xp: 100,
        detail: "Ask Devnet for the current slot. This clears when getSlot returns a number.",
      },
      {
        id: "prove-devnet",
        title: "Prove Devnet",
        xp: 100,
        detail: "Compare getGenesisHash with the published Devnet genesis hash. This clears only on a match.",
      },
      {
        id: "read-blockhash",
        title: "Read a blockhash",
        xp: 50,
        detail: "Ask Devnet for the latest blockhash. A blockhash expires. It is not a transaction by itself.",
      },
    ],
  },
  {
    id: "your-key",
    title: "Your Key",
    summary: "Compare the short address, leave and return, and stay on Devnet.",
    stages: [
      {
        id: "short-form",
        title: "Short form",
        xp: 50,
        detail: "Show the shortened address beside the full public key.",
      },
      {
        id: "leave-return",
        title: "Leave and return",
        xp: 100,
        detail: "Disconnect, connect the same wallet again, and confirm the saved XP is still in this browser.",
      },
      {
        id: "stay-devnet",
        title: "Stay on Devnet",
        xp: 50,
        detail: "Solana Devnet is the cluster for this app. The stage clears when you are connected and the app RPC is a Devnet endpoint.",
      },
    ],
  },
];

export const STAGE_XP = Object.fromEntries(
  QUESTS.flatMap((quest) => quest.stages.map((stage) => [stage.id, stage.xp])),
) as Record<StageId, number>;

export const TOTAL_XP = STAGE_ORDER.reduce((sum, id) => sum + STAGE_XP[id], 0);

export function questById(id: QuestId): QuestCopy {
  const quest = QUESTS.find((item) => item.id === id);
  if (!quest) throw new Error(`Unknown quest ${id}`);
  return quest;
}

export function stageById(id: StageId): StageCopy {
  for (const quest of QUESTS) {
    const stage = quest.stages.find((item) => item.id === id);
    if (stage) return stage;
  }
  throw new Error(`Unknown stage ${id}`);
}

export function questForStage(id: StageId): QuestCopy {
  const quest = QUESTS.find((item) => item.stages.some((stage) => stage.id === id));
  if (!quest) throw new Error(`Unknown stage ${id}`);
  return quest;
}

export function questReward(id: QuestId): number {
  return questById(id).stages.reduce((sum, stage) => sum + stage.xp, 0);
}
