import type { Metadata } from "next";
import { ProofView } from "@/components/proof-view";

export const metadata: Metadata = {
  title: "Transaction proof",
  description: "Read a SolTrail practice transaction from Solana Devnet.",
};

export default async function ProofPage({ params }: { params: Promise<{ signature: string }> }) {
  const { signature } = await params;
  return <ProofView signature={decodeURIComponent(signature)} />;
}
