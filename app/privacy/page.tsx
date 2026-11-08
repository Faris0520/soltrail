import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "SolTrail stores your wallet public address and progress in this browser, and it reads the public Devnet RPC. There is no account, no analytics, and no server of ours.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-[40rem] break-words px-4 py-14 sm:px-6 sm:py-16">
      <h1 className="text-[2rem] font-semibold leading-[1.15] text-ink sm:text-4xl">Privacy</h1>
      <p className="mt-4 text-base leading-6 text-slate">
        SolTrail stores your wallet public address and your progress in localStorage on this browser. It reads the
        public Solana Devnet RPC. There is no account, no analytics, and no server of ours.
      </p>

      <h2 className="mt-10 text-2xl font-semibold leading-8 text-ink">What this browser stores</h2>
      <p className="mt-4 text-base leading-6 text-slate">
        When a wallet connects, the app saves one record under the key{" "}
        <code className="font-sans font-semibold text-ink">soltrail.progress.v2.</code> followed by that public address.
        The record holds the address, the network name Devnet, which stages are cleared, the XP saved for them, and the
        time it was last saved. It can also hold a transaction signature, a memo id, a starting balance, and an airdrop
        signature when a stage stored one. Clearing site data for this origin removes the record.
      </p>

      <h2 className="mt-10 text-2xl font-semibold leading-8 text-ink">What the app reads</h2>
      <p className="mt-4 text-base leading-6 text-slate">
        From your browser, SolTrail calls the public Devnet RPC. The default endpoint is{" "}
        <code className="font-sans font-semibold text-ink">https://api.devnet.solana.com</code>. A build can set{" "}
        <code className="font-sans font-semibold text-ink">NEXT_PUBLIC_SOLANA_RPC_URL</code> to use another URL. Those calls read
        balances, transactions, the latest blockhash, the current slot, and the genesis hash. A stage can request a
        Devnet airdrop to the connected address. When a stage needs a transaction, you approve the signature in the
        wallet, and the app submits that signed transaction to the same RPC. That RPC is a public Solana service.
        There is no server of ours.
      </p>

      <h2 className="mt-10 text-2xl font-semibold leading-8 text-ink">Private key</h2>
      <p className="mt-4 text-base leading-6 text-slate">
        SolTrail never asks for a private key or a recovery phrase. Phantom signs through the wallet. A signature
        opens in the wallet. The app receives the public address and the signature you approve.
      </p>
    </article>
  );
}
