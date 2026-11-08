import type { Metadata } from "next";
import { LearnDesk } from "@/components/learn-desk";

export const metadata: Metadata = {
  title: "Quests",
  description: "Choose a quest and clear its stages on Solana Devnet.",
};

export default function LearnPage() {
  return <LearnDesk />;
}
