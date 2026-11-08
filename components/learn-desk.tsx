"use client";

import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWalletStatus,
  useWallets,
} from "@solana/kit-plugin-wallet/react";
import type { UiWallet } from "@wallet-standard/ui";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  airdropLanded,
  confirmPracticeTransaction,
  readBalance,
  readClusterGenesis,
  readCurrentSlot,
  readLatestBlockhash,
  readMemoProgram,
  readMessageBlockTime,
  readMessageFee,
  requestDevnetAirdrop,
  sendPracticeMemo,
} from "@/lib/chain";
import { blockTimeRead, endpointIsDevnet, matchDevnetGenesis, memoProgramMatches, slotNumber } from "@/lib/cluster-read";
import { explainSolanaError, technicalDetail } from "@/lib/errors";
import { formatBlockTime, formatSol, shortAddress, shortBlockhash } from "@/lib/format";
import {
  balanceIncreased,
  completeStage,
  createEmptyProgress,
  displayStatus,
  ensureMemoId,
  frontierStage,
  loadProgress,
  markInProgress,
  noteStartBalance,
  questStatus,
  questXpEarned,
  revokeFrom,
  saveProgress,
  stageProgress,
  trailCleared,
  type StageStatus,
  type UserProgress,
} from "@/lib/progress";
import { QUESTS, TOTAL_XP, questById, questForStage, questReward, stageById, type QuestId, type StageId } from "@/lib/quests";
import { DEVNET_RPC_URL, client } from "@/lib/solana";
import { practiceMemo, type Verification } from "@/lib/verify";

const pillClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-iris bg-transparent px-6 text-base font-semibold text-iris hover:bg-iris hover:text-canvas active:bg-deep disabled:border disabled:border-mist disabled:bg-canvas disabled:text-slate disabled:shadow-none sm:w-auto";
const outlineClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-iris bg-transparent px-6 text-base font-semibold text-iris hover:bg-lilac active:bg-paper disabled:border-mist disabled:text-slate sm:w-auto";
const textActionClass =
  "inline-flex min-h-11 items-center text-base font-semibold text-iris hover:underline disabled:text-slate";

const PHASE_LABEL = {
  preparing: "Preparing",
  waiting: "Waiting for Wallet",
  sending: "Sending",
  confirming: "Confirming",
  success: "Success",
  failed: "Failed",
} as const;

type TxPhase = keyof typeof PHASE_LABEL | "idle";
type Busy =
  | "airdrop"
  | "send"
  | "check"
  | "fee"
  | "time"
  | "program"
  | "slot"
  | "genesis"
  | "blockhash"
  | "balance"
  | "note"
  | "arrive"
  | null;

type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; lamports: bigint }
  | { status: "error"; message: string };

type Departure = { address: string; xp: number };

const STATUS_LABEL: Record<StageStatus, string> = {
  locked: "Locked",
  available: "Ready",
  in_progress: "In progress",
  completed: "Cleared",
};

function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function isPhantom(wallet: { name: string }): boolean {
  return wallet.name.toLowerCase().includes("phantom");
}

function canLeave(progress: UserProgress): boolean {
  const status = displayStatus(progress, "leave-return");
  return status === "available" || status === "in_progress";
}

export function LearnDesk() {
  const mounted = useMounted();
  const status = useWalletStatus(client);
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);
  const address = connected?.account.address ? String(connected.account.address) : null;
  const signer = connected?.signer ?? null;
  const supportsDevnet = !connected?.account.chains?.length || connected.account.chains.includes("solana:devnet");
  const canSign = Boolean(signer) && (connected?.supportedTransactionVersions.has(0) ?? false);

  const [trackedAddress, setTrackedAddress] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [balance, setBalance] = useState<BalanceState>({ status: "idle" });
  const [balanceFor, setBalanceFor] = useState<string | null>(null);
  const [openQuest, setOpenQuest] = useState<QuestId | null>(null);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [returnNote, setReturnNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [addressShown, setAddressShown] = useState(false);
  const [shortShown, setShortShown] = useState(false);

  if (address !== trackedAddress) {
    setTrackedAddress(address);
    if (!address) {
      if (progress && trackedAddress && canLeave(progress)) {
        setDeparture({ address: trackedAddress, xp: progress.totalXp });
      } else if (!departure) {
        setProgress(null);
        setStorageWarning(false);
      }
    } else {
      const loaded = loadProgress(address);
      let next = loaded.progress;
      if (displayStatus(next, "connect") !== "completed") next = completeStage(next, "connect");
      if (departure && canLeave(next)) {
        if (departure.address === address && next.totalXp >= departure.xp) {
          next = completeStage(next, "leave-return");
          setReturnNote(`Saved score was still here: ${departure.xp} XP.`);
          setDeparture(null);
        } else if (departure.address !== address) {
          setReturnNote("This is a different wallet. Connect the wallet you just left.");
        } else {
          setReturnNote("The saved score for this wallet is not in this browser.");
        }
      }
      setProgress(next);
      setStorageWarning(loaded.storage === "unavailable");
    }
  }

  if (address !== balanceFor) {
    setBalanceFor(address);
    setBalance(address ? { status: "loading" } : { status: "idle" });
  }

  if (progress && displayStatus(progress, "prepare-note") !== "locked" && !stageProgress(progress, "prepare-note").memoId) {
    setProgress(ensureMemoId(progress, crypto.randomUUID()));
  }

  const view = progress ?? createEmptyProgress(address ?? departure?.address ?? "");
  const frontier = frontierStage(view);
  const cleared = trailCleared(view);
  const orderedWallets = [...wallets].sort((a, b) => Number(isPhantom(b)) - Number(isPhantom(a)));
  const phantomMissing = status !== "pending" && status !== "reconnecting" && !orderedWallets.some(isPhantom);
  const questsCleared = QUESTS.filter((quest) => questStatus(view, quest.id) === "completed").length;

  useEffect(() => {
    if (progress?.walletAddress) saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!address) return;
    let cancel = false;
    readBalance(address)
      .then((lamports) => {
        if (!cancel) setBalance({ status: "ready", lamports });
      })
      .catch((error: unknown) => {
        if (!cancel) setBalance({ status: "error", message: explainSolanaError(error) });
      });
    return () => {
      cancel = true;
    };
  }, [address]);

  const savedSignature = progress ? stageProgress(progress, "send-memo").transactionSignature : undefined;
  const savedMemoId = progress ? stageProgress(progress, "prepare-note").memoId : undefined;
  const savedSend = progress ? stageProgress(progress, "send-memo").status : undefined;

  useEffect(() => {
    if (!address || savedSend !== "completed" || !savedSignature || !savedMemoId) return;
    let cancel = false;
    confirmPracticeTransaction(savedSignature, address, savedMemoId).then((result) => {
      if (cancel) return;
      setVerification(result);
      if (result.state === "failed" || result.state === "not_found") {
        setProgress((current) => (current ? revokeFrom(current, "send-memo") : current));
        setActionError("The saved signature did not pass a fresh Devnet check, so the on-chain stages are open again.");
      }
    });
    return () => {
      cancel = true;
    };
  }, [address, savedMemoId, savedSend, savedSignature]);

  async function refreshBalance() {
    if (!address) return;
    setBalance({ status: "loading" });
    try {
      const lamports = await readBalance(address);
      setBalance({ status: "ready", lamports });
    } catch (error) {
      setBalance({ status: "error", message: explainSolanaError(error) });
    }
  }

  async function onConnect(wallet: UiWallet) {
    setActionError(null);
    setDetail(null);
    try {
      await connect.dispatchAsync(wallet);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    }
  }

  async function onReadBalance() {
    if (!address) return;
    setBusy("balance");
    setActionError(null);
    setDetail(null);
    try {
      const lamports = await readBalance(address);
      setBalance({ status: "ready", lamports });
      const text = `${formatSol(lamports)} SOL, which is ${lamports.toString()} lamports.`;
      setNotice(text);
      setProgress((current) => (current ? completeStage(current, "read-balance") : current));
    } catch (error) {
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  async function onNoteStart() {
    if (!address) return;
    setBusy("note");
    setActionError(null);
    setDetail(null);
    try {
      const lamports = await readBalance(address);
      setBalance({ status: "ready", lamports });
      setNotice(`Starting balance: ${formatSol(lamports)} SOL, ${lamports.toString()} lamports.`);
      setProgress((current) => {
        if (!current) return current;
        const noted = noteStartBalance(current, lamports.toString());
        return completeStage(noted, "note-start");
      });
    } catch (error) {
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  async function onAirdrop() {
    if (!address) return;
    setBusy("airdrop");
    setActionError(null);
    setDetail(null);
    setProgress((current) => (current ? markInProgress(current, "get-sol") : current));
    try {
      const airdropSignature = await requestDevnetAirdrop(address);
      setNotice(`Airdrop signature: ${airdropSignature}`);
      setProgress((current) => (current ? completeStage(current, "get-sol", { airdropSignature }) : current));
      await refreshBalance();
    } catch (error) {
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  function onFaucet() {
    setNotice("The public faucet is open. Come back and check that the SOL arrived.");
    setProgress((current) => (current ? completeStage(current, "get-sol") : current));
  }

  async function onArrive() {
    if (!address || !progress) return;
    setBusy("arrive");
    setActionError(null);
    setDetail(null);
    try {
      const lamports = await readBalance(address);
      setBalance({ status: "ready", lamports });
      const higher = balanceIncreased(progress, lamports);
      const signature = stageProgress(progress, "get-sol").airdropSignature;
      let confirmed = false;
      if (!higher && signature) {
        const landed = await airdropLanded(signature);
        if (landed.kind === "confirmed") confirmed = true;
        else if (landed.kind === "unavailable") setActionError(landed.message);
        else if (landed.kind === "failed") setActionError("The airdrop transaction failed.");
        else setActionError("The airdrop is not confirmed yet.");
      }
      const text = `${formatSol(lamports)} SOL, which is ${lamports.toString()} lamports.`;
      setNotice(text);
      if (higher || confirmed) {
        setActionError(null);
        setProgress((current) => (current ? completeStage(current, "see-arrive") : current));
      } else if (!signature) {
        setActionError("The balance is not higher than the noted start.");
      }
    } catch (error) {
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  function onShowNote() {
    setProgress((current) => (current ? completeStage(current, "prepare-note") : current));
  }

  async function onSend() {
    if (!address || !signer || !progress) return;
    const memoId = stageProgress(progress, "prepare-note").memoId;
    if (!memoId) return;
    setBusy("send");
    setActionError(null);
    setDetail(null);
    setVerification(null);
    setPhase("preparing");
    setProgress((current) => (current ? markInProgress(current, "send-memo", { memoId }) : current));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    setPhase("waiting");
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    setPhase("sending");
    try {
      const signature = await sendPracticeMemo(memoId, signer);
      setPhase("confirming");
      const result = await confirmPracticeTransaction(signature, address, memoId);
      setVerification(result);
      setProgress((current) =>
        current ? markInProgress(current, "send-memo", { memoId, transactionSignature: signature }) : current,
      );
      if (result.state === "passed") {
        setProgress((current) =>
          current ? completeStage(current, "send-memo", { memoId, transactionSignature: signature }) : current,
        );
        setPhase("success");
        setNotice("Devnet confirmed the Memo transaction.");
      } else if (result.state === "unavailable") {
        setPhase("failed");
        setActionError("The wallet accepted the message, but Devnet could not be read back yet.");
      } else if (result.state === "not_found") {
        setPhase("failed");
        setActionError("Devnet has not returned this signature yet. Check it again in a moment.");
      } else {
        setPhase("failed");
        setActionError("Devnet returned the transaction, but it did not match this stage.");
      }
    } catch (error) {
      setPhase("failed");
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  async function onCheck() {
    if (!address || !progress) return;
    const mission = stageProgress(progress, "send-memo");
    const memoId = stageProgress(progress, "prepare-note").memoId;
    if (!mission.transactionSignature || !memoId) return;
    setBusy("check");
    setActionError(null);
    setDetail(null);
    setPhase("confirming");
    const result = await confirmPracticeTransaction(mission.transactionSignature, address, memoId);
    setVerification(result);
    if (result.state === "passed") {
      setProgress((current) =>
        current ? completeStage(current, "check-memo", { transactionSignature: mission.transactionSignature }) : current,
      );
      setPhase("success");
      setNotice("The signature, signer, Memo program, and note match.");
    } else if (result.state === "failed") {
      setProgress((current) => (current ? revokeFrom(current, "send-memo") : current));
      setPhase("failed");
      setActionError("This signature did not pass the check, so the message stage is open again.");
    } else if (result.state === "not_found") {
      setPhase("failed");
      setActionError("Devnet has not returned this signature yet. Wait a moment and check again.");
    } else {
      setPhase("failed");
      setActionError(result.checks[0]?.detail ?? "Devnet did not answer. Your saved progress is still here.");
    }
    setBusy(null);
  }

  async function onReadFee() {
    if (!progress) return;
    const signature = stageProgress(progress, "send-memo").transactionSignature;
    if (!signature) return;
    setBusy("fee");
    setActionError(null);
    setDetail(null);
    const result = await readMessageFee(signature);
    if (result.kind === "fee") {
      setNotice(`Fee: ${result.lamports.toLocaleString("en-US")} lamports.`);
      setProgress((current) => (current ? completeStage(current, "read-fee") : current));
    } else if (result.kind === "unavailable") {
      setActionError(result.message);
    } else if (result.kind === "invalid") {
      setActionError("The saved signature is not a transaction id.");
    } else {
      setActionError("Devnet did not return a fee for this transaction.");
    }
    setBusy(null);
  }

  async function onReadTime() {
    if (!progress) return;
    const signature = stageProgress(progress, "send-memo").transactionSignature;
    if (!signature) return;
    setBusy("time");
    setActionError(null);
    setDetail(null);
    const result = await readMessageBlockTime(signature);
    if (result.kind === "time") {
      const read = blockTimeRead(result.blockTime);
      if (read.complete) {
        const formatted = formatBlockTime(read.blockTime);
        setNotice(`blockTime: ${read.blockTime}${formatted ? ` (${formatted})` : ""}.`);
        setProgress((current) => (current ? completeStage(current, "read-time") : current));
      } else {
        setNotice("blockTime is null. This stage stays open until Devnet provides a time.");
      }
    } else if (result.kind === "unavailable") {
      setActionError(result.message);
    } else if (result.kind === "invalid") {
      setActionError("The saved signature is not a transaction id.");
    } else {
      setActionError("Devnet did not return this transaction.");
    }
    setBusy(null);
  }

  async function onNameProgram() {
    if (!progress) return;
    const signature = stageProgress(progress, "send-memo").transactionSignature;
    const memoId = stageProgress(progress, "prepare-note").memoId;
    if (!signature || !memoId) return;
    setBusy("program");
    setActionError(null);
    setDetail(null);
    const result = await readMemoProgram(signature, practiceMemo(memoId));
    if (result.kind === "program") {
      if (memoProgramMatches(result.programId) && result.programId) {
        setNotice(`Memo program on this transaction: ${result.programId}`);
        setProgress((current) => (current ? completeStage(current, "name-program") : current));
      } else {
        setNotice(
          result.programId
            ? `This transaction names ${result.programId}. That is not the Memo program SolTrail used.`
            : "Devnet did not show a Memo program on this transaction.",
        );
      }
    } else if (result.kind === "unavailable") {
      setActionError(result.message);
    } else if (result.kind === "invalid") {
      setActionError("The saved signature is not a transaction id.");
    } else {
      setActionError("Devnet did not return this transaction.");
    }
    setBusy(null);
  }

  async function onReadSlot() {
    setBusy("slot");
    setActionError(null);
    setDetail(null);
    try {
      const slot = slotNumber(await readCurrentSlot());
      if (slot.complete) {
        setNotice(`Current slot: ${slot.slot.toLocaleString("en-US")}.`);
        setProgress((current) => (current ? completeStage(current, "read-slot") : current));
      } else {
        setActionError("Devnet did not return a slot.");
      }
    } catch (error) {
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  async function onProveDevnet() {
    setBusy("genesis");
    setActionError(null);
    setDetail(null);
    try {
      const hash = await readClusterGenesis();
      const result = matchDevnetGenesis(hash);
      if (result.complete) {
        setNotice(`Genesis hash ${result.hash}. It matches Devnet.`);
        setProgress((current) => (current ? completeStage(current, "prove-devnet") : current));
      } else {
        setNotice(result.hash ? `${result.message} Genesis hash ${result.hash}.` : result.message);
      }
    } catch (error) {
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  async function onReadBlockhash() {
    setBusy("blockhash");
    setActionError(null);
    setDetail(null);
    try {
      const blockhash = await readLatestBlockhash();
      setNotice(`${shortBlockhash(blockhash)} is the latest blockhash. A blockhash expires. It is not a transaction by itself.`);
      setProgress((current) => (current ? completeStage(current, "read-blockhash") : current));
    } catch (error) {
      setActionError(explainSolanaError(error));
      setDetail(technicalDetail(error));
    } finally {
      setBusy(null);
    }
  }

  function onShowAddress() {
    setAddressShown(true);
    setNotice(address);
    setProgress((current) => (current ? completeStage(current, "see-address") : current));
  }

  function onShowShort() {
    setShortShown(true);
    if (address) setNotice(`${shortAddress(address)} is the short form of ${address}`);
    setProgress((current) => (current ? completeStage(current, "short-form") : current));
  }

  async function onLeave() {
    if (!address || !progress) return;
    saveProgress(progress);
    setDeparture({ address, xp: progress.totalXp });
    setProgress((current) => (current ? markInProgress(current, "leave-return") : current));
    await disconnect.dispatch();
  }

  function onStayDevnet() {
    if (!address) {
      setActionError("Connect a wallet, then check Solana Devnet again.");
      return;
    }
    if (!endpointIsDevnet(DEVNET_RPC_URL)) {
      setNotice(`This app RPC is ${DEVNET_RPC_URL}, which is not a Devnet endpoint. This stage stays open.`);
      return;
    }
    setActionError(null);
    setNotice(`You are connected. This app is using ${DEVNET_RPC_URL}, a Solana Devnet endpoint.`);
    setProgress((current) => (current ? completeStage(current, "stay-devnet") : current));
  }

  const connectError = connect.error ? explainSolanaError(connect.error) : null;
  const open = openQuest ? questById(openQuest) : null;
  const stageToWork: StageId | null = open && !cleared && open.stages.some((stage) => stage.id === frontier) ? frontier : null;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-semibold text-iris">Solana Devnet</p>
      <h1 className="mt-1 text-[2rem] font-semibold leading-[1.28] text-ink sm:text-[2.75rem] sm:leading-[1.25]">
        {open ? open.title : "Quests"}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-6 text-ink">
        {open
          ? open.summary
          : "Each quest is a set of stages. Clear them in order. Your score stays in this browser for the connected wallet."}
      </p>

      <section aria-label="Score" className="mt-8 rounded-2xl border border-mist bg-paper p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-slate">Score</p>
          <p className="text-2xl font-semibold leading-8 text-ink">
            {view.totalXp} <span className="text-base font-semibold text-slate">/ {TOTAL_XP} XP</span>
          </p>
        </div>
        <div
          className="mt-3 h-2 rounded bg-lilac"
          role="meter"
          aria-label="Experience points"
          aria-valuemin={0}
          aria-valuemax={TOTAL_XP}
          aria-valuenow={view.totalXp}
        >
          <div className="score-fill h-2 rounded bg-iris" style={{ width: `${(view.totalXp / TOTAL_XP) * 100}%` }} />
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-slate">Player</dt>
            <dd className="mt-1 break-all text-base font-semibold text-ink">
              {address ? shortAddress(address) : "No wallet connected"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate">Devnet SOL</dt>
            <dd className="mt-1 text-base font-semibold text-ink" aria-live="polite">
              {balance.status === "ready"
                ? formatSol(balance.lamports)
                : balance.status === "loading"
                  ? "Reading"
                  : balance.status === "error"
                    ? "Unavailable"
                    : "Connect a wallet"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate">Quests cleared</dt>
            <dd className="mt-1 text-base font-semibold text-ink">
              {questsCleared} of {QUESTS.length}
            </dd>
          </div>
        </dl>
        {address ? (
          <div className="mt-5 flex flex-wrap gap-4">
            <button type="button" className={textActionClass} onClick={() => void refreshBalance()}>
              Refresh balance
            </button>
            <button
              type="button"
              className={textActionClass}
              disabled={disconnect.isRunning}
              onClick={() => void disconnect.dispatch()}
            >
              {disconnect.isRunning ? "Disconnecting" : "Disconnect"}
            </button>
          </div>
        ) : null}
        {balance.status === "error" ? <p className="mt-3 text-sm leading-5 text-ink">{balance.message}</p> : null}
        {storageWarning ? (
          <p className="mt-3 text-sm leading-5 text-ink">
            This browser could not save your progress. It may disappear when you leave.
          </p>
        ) : null}
        {!supportsDevnet && address ? (
          <p className="mt-3 text-sm leading-5 text-ink">
            This wallet is not on Devnet. Switch to Devnet before sending a practice transaction.
          </p>
        ) : null}
        <p className="mt-4 text-sm leading-5 text-slate">Set Phantom to Devnet before you approve a transaction.</p>
        {departure && !address ? (
          <p className="mt-3 text-sm leading-5 text-ink">
            Saved score before you left: {departure.xp} XP. Connect {shortAddress(departure.address)} again.
          </p>
        ) : null}
      </section>

      {open ? (
        <QuestView
          questId={open.id}
          view={view}
          frontier={frontier}
          cleared={cleared}
          stageToWork={stageToWork}
          address={address}
          addressShown={addressShown}
          shortShown={shortShown}
          balance={balance}
          notice={notice}
          returnNote={returnNote}
          departure={departure}
          onBack={() => setOpenQuest(null)}
          onOpenQuest={setOpenQuest}
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Quests">
          {QUESTS.map((quest) => {
            const questState = questStatus(view, quest.id);
            const current = !cleared && questForStage(frontier).id === quest.id;
            return (
              <li key={quest.id}>
                <button
                  type="button"
                  onClick={() => setOpenQuest(quest.id)}
                  className={`flex h-full min-h-44 w-full flex-col rounded-2xl border bg-paper p-5 text-left hover:bg-lilac active:bg-canvas ${
                    current ? "border-iris" : questState === "completed" ? "border-ink" : "border-mist"
                  }`}
                >
                  <span className="text-sm font-semibold text-iris">{STATUS_LABEL[questState]}</span>
                  <span className="mt-3 text-xl font-semibold text-ink">{quest.title}</span>
                  <span className="mt-2 text-sm leading-5 text-slate">{quest.summary}</span>
                  <span className="mt-auto pt-4 text-sm font-semibold text-ink">
                    {questXpEarned(view, quest.id)} / {questReward(quest.id)} XP
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {stageToWork ? (
        <article className="stage-panel mt-8 rounded-2xl border border-iris bg-paper p-6">
          <StageWork
            stageId={stageToWork}
            view={view}
            address={address}
            status={mounted ? status : "pending"}
            wallets={orderedWallets}
            phantomMissing={phantomMissing}
            connecting={connect.isRunning || status === "connecting"}
            connectError={connectError}
            canSign={canSign}
            supportsDevnet={supportsDevnet}
            balance={balance}
            busy={busy}
            phase={phase}
            verification={verification}
            addressShown={addressShown}
            shortShown={shortShown}
            departure={departure}
            onConnect={onConnect}
            onShowAddress={onShowAddress}
            onReadBalance={() => void onReadBalance()}
            onNoteStart={() => void onNoteStart()}
            onAirdrop={() => void onAirdrop()}
            onFaucet={onFaucet}
            onArrive={() => void onArrive()}
            onShowNote={onShowNote}
            onSend={() => void onSend()}
            onCheck={() => void onCheck()}
            onReadFee={() => void onReadFee()}
            onReadTime={() => void onReadTime()}
            onNameProgram={() => void onNameProgram()}
            onReadSlot={() => void onReadSlot()}
            onProveDevnet={() => void onProveDevnet()}
            onReadBlockhash={() => void onReadBlockhash()}
            onShowShort={onShowShort}
            onLeave={() => void onLeave()}
            onStayDevnet={onStayDevnet}
          />
          {notice ? (
            <p className="mt-4 break-all text-sm leading-5 text-ink" aria-live="polite">
              {notice}
            </p>
          ) : null}
          {actionError ? <p className="mt-4 text-sm leading-5 text-ink">{actionError}</p> : null}
          {detail ? (
            <details className="mt-3">
              <summary className="min-h-11 text-sm font-semibold text-ink">Technical detail</summary>
              <p className="break-all text-sm leading-5 text-slate">{detail}</p>
            </details>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}

function QuestView({
  questId,
  view,
  frontier,
  cleared,
  stageToWork,
  address,
  addressShown,
  shortShown,
  balance,
  notice,
  returnNote,
  departure,
  onBack,
  onOpenQuest,
}: {
  questId: QuestId;
  view: UserProgress;
  frontier: StageId;
  cleared: boolean;
  stageToWork: StageId | null;
  address: string | null;
  addressShown: boolean;
  shortShown: boolean;
  balance: BalanceState;
  notice: string | null;
  returnNote: string | null;
  departure: Departure | null;
  onBack: () => void;
  onOpenQuest: (id: QuestId) => void;
}) {
  const quest = questById(questId);
  const index = QUESTS.findIndex((item) => item.id === questId);
  const previous = QUESTS[index - 1];
  const next = QUESTS[index + 1];
  const questState = questStatus(view, questId);

  return (
    <section className="mt-8" aria-label={quest.title}>
      <button type="button" className={textActionClass} onClick={onBack}>
        Back to quests
      </button>
      {returnNote ? <p className="mt-4 text-sm leading-5 text-ink">{returnNote}</p> : null}
      <ol className="mt-6 space-y-3" aria-label="Stages in this quest">
        {quest.stages.map((stage, stageIndex) => {
          const stageState = displayStatus(view, stage.id);
          const current = stage.id === frontier && !cleared;
          const proof = stageProof(stage.id, view, address, addressShown, shortShown, balance, notice);
          return (
            <li key={stage.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3">
              <span
                className={
                  current
                    ? "stage-beacon flex size-11 items-center justify-center rounded-lg bg-iris text-sm font-semibold text-canvas"
                    : stageState === "completed"
                      ? "flex size-11 items-center justify-center rounded-lg border border-ink text-sm font-semibold text-ink"
                      : "flex size-11 items-center justify-center rounded-lg border border-mist text-sm font-semibold text-slate"
                }
              >
                {stageIndex + 1}
              </span>
              <div className="min-w-0 pt-1">
                <p className={`text-base font-semibold ${stageState === "locked" ? "text-slate" : "text-ink"}`}>{stage.title}</p>
                <p className="text-sm text-slate">
                  {STATUS_LABEL[stageState]}, {stage.xp} XP
                </p>
                {proof ? <p className="mt-1 break-all text-sm leading-5 text-ink">{proof}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      {questState === "locked" && previous ? (
        <div className="mt-6">
          <p className="text-sm leading-5 text-ink">
            This quest is locked until {previous.title} is cleared. The stages stay here.
          </p>
          <button type="button" className={`${pillClass} mt-4`} onClick={() => onOpenQuest(previous.id)}>
            Open {previous.title}
          </button>
        </div>
      ) : null}
      {questState === "completed" && next ? (
        <button type="button" className={`${textActionClass} mt-6`} onClick={() => onOpenQuest(next.id)}>
          Open {next.title}
        </button>
      ) : null}
      {questState === "completed" && !next ? (
        <p className="mt-6 text-base leading-6 text-ink">Every quest is cleared. {TOTAL_XP} XP is saved for this wallet in this browser.</p>
      ) : null}
      {!stageToWork && questState !== "locked" && questState !== "completed" ? (
        <p className="mt-6 text-sm leading-5 text-ink">
          The stage you can work on is in {questForStage(frontier).title}.
        </p>
      ) : null}
      {departure && !address ? (
        <p className="mt-4 text-sm leading-5 text-ink">
          Saved score before you left: {departure.xp} XP. Connect {shortAddress(departure.address)} again.
        </p>
      ) : null}
    </section>
  );
}

function stageProof(
  stageId: StageId,
  view: UserProgress,
  address: string | null,
  addressShown: boolean,
  shortShown: boolean,
  balance: BalanceState,
  notice: string | null,
): string | null {
  const state = displayStatus(view, stageId);
  if (stageId === "see-address" && (state === "completed" || addressShown) && address) return address;
  if (stageId === "short-form" && (state === "completed" || shortShown) && address) {
    return `${shortAddress(address)} beside ${address}`;
  }
  if (stageId === "note-start") {
    const start = stageProgress(view, "note-start").balanceLamportsAtStart;
    if (start) return `Start: ${start} lamports.`;
  }
  if (stageId === "read-balance" && state === "completed" && balance.status === "ready") {
    return `${formatSol(balance.lamports)} SOL, ${balance.lamports.toString()} lamports.`;
  }
  if (stageId === "prepare-note" && (state === "completed" || state === "available" || state === "in_progress")) {
    const memoId = stageProgress(view, "prepare-note").memoId;
    if (memoId && (state === "completed" || notice)) return practiceMemo(memoId);
  }
  if ((stageId === "send-memo" || stageId === "check-memo") && stageProgress(view, "send-memo").transactionSignature) {
    return stageProgress(view, "send-memo").transactionSignature ?? null;
  }
  return null;
}

function StageWork(props: {
  stageId: StageId;
  view: UserProgress;
  address: string | null;
  status: string;
  wallets: readonly UiWallet[];
  phantomMissing: boolean;
  connecting: boolean;
  connectError: string | null;
  canSign: boolean;
  supportsDevnet: boolean;
  balance: BalanceState;
  busy: Busy;
  phase: TxPhase;
  verification: Verification | null;
  addressShown: boolean;
  shortShown: boolean;
  departure: Departure | null;
  onConnect: (wallet: UiWallet) => Promise<void>;
  onShowAddress: () => void;
  onReadBalance: () => void;
  onNoteStart: () => void;
  onAirdrop: () => void;
  onFaucet: () => void;
  onArrive: () => void;
  onShowNote: () => void;
  onSend: () => void;
  onCheck: () => void;
  onReadFee: () => void;
  onReadTime: () => void;
  onNameProgram: () => void;
  onReadSlot: () => void;
  onProveDevnet: () => void;
  onReadBlockhash: () => void;
  onShowShort: () => void;
  onLeave: () => void;
  onStayDevnet: () => void;
}) {
  const stage = stageById(props.stageId);
  const quest = questForStage(props.stageId);
  const place = quest.stages.findIndex((item) => item.id === props.stageId) + 1;
  const memoId = stageProgress(props.view, "prepare-note").memoId;
  const memoText = memoId ? practiceMemo(memoId) : null;
  const signature = stageProgress(props.view, "send-memo").transactionSignature;
  const stageState = displayStatus(props.view, props.stageId);

  return (
    <>
      <p className="text-sm font-semibold text-ink">
        Stage {place} of {quest.stages.length}, {STATUS_LABEL[stageState]}, reward {stage.xp} XP
      </p>
      <h2 className="mt-1 text-2xl font-semibold leading-8 text-ink">{stage.title}</h2>
      <p className="mt-3 text-base leading-6 text-ink">{stage.detail}</p>
      <div className="mt-6">{stageControl(props, memoText, signature)}</div>
      {props.verification && (props.stageId === "send-memo" || props.stageId === "check-memo") ? (
        <CheckList verification={props.verification} />
      ) : null}
    </>
  );
}

function stageControl(
  props: Parameters<typeof StageWork>[0],
  memoText: string | null,
  signature: string | undefined,
): ReactNode {
  const { stageId, address, balance } = props;
  const worksWithoutWallet = stageId === "read-slot" || stageId === "prove-devnet" || stageId === "read-blockhash";
  if (!address && !worksWithoutWallet && stageId !== "connect" && stageId !== "leave-return") {
    return <WalletPicker {...props} />;
  }
  if (stageId === "connect") {
    return address ? (
      <p className="break-all text-sm leading-5 text-ink">Connected public key: {address}</p>
    ) : (
      <WalletPicker {...props} />
    );
  }
  if (stageId === "see-address") {
    return (
      <div>
        {props.addressShown && address ? <p className="break-all text-sm leading-5 text-ink">{address}</p> : null}
        <button type="button" className={`${pillClass} mt-4`} onClick={props.onShowAddress} disabled={!address}>
          Show the full address
        </button>
      </div>
    );
  }
  if (stageId === "read-balance") {
    return (
      <button type="button" className={pillClass} disabled={!address || props.busy === "balance"} onClick={props.onReadBalance}>
        {props.busy === "balance" ? "Reading balance" : "Read my balance"}
      </button>
    );
  }
  if (stageId === "note-start") {
    const start = stageProgress(props.view, "note-start").balanceLamportsAtStart;
    return (
      <div>
        {start ? <p className="text-sm leading-5 text-ink">Noted start: {start} lamports.</p> : null}
        <button type="button" className={`${pillClass} mt-4`} disabled={!address || props.busy === "note"} onClick={props.onNoteStart}>
          {props.busy === "note" ? "Reading the start" : "Note my starting balance"}
        </button>
      </div>
    );
  }
  if (stageId === "get-sol" && address) {
    return (
      <div>
        <p className="text-sm text-slate">Your Devnet address</p>
        <p className="mt-1 break-all text-sm leading-5 text-ink">{address}</p>
        <div className="mt-4 flex flex-col items-start gap-3">
          <button type="button" className={pillClass} disabled={props.busy === "airdrop"} onClick={props.onAirdrop}>
            {props.busy === "airdrop" ? "Asking Devnet for SOL" : "Request an airdrop"}
          </button>
          <a
            href="https://faucet.solana.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={textActionClass}
            onClick={props.onFaucet}
          >
            Open the public faucet
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    );
  }
  if (stageId === "see-arrive") {
    return (
      <button type="button" className={pillClass} disabled={!address || props.busy === "arrive"} onClick={props.onArrive}>
        {props.busy === "arrive" ? "Checking Devnet" : "Check that it arrived"}
      </button>
    );
  }
  if (stageId === "prepare-note" && memoText) {
    return (
      <div>
        <p className="text-sm text-slate">Note you will sign</p>
        <p className="mt-2 break-all rounded-lg border border-mist bg-canvas p-4 text-sm leading-5 text-ink">{memoText}</p>
        <button type="button" className={`${pillClass} mt-4`} onClick={props.onShowNote}>
          Use this note
        </button>
      </div>
    );
  }
  if (stageId === "send-memo" && memoText) {
    return (
      <div>
        <p className="text-sm text-slate">Note that will be written on Devnet</p>
        <p className="mt-2 break-all rounded-lg border border-mist bg-canvas p-4 text-sm leading-5 text-ink">{memoText}</p>
        <p className="mt-3 text-sm leading-5 text-ink">
          Sending this spends a small Devnet SOL fee. SolTrail will not send it until you approve it in the wallet.
        </p>
        {balance.status === "ready" && balance.lamports === 0n ? (
          <p className="mt-3 text-sm leading-5 text-ink">The balance is 0 SOL, so the fee cannot be paid yet.</p>
        ) : null}
        {!props.supportsDevnet || !props.canSign ? (
          <p className="mt-3 text-sm leading-5 text-ink">
            {props.supportsDevnet
              ? "This wallet cannot sign the Devnet transaction SolTrail builds."
              : "Switch Phantom to Devnet before sending."}
          </p>
        ) : null}
        <button
          type="button"
          className={`${pillClass} mt-4`}
          disabled={
            props.busy === "send" ||
            !props.canSign ||
            !props.supportsDevnet ||
            (balance.status === "ready" && balance.lamports === 0n)
          }
          onClick={props.onSend}
        >
          {props.busy === "send" && props.phase !== "idle" ? PHASE_LABEL[props.phase] : "Send this message"}
        </button>
        {props.phase !== "idle" ? (
          <p className="mt-3 text-sm font-semibold text-ink" aria-live="polite">
            Status: {PHASE_LABEL[props.phase]}
          </p>
        ) : null}
        {signature ? <SignatureLinks signature={signature} /> : null}
      </div>
    );
  }
  if (stageId === "check-memo") {
    return signature ? (
      <div>
        <p className="break-all text-sm leading-5 text-ink">Signature: {signature}</p>
        <button type="button" className={`${pillClass} mt-4`} disabled={props.busy === "check"} onClick={props.onCheck}>
          {props.busy === "check" ? "Confirming" : "Check this transaction"}
        </button>
        <SignatureLinks signature={signature} />
      </div>
    ) : (
      <p className="text-sm leading-5 text-ink">Send the note first. This stage checks that same transaction.</p>
    );
  }
  if (stageId === "read-fee") {
    return signature ? (
      <button type="button" className={pillClass} disabled={props.busy === "fee"} onClick={props.onReadFee}>
        {props.busy === "fee" ? "Reading the fee" : "Read the fee"}
      </button>
    ) : (
      <p className="text-sm leading-5 text-ink">Send the note first. This stage reads the fee on that transaction.</p>
    );
  }
  if (stageId === "read-time") {
    return signature ? (
      <button type="button" className={pillClass} disabled={props.busy === "time"} onClick={props.onReadTime}>
        {props.busy === "time" ? "Reading the time" : "Read the time"}
      </button>
    ) : (
      <p className="text-sm leading-5 text-ink">Send the note first. This stage reads blockTime on that transaction.</p>
    );
  }
  if (stageId === "name-program") {
    return signature ? (
      <button type="button" className={pillClass} disabled={props.busy === "program"} onClick={props.onNameProgram}>
        {props.busy === "program" ? "Reading the program" : "Name the program"}
      </button>
    ) : (
      <p className="text-sm leading-5 text-ink">Send the note first. This stage reads the program on that transaction.</p>
    );
  }
  if (stageId === "read-slot") {
    return (
      <button type="button" className={pillClass} disabled={props.busy === "slot"} onClick={props.onReadSlot}>
        {props.busy === "slot" ? "Reading the slot" : "Read the current slot"}
      </button>
    );
  }
  if (stageId === "prove-devnet") {
    return (
      <button type="button" className={pillClass} disabled={props.busy === "genesis"} onClick={props.onProveDevnet}>
        {props.busy === "genesis" ? "Checking the cluster" : "Compare the genesis hash"}
      </button>
    );
  }
  if (stageId === "read-blockhash") {
    return (
      <div>
        <p className="text-sm leading-5 text-ink">A blockhash expires. It is not a transaction by itself.</p>
        <button type="button" className={`${pillClass} mt-4`} disabled={props.busy === "blockhash"} onClick={props.onReadBlockhash}>
          {props.busy === "blockhash" ? "Reading the blockhash" : "Read the latest blockhash"}
        </button>
      </div>
    );
  }
  if (stageId === "short-form") {
    return (
      <div>
        {props.shortShown && address ? (
          <p className="break-all text-sm leading-5 text-ink">
            {shortAddress(address)} beside {address}
          </p>
        ) : null}
        <button type="button" className={`${pillClass} mt-4`} disabled={!address} onClick={props.onShowShort}>
          Show the short form
        </button>
      </div>
    );
  }
  if (stageId === "leave-return") {
    if (!address) return <WalletPicker {...props} />;
    return (
      <button type="button" className={pillClass} disabled={props.departure !== null} onClick={props.onLeave}>
        Disconnect this wallet
      </button>
    );
  }
  if (stageId === "stay-devnet") {
    return (
      <div>
        <p className="text-sm leading-5 text-ink">This stage uses Solana Devnet.</p>
        <button type="button" className={`${pillClass} mt-4`} onClick={props.onStayDevnet}>
          Check Solana Devnet
        </button>
      </div>
    );
  }
  return null;
}

function WalletPicker(props: Parameters<typeof StageWork>[0]) {
  if (props.status === "pending" || props.status === "reconnecting") {
    return (
      <p className="text-sm leading-5 text-ink" aria-live="polite">
        Looking for a wallet on this browser.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3">
      {props.wallets.map((wallet) => (
        <button
          key={wallet.name}
          type="button"
          className={isPhantom(wallet) ? pillClass : outlineClass}
          disabled={props.connecting}
          onClick={() => void props.onConnect(wallet)}
        >
          {props.connecting ? "Waiting for Wallet" : `Connect ${wallet.name}`}
        </button>
      ))}
      {props.phantomMissing ? (
        <a href="https://phantom.com/" target="_blank" rel="noopener noreferrer" className={props.wallets.length ? textActionClass : pillClass}>
          Install Phantom
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
      {props.wallets.length === 0 ? <p className="text-sm leading-5 text-slate">Phantom is not installed in this browser.</p> : null}
      {props.connectError ? <p className="text-sm leading-5 text-ink">{props.connectError}</p> : null}
    </div>
  );
}

function CheckList({ verification }: { verification: Verification }) {
  return (
    <ul className="mt-4 space-y-3">
      {verification.checks.map((check) => (
        <li key={check.label}>
          <p className="text-sm font-semibold text-ink">
            {check.pass ? "Pass" : "Fail"}: {check.label}
          </p>
          <p className="text-sm leading-5 text-slate">{check.detail}</p>
        </li>
      ))}
    </ul>
  );
}

function SignatureLinks({ signature }: { signature: string }) {
  const explorer = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  return (
    <div className="mt-3 flex flex-col items-start gap-1">
      <a href={explorer} target="_blank" rel="noopener noreferrer" className={textActionClass}>
        View on Solana Explorer
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <Link href={`/proof/${encodeURIComponent(signature)}`} className={textActionClass}>
        Open the proof page
      </Link>
    </div>
  );
}
