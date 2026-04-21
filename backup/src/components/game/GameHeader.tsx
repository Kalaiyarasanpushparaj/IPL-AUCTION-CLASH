'use client';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { GameState } from '@/lib/types';
import CopyButton from './CopyButton';

export default function GameHeader({ roomId }: { roomId: string }) {
    const firestore = useFirestore();
    const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'rooms', roomId) : null, [firestore, roomId]);
    const { data: gameState } = useDoc<GameState>(roomRef);

    const roomCode = gameState?.roomCode;

    return (
        <header className="text-center mb-8">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">IPL Auction Clash</h1>
{roomCode && (
                <div className="mt-6 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border-2 border-primary/20 shadow-2xl max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-primary mb-3 flex items-center justify-center gap-2">
                    📱 Room Code: <span className="font-mono text-3xl tracking-wider">{roomCode}</span>
                  </h3>
                  <div className="flex gap-2 justify-center">
                    <CopyButton textToCopy={roomCode} />
<CopyButton textToCopy={`${window.location.origin}/game/${roomId}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Share either to invite friends</p>
                </div>
            )}
      </header>
    )
}
