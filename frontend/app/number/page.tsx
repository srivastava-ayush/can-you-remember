import NumberGame from "@/components/NumberGame";
import GameAuthGate from "@/components/GameAuthGate";

export default function NumberPage() {
  return <GameAuthGate><NumberGame /></GameAuthGate>;
}
