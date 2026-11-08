import Image from "next/image";
import Link from "next/link";
import { HeroGrain } from "@/components/hero-grain";
import { QUESTS } from "@/lib/quests";

const pressClass =
  "transition-[scale] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] motion-safe:not-disabled:active:scale-[0.96]";

const pillClass = `inline-flex min-h-11 items-center justify-center rounded-full border border-iris px-6 text-base font-semibold text-iris hover:bg-iris hover:text-canvas active:bg-deep active:text-canvas ${pressClass}`;

const cardClass = `flex h-full min-h-44 min-w-0 flex-col rounded-2xl border border-mist bg-paper p-5 text-ink hover:border-iris active:border-iris active:bg-canvas ${pressClass}`;

const devnetActions = [
  "Read the public address and the Devnet balance.",
  "Note a starting balance and request practice SOL from the in-app airdrop or the public faucet.",
  "Prepare a note, send it with the Memo program, and check the signature.",
  "Read the fee, the block time, and the program on that same transaction.",
  "Read the current slot, compare the genesis hash with Devnet, and read a blockhash.",
];

const requirements = [
  "You use a browser wallet (Phantom).",
  "You set Phantom to Solana Devnet.",
  "You allow this browser to keep the progress record.",
];

function countPhrase(count: number, singular: string, plural: string): string {
  const word = new Intl.PluralRules("en").select(count) === "one" ? singular : plural;
  return `${new Intl.NumberFormat("en").format(count)} ${word}`;
}

export default function HomePage() {
  return (
    <>
      <section className="hero-ground relative overflow-clip">
        <div className="hero-blobs" aria-hidden="true">
          <div className="hero-blob hero-blob-a" />
          <div className="hero-blob hero-blob-b" />
          <div className="hero-blob hero-blob-c" />
          <div className="hero-blob hero-blob-d" />
        </div>
        <HeroGrain />
        <div className="hero-copy relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,22rem)] lg:gap-12 lg:py-24">
          <div>
            <h1 className="max-w-xl text-[2.5rem] font-semibold leading-[1.1] text-ink sm:text-5xl">
              Learn Solana by doing
            </h1>
            <p className="mt-4 max-w-md text-base leading-6 text-slate">
              SolTrail is for someone new to Solana who wants to do the steps. A quest is a set of stages. You clear
              them in order, on Devnet.
            </p>
            <div className="mt-8">
              <Link href="/learn" className={pillClass}>
                Open the quests
              </Link>
            </div>
          </div>
          <div className="min-w-0">
            {/* Cropped from https://github.com/solana-foundation/solana-com/blob/main/apps/web/assets/learn/learn-hero.webp (GPL-3.0). */}
            <Image
              src="/solana-learn-hero.png"
              alt="A stack of translucent discs, a three-dimensional illustration"
              width={960}
              height={1201}
              priority
              sizes="(min-width: 1024px) 22rem, min(24rem, 100vw)"
              className="mx-auto h-auto w-full max-w-sm lg:max-w-none"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
          <h2 className="max-w-xs text-2xl font-semibold leading-8 text-ink">How it works</h2>
          <ol className="max-w-2xl list-decimal pl-5 marker:font-semibold marker:text-iris">
            <li className="border-b border-mist py-5 pl-2">
              <h3 className="text-lg font-semibold leading-7 text-ink">You connect a wallet on Devnet</h3>
              <p className="mt-2 text-base leading-6 text-slate">
                Phantom signs through the wallet. SolTrail reads the public address.
              </p>
            </li>
            <li className="border-b border-mist py-5 pl-2">
              <h3 className="text-lg font-semibold leading-7 text-ink">You clear stages in order</h3>
              <p className="mt-2 text-base leading-6 text-slate">
                A stage stays locked until you clear the one before it. The next quest stays locked until you clear
                the quest before it.
              </p>
            </li>
            <li className="py-5 pl-2">
              <h3 className="text-lg font-semibold leading-7 text-ink">You keep progress in this browser</h3>
              <p className="mt-2 text-base leading-6 text-slate">
                Progress is stored in localStorage, keyed by the wallet address. There is no account.
              </p>
            </li>
          </ol>
        </div>
      </section>
      <section aria-labelledby="the-quests" className="border-t border-mist">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 id="the-quests" className="text-2xl font-semibold leading-8 text-ink">
              The quests
            </h2>
            <p className="mt-3 text-base leading-6 text-slate">You clear them in order. A card opens the stages.</p>
          </div>
          <ol className="mt-8 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {QUESTS.map((quest) => (
              <li key={quest.id} className="min-w-0">
                <Link href="/learn" className={cardClass}>
                  <h3 className="text-lg font-semibold leading-7">{quest.title}</h3>
                  <p className="mt-2 text-base leading-6 text-slate">{quest.summary}</p>
                  <p className="mt-auto pt-5 text-sm font-semibold leading-5">
                    {countPhrase(quest.stages.length, "stage", "stages")}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section aria-labelledby="devnet-actions" className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="devnet-actions" className="max-w-sm text-2xl font-semibold leading-8 text-ink">
            What you will actually do
          </h2>
          <p className="max-w-md text-base leading-6 text-slate">
            You do these on Devnet. A signature opens in the wallet.
          </p>
        </div>
        <ol className="mt-8 border-t border-mist">
          {devnetActions.map((action, index) => (
            <li
              key={action}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-mist py-5"
            >
              <span className="font-semibold text-iris" aria-hidden="true">
                {index + 1}
              </span>
              <p className="max-w-3xl text-base leading-6 text-ink">{action}</p>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="before-you-start" className="mx-auto w-full max-w-[1200px] px-4 pb-12 sm:px-6 lg:pb-16">
        <h2 id="before-you-start" className="text-2xl font-semibold leading-8 text-ink">
          Before you start
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-6 text-slate">
          You do not need mainnet SOL. Practice SOL is not mainnet SOL. SolTrail does not create an account.
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {requirements.map((requirement) => (
            <li key={requirement} className="min-w-0 border-t border-iris pt-3 text-base leading-6 text-ink">
              {requirement}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="private-key" className="border-t border-mist">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,24rem)] lg:py-16">
          <div className="w-full rounded-2xl border border-iris bg-paper p-6 sm:p-8">
            <h2 id="private-key" className="text-2xl font-semibold leading-8 text-ink">
              SolTrail never asks for a private key
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-6 text-slate">
              SolTrail never asks for a private key or a recovery phrase. A signature opens in the wallet.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4">
            <p className="max-w-sm text-base leading-6 text-slate">Set Phantom to Devnet, then open the stages.</p>
            <Link href="/learn" className={pillClass}>
              Open the quests
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
