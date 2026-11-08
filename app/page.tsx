import Image from "next/image";
import Link from "next/link";
import { HeroGrain } from "@/components/hero-grain";

const pillClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-iris px-6 text-base font-semibold text-iris hover:bg-iris hover:text-canvas active:bg-deep active:text-canvas";

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
      <section className="border-t border-mist">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-xl rounded-2xl border border-iris bg-paper p-6">
            <h2 className="text-2xl font-semibold leading-8 text-ink">SolTrail never asks for a private key</h2>
            <p className="mt-4 text-base leading-6 text-slate">
              SolTrail never asks for a private key or a recovery phrase. A signature opens in the wallet.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
