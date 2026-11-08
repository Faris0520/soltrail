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
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { explainSolanaError } from "@/lib/errors";
import { shortAddress } from "@/lib/format";
import { client } from "@/lib/solana";

const linkClass = "inline-flex min-h-11 items-center text-base text-ink hover:text-iris";

function isPhantom(wallet: { name: string }): boolean {
  return wallet.name.toLowerCase().includes("phantom");
}

export function SiteHeader() {
  const pathname = usePathname();
  const onTrail = pathname === "/learn";
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const status = useWalletStatus(client);
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);
  const address = connected?.account.address ? String(connected.account.address) : null;
  const ordered = [...wallets].sort((a, b) => Number(isPhantom(b)) - Number(isPhantom(a)));
  const looking = status === "pending" || status === "reconnecting";

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onConnect(wallet: UiWallet) {
    try {
      await connect.dispatchAsync(wallet);
      setOpen(false);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-mist bg-canvas">
      <nav
        aria-label="SolTrail"
        className="mx-auto grid w-full max-w-[1200px] grid-cols-[1fr_auto] items-center gap-3 px-4 py-2 sm:grid-cols-[1fr_auto_1fr] sm:px-6"
      >
        <Link href="/" className={`${linkClass} gap-2 text-lg font-semibold`}>
          <span aria-hidden="true" className="flex w-4 flex-col gap-1">
            <span className="h-0.5 w-4 rounded bg-iris" />
            <span className="h-0.5 w-3 rounded bg-iris" />
            <span className="h-0.5 w-2 rounded bg-iris" />
          </span>
          SolTrail
        </Link>
        <Link
          href="/learn"
          aria-current={onTrail ? "page" : undefined}
          className={`hidden min-h-11 items-center rounded-full border px-4 sm:inline-flex ${onTrail ? "border-iris text-iris" : "border-mist text-ink hover:border-iris hover:text-iris"}`}
        >
          Stages
        </Link>
        <div className="flex items-center justify-end gap-2">
          <Link href="/learn" className={`${linkClass} sm:hidden`}>
            Stages
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border border-iris px-4 text-sm font-semibold text-iris hover:bg-iris hover:text-canvas"
            onClick={() => setOpen(true)}
          >
            {address ? shortAddress(address) : "Connect wallet"}
          </button>
        </div>
      </nav>
      {open ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-mist bg-paper p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-base font-semibold text-ink">
                Connect wallet
              </h2>
              <button ref={closeRef} type="button" className="min-h-11 px-3 text-sm font-semibold text-iris" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {looking ? <p className="text-sm text-slate">Looking for a wallet on this browser.</p> : null}
              {ordered.map((wallet) => (
                <button
                  key={wallet.name}
                  type="button"
                  className="inline-flex min-h-11 items-center justify-between rounded-xl border border-mist px-4 text-sm font-semibold text-ink hover:border-iris"
                  disabled={connect.isRunning}
                  onClick={() => void onConnect(wallet)}
                >
                  {connect.isRunning ? "Waiting for wallet" : `Connect ${wallet.name}`}
                </button>
              ))}
              {!looking && ordered.length === 0 ? (
                <a href="https://phantom.com/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-iris hover:underline">
                  Install Phantom
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
              {connect.error ? <p className="text-sm text-ink">{explainSolanaError(connect.error)}</p> : null}
              {address ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-iris hover:underline"
                  disabled={disconnect.isRunning}
                  onClick={() => void disconnect.dispatch()}
                >
                  {disconnect.isRunning ? "Disconnecting" : "Disconnect"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
