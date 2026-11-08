export function explainSolanaError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("reject") ||
    lower.includes("declined") ||
    lower.includes("cancel") ||
    lower.includes("denied") ||
    (error instanceof Error && error.name === "AbortError")
  ) {
    return "The wallet closed the request. This mission stays unfinished.";
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("airdrop limit")) {
    return "Devnet is limiting faucet requests right now. Use the public faucet, then refresh the balance.";
  }
  if (lower.includes("insufficient") || lower.includes("debit")) {
    return "This wallet does not have enough Devnet SOL for the fee.";
  }
  if (lower.includes("blockhash") || lower.includes("expired")) {
    return "The transaction expired before Devnet confirmed it. Send it again.";
  }
  if (lower.includes("mainnet") || lower.includes("wrong network") || lower.includes("cluster")) {
    return "Switch Phantom to Devnet, then try again. This app only sends practice transactions.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("timeout")) {
    return "Devnet did not answer. Check the connection and try again.";
  }
  return "Devnet did not accept that request. You can try again.";
}

export function technicalDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
