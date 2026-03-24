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
                <div className="inline-flex items-center gap-2 mt-2 text-lg bg-card p-2 px-4 rounded-lg border shadow-sm">
                    <span className="text-muted-foreground">Room Code:</span>
                    <span className="font-mono text-primary font-bold">{roomCode}</span>
                    <CopyButton textToCopy={roomCode} />
                </div>
            )}
      </header>
    )
}
