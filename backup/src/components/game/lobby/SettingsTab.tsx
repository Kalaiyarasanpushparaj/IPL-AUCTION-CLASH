'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { GameState } from "@/lib/types";
import { Button } from '@/components/ui/button';

type SettingsTabProps = {
    isOwner: boolean;
    gameState: GameState;
    onTimerChange: (duration: number) => void;
}

export default function SettingsTab({ isOwner, gameState, onTimerChange }: SettingsTabProps) {
    const currentTimerDuration = gameState.auctionTimerDuration;
    const [newTimerDuration, setNewTimerDuration] = useState(currentTimerDuration);

    useEffect(() => {
        setNewTimerDuration(currentTimerDuration);
    }, [currentTimerDuration]);

    const handleConfirm = () => {
        if (newTimerDuration) {
            onTimerChange(newTimerDuration);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Room Settings</CardTitle>
                <CardDescription>Only the host can change these settings before the auction starts.</CardDescription>
            </CardHeader>
            <CardContent className="h-72 space-y-6 pt-2">
                 <div className="space-y-3">
                    <Label htmlFor="bid-timer-lobby" className="flex justify-between">
                        <span>Default Bid Timer</span>
                        <span className="text-muted-foreground font-mono">{newTimerDuration ?? 10}s</span>
                    </Label>
                    <Slider
                        id="bid-timer-lobby"
                        min={5}
                        max={30}
                        step={1}
                        value={[newTimerDuration ?? 10]}
                        onValueChange={(value) => setNewTimerDuration(value[0])}
                        disabled={!isOwner}
                    />
                     {isOwner && (
                        <Button onClick={handleConfirm} disabled={!newTimerDuration || newTimerDuration === currentTimerDuration}>
                            Confirm
                        </Button>
                     )}
                     {!isOwner && <p className="text-xs text-muted-foreground">Only the host can adjust the bid timer.</p>}
                </div>
            </CardContent>
        </Card>
    );
}
