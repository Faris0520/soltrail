export function formatSol(lamports: bigint): string {
  const negative = lamports < 0n;
  const absolute = negative ? -lamports : lamports;
  const whole = absolute / 1_000_000_000n;
  const fraction = (absolute % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  const text = fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`;
  return negative ? `-${text}` : text;
}

export function shortAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function shortBlockhash(value: string): string {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function formatBlockTime(blockTime: number | null): string | null {
  if (blockTime === null) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(blockTime * 1000));
}
