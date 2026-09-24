export type GameName = "Tile" | "Number";

export type LeaderboardEntry = {
  id: number;
  name: string;
  game: GameName;
  score: number;
  level: number;
  date: string;
};

// Demo data — will be replaced by a real backend later.
export const demoLeaderboard: LeaderboardEntry[] = [
  { id: 1, name: "Neo", game: "Tile", score: 2480, level: 18, date: "2026-09-23" },
  { id: 2, name: "Pixel", game: "Number", score: 2160, level: 15, date: "2026-09-22" },
  { id: 3, name: "Trinity", game: "Tile", score: 1940, level: 13, date: "2026-09-24" },
  { id: 4, name: "Ghost", game: "Number", score: 1580, level: 11, date: "2026-09-20" },
  { id: 5, name: "Morpheus", game: "Tile", score: 1420, level: 10, date: "2026-09-18" },
  { id: 6, name: "Cipher", game: "Number", score: 1210, level: 9, date: "2026-09-17" },
  { id: 7, name: "Echo", game: "Tile", score: 1080, level: 8, date: "2026-09-15" },
  { id: 8, name: "Dozer", game: "Number", score: 940, level: 7, date: "2026-09-14" },
  { id: 9, name: "Apex", game: "Tile", score: 760, level: 6, date: "2026-09-12" },
  { id: 10, name: "Rook", game: "Number", score: 560, level: 5, date: "2026-09-10" },
];