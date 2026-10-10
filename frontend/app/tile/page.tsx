import TileGame from "@/components/TileGame";
import GameAuthGate from "@/components/GameAuthGate";

export default function TilePage() {
  return <GameAuthGate><TileGame /></GameAuthGate>;
}
