export type GameName = "Tile" | "Number";

export type LeaderboardEntry = {
  id: string;
  name: string;
  game: GameName;
  score: number;
  level: number;
  date: string;
};
