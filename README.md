# SolTrail

SolTrail is a web app for someone new to Solana. It is a sequence of stages on Solana Devnet. A stage stays locked until the one before it is cleared, and the next quest stays locked until the current quest is cleared. Clearing a stage means the app read a result from the connected wallet or from Devnet. The score for that work is kept in this browser, under the wallet's public address. There is no account and no server of ours.

The line on the home page is the whole product: learn Solana by doing the steps.

## What a new user runs into

A first Solana session is a pile of words: public key, lamports, signature, program, fee, slot, blockhash. Docs define them. SolTrail asks Devnet for each one, then shows the value the RPC returned.

The app does not cover DeFi, NFTs, or how to write a program. It stops at the first loop: connect a wallet, read it, get practice SOL, send one Memo, and read that transaction back.

## Quests

Six quests, eighteen stages, one order. XP below is what `lib/quests.ts` awards. Completing the same stage again does not add XP a second time. The stages add up to 1,600 XP.

| Quest | Stages | XP |
|---|---|---:|
| Wallet Basics | Connect. See your address. Read your balance with `getBalance`, shown in SOL and lamports. | 200 |
| Devnet SOL | Note the starting balance. Request a 1 SOL airdrop, or open the public faucet. See the balance rise, or see the airdrop signature confirmed. | 250 |
| First Message | Read the note, sign a Memo transaction, then check it. | 450 |
| The Receipt | Read `meta.fee`, `blockTime`, and the Memo program id on that same transaction. | 250 |
| The Clock | Read the current slot, compare `getGenesisHash` with the published Devnet genesis hash, and read the latest blockhash. | 250 |
| Your Key | Show the short address next to the full public key, disconnect and connect the same wallet, and confirm the RPC host is a Devnet endpoint. | 200 |

"Get practice SOL" can clear when the airdrop call returns a signature, or when the public faucet link is opened. The following stage, "See it arrive", clears only when the balance is higher than the noted start, or when that airdrop signature is confirmed on Devnet. If the public faucet is rate limited, the airdrop button can fail and the faucet link is the other way to get SOL.

## The Memo transaction

First Message builds one note:

```text
SOLTRAIL|QUEST=HELLO_SOLANA|ID=<id>
```

`<id>` is a UUID created in the browser. The note is on the page before the wallet opens. The wallet signs it. SolTrail submits a version 0 transaction because Phantom still signs version 0 for this flow. The instruction is the Memo program (`@solana-program/memo`).

After Devnet confirms it, the app loads the transaction with `getTransaction` (`jsonParsed`, `confirmed`) and checks four things:

- Devnet returned the signature.
- `meta.err` is null.
- The connected wallet is a signer.
- The Memo program id matches, and the note text matches exactly.

A saved signature is checked again when the quest page loads. If that check fails, or Devnet has no transaction for it, every stage from "Send it" onward opens again. localStorage is not treated as proof of the transaction.

`/proof/[signature]` reads the same transaction from Devnet and links to the Solana Explorer on the Devnet cluster. The page shows a pass only after that read succeeds.

## What this browser keeps

Progress is one localStorage record per public address: `soltrail.progress.v2.` plus the address. The record holds the address, the network name `devnet`, stage status, XP, the last save time, and, when a stage stored them, a transaction signature, a memo id, a starting balance, and an airdrop signature. Clearing site data for this origin deletes it. Switching wallets loads the record for the new address.

SolTrail never asks for a private key or a recovery phrase. Signing happens in the wallet. Any Wallet Standard wallet can connect. If Phantom is installed, it is listed first. If no wallet is installed, the app links to Phantom.

The browser calls the Devnet RPC directly. The default URL is `https://api.devnet.solana.com`. Set `NEXT_PUBLIC_SOLANA_RPC_URL` to use another endpoint. Those calls read balances, transactions, the latest blockhash, the current slot, and the genesis hash, and they can request an airdrop. There is no analytics script and no account system. The privacy page at `/privacy` states the same limits.

The Clock quest compares `getGenesisHash` with the published Devnet genesis hash `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. "Stay on Devnet" also checks that the RPC hostname contains `devnet`.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- `@solana/kit`, `@solana/kit-plugin-rpc`, `@solana/kit-plugin-wallet`
- `@solana-program/memo` for the Memo instruction
- Wallet Standard for connect and sign

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use a wallet on Solana Devnet. Phantom is the one the UI points to if nothing is installed.

Optional RPC override:

```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## A path through the app

1. Open the home page and go to the quests.
2. Connect a wallet that is set to Devnet.
3. Clear Wallet Basics: connect, show the full address, read the balance.
4. Note the starting balance, request an airdrop (1 SOL) or use https://faucet.solana.com/, then check that the SOL arrived.
5. Read the Memo note, approve it in the wallet, and run the check. Open the proof page or the Explorer link on that signature.
6. Read the fee, the block time, and the Memo program id from that transaction.
7. Read the slot, the genesis hash, and a blockhash.
8. Disconnect, connect the same wallet, and confirm the XP is still in this browser.

If an airdrop is rate limited, use the faucet, wait until the balance is higher than the noted start, and check again.

## What this build leaves out

- Mainnet. Every chain call is aimed at Devnet.
- A custom program. The only instruction SolTrail sends is Memo.
- Accounts, email login, a database, or a leaderboard.
- Private keys. They stay in the wallet.

## Where the behavior lives

| Path | What it does |
|---|---|
| `lib/quests.ts` | Quest order, stage copy, and XP |
| `lib/chain.ts` | Balance, airdrop, send Memo, and RPC reads |
| `lib/verify.ts` | The four checks on a practice transaction |
| `lib/parse-transaction.ts` | Turns a parsed transaction into those checks |
| `lib/progress.ts` | Order, XP, and localStorage |
| `lib/cluster-read.ts` | Fee, slot, blockhash helpers, and the Devnet genesis compare |
| `components/learn-desk.tsx` | The quest page |
| `app/proof/[signature]/page.tsx` | The public proof page |

## Check

```bash
npm test
npm run lint
```

`npm test` runs the Node tests in `lib/`: progress rules, transaction parsing, cluster reads, formatting, and a check that the home page links to `/learn`.
