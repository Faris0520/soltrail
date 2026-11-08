"use client";

import { useEffect, useState } from "react";
import { fetchSnapshot } from "@/lib/chain";
import { formatBlockTime } from "@/lib/format";
import { verifyPublicMemo, type Verification } from "@/lib/verify";

type ProofState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "unavailable"; message: string }
  | { status: "ready"; verification: Verification };

export function ProofView({ signature }: { signature: string }) {
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState({ signature, attempt });
  const [state, setState] = useState<ProofState>({ status: "loading" });

  if (query.signature !== signature || query.attempt !== attempt) {
    setQuery({ signature, attempt });
    setState({ status: "loading" });
  }

  useEffect(() => {
    let cancel = false;
    fetchSnapshot(signature).then((result) => {
      if (cancel) return;
      if (result.kind === "invalid") {
        setState({ status: "invalid" });
        return;
      }
      if (result.kind === "unavailable") {
        setState({ status: "unavailable", message: result.message });
        return;
      }
      setState({ status: "ready", verification: verifyPublicMemo(result.snapshot) });
    });
    return () => {
      cancel = true;
    };
  }, [attempt, signature]);

  const explorer = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  const verification = state.status === "ready" ? state.verification : null;
  const valid = verification?.state === "passed";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-[2rem] font-semibold leading-[1.28] text-ink sm:text-[2.75rem] sm:leading-[1.25]">
        Transaction proof
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-6 text-ink" aria-live="polite">
        {state.status === "loading"
          ? "Reading this transaction from Devnet."
          : state.status === "invalid"
            ? "That text is not a Solana transaction signature."
            : state.status === "unavailable"
              ? state.message
              : valid
                ? "Devnet confirms this SolTrail practice message."
                : verification?.state === "not_found"
                  ? "Devnet does not have a transaction for this signature."
                  : "Devnet returned this signature, and it did not pass the SolTrail check."}
      </p>

      {state.status === "unavailable" ? (
        <button
          type="button"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-iris px-6 text-base font-semibold text-iris hover:bg-iris hover:text-canvas"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Try again
        </button>
      ) : null}

      <dl className="mt-8 max-w-3xl rounded-lg border border-mist bg-paper p-6">
        <div>
          <dt className="text-sm text-slate">Network</dt>
          <dd className="mt-1 text-base text-ink">Solana Devnet</dd>
        </div>
        <div className="mt-4">
          <dt className="text-sm text-slate">Signature</dt>
          <dd className="mt-1 break-all text-sm leading-5 text-ink">{signature}</dd>
        </div>
        <div className="mt-4">
          <dt className="text-sm text-slate">Signer</dt>
          <dd className="mt-1 break-all text-sm leading-5 text-ink">
            {verification?.signer ?? "Not available until Devnet returns the transaction."}
          </dd>
        </div>
        <div className="mt-4">
          <dt className="text-sm text-slate">Note</dt>
          <dd className="mt-1 break-all text-sm leading-5 text-ink">
            {verification?.memo ?? "Not available until Devnet returns a practice note."}
          </dd>
        </div>
        <div className="mt-4">
          <dt className="text-sm text-slate">Time</dt>
          <dd className="mt-1 text-sm text-ink">
            {verification ? formatBlockTime(verification.blockTime) ?? "Devnet did not include a time." : "Waiting for Devnet."}
          </dd>
        </div>
      </dl>

      {verification ? (
        <ul className="mt-6 max-w-3xl space-y-3">
          {verification.checks.map((check) => (
            <li key={check.label}>
              <p className="text-sm font-semibold text-ink">
                {check.pass ? "Pass" : "Fail"}: {check.label}
              </p>
              <p className="text-sm leading-5 text-slate">{check.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <a
        href={explorer}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-11 items-center text-base font-semibold text-iris hover:underline"
      >
        View on Solana Explorer
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}
