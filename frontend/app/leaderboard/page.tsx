import Leaderboard from "@/components/Leaderboard";

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ game?: string }> }) {
  const { game } = await searchParams;
  return <Leaderboard initialGame={game === "Number" ? "Number" : "Tile"} />;
}
