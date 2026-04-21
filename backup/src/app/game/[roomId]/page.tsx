import GameClient from "@/components/game/GameClient";
import { Suspense } from "react";

type GamePageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { roomId } = await params;

  return (
    <main className="min-h-screen container mx-auto py-8 px-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            Loading Game...
          </div>
        }
      >
        <GameClient roomId={roomId} />
      </Suspense>
    </main>
  );
}