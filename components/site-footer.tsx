import Link from "next/link";

const external = [
  { href: "https://solana.com/docs", label: "Solana docs" },
  { href: "https://faucet.solana.com/", label: "Devnet faucet" },
  { href: "https://explorer.solana.com/?cluster=devnet", label: "Explorer" },
  { href: "https://phantom.com/", label: "Phantom" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-mist bg-canvas">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8 sm:px-6">
        <p className="text-sm leading-5 text-slate">SolTrail. Practice on Solana Devnet.</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link href="/privacy" className="inline-flex min-h-11 items-center text-sm text-iris hover:underline">
              Privacy
            </Link>
          </li>
          {external.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm text-iris hover:underline"
              >
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
