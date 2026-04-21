'use client';
import type { Team, Squad, SoldPlayer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getRoleStyles } from '@/lib/utils';
import { Users, PlusCircle, MinusCircle, Shirt } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { TeamLogo } from '@/components/icons/TeamLogo';
import { useToast } from '@/hooks/use-toast';
import { MAX_PLAYERS_PER_TEAM } from '@/lib/data';

type PlayingXIEditorProps = {
  team: Team;
  squad: Squad;
  isOwner: boolean;
  onUpdatePlayingXI: (newXI: (number | null)[]) => void;
};

export default function PlayingXIEditor({ team, squad, isOwner, onUpdatePlayingXI }: PlayingXIEditorProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const { toast } = useToast();

  if (!squad) {
    return (
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-base font-headline flex items-center gap-2">
            <TeamLogo teamId={team.id} className="w-5 h-5" />
            {team.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
            <p className="text-sm text-muted-foreground">Loading squad...</p>
        </CardContent>
      </Card>
    )
  }

  const playingXI = squad.playingXI || Array(12).fill(null);
  const playerObjectsInXI = playingXI.map(id => squad.players.find(p => p.id === id)).filter((p): p is SoldPlayer => !!p);
  const overseasInXI = playerObjectsInXI.filter(p => p.isOverseas).length;
  const canAddOverseas = overseasInXI < 4;

  const playingXIPlayerIds = new Set(playerObjectsInXI.map(p => p.id));
  const playingXICount = playerObjectsInXI.slice(0, 11).length;
  const impactPlayerCount = playerObjectsInXI[11] ? 1 : 0;

  const handleSelectPlayer = (playerId: number) => {
    if (!isOwner) return;
    setSelectedPlayerId(prevId => (prevId === playerId ? null : playerId));
  };

  const handleAssignToSlot = (slotIndex: number) => {
    if (!isOwner || selectedPlayerId === null || playingXI[slotIndex] !== null) return;
    
    const playerToAssign = squad.players.find(p => p.id === selectedPlayerId);
    if (playerToAssign?.isOverseas && !canAddOverseas) {
      toast({
        title: 'Overseas Limit Reached',
        description: 'You cannot have more than 4 overseas players in your Playing XI.',
        variant: 'destructive',
      });
      return;
    }

    const newXI = [...playingXI];
    const existingSlotIndex = newXI.indexOf(selectedPlayerId);
    if(existingSlotIndex > -1) {
        newXI[existingSlotIndex] = null;
    }

    newXI[slotIndex] = selectedPlayerId;
    onUpdatePlayingXI(newXI);

    setSelectedPlayerId(null);
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    if (!isOwner) return;
    const newXI = [...playingXI];
    newXI[slotIndex] = null;
    onUpdatePlayingXI(newXI);
  };
  
  const overseasInSquad = squad.players.filter(p => p.isOverseas).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <CardTitle className="text-base font-headline flex items-center gap-2">
            <TeamLogo teamId={team.id} className="w-5 h-5" />
            {team.name}
        </CardTitle>
        <div className="text-right space-y-1">
            <p className="text-xs font-mono">{formatCurrency(squad.budget)} Left</p>
            <p className="text-xs text-muted-foreground">Players: {squad.players.length}/{MAX_PLAYERS_PER_TEAM} ({overseasInSquad}/8 OS)</p>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
          <Dialog onOpenChange={() => setSelectedPlayerId(null)}>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={squad.players.length === 0}>
                    <Users className="mr-2 h-4 w-4" />
                    Playing XI: {playingXICount}/11 (+{impactPlayerCount} Impact)
                  </Button>
              </DialogTrigger>
              <DialogContent className="grid h-screen w-screen max-w-none grid-rows-[auto_1fr_auto] border-0 p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg">
                  <DialogHeader className="border-b p-4">
                      <DialogTitle>Manage Playing XI for {team.name}</DialogTitle>
                      <DialogDescription>
                          {isOwner 
                            ? `Select a player from your squad, then click an empty slot. Max 4 overseas players allowed in XI. (${overseasInXI}/4)`
                            : `Viewing the Playing XI for ${team.name}.`
                          }
                      </DialogDescription>
                  </DialogHeader>

                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden p-4 md:grid-cols-2">
                    {/* Left Panel: All Squad Players */}
                    <div className="flex min-h-0 flex-col gap-2">
                        <h3 className="px-1 font-semibold text-muted-foreground">Your Squad ({squad.players.length})</h3>
                        <div className="flex-1 rounded-lg border overflow-y-auto">
                          <div className="p-2 space-y-1">
                              {squad.players.length > 0 ? (
                              squad.players.map(p => {
                                  const isInXI = playingXIPlayerIds.has(p.id);
                                  const isDisabled = !isOwner || isInXI || (p.isOverseas && !canAddOverseas && !isInXI);
                                  const roleStyles = getRoleStyles(p.role);

                                  return (
                                  <button
                                      key={p.id}
                                      disabled={isDisabled}
                                      onClick={() => handleSelectPlayer(p.id)}
                                      className={cn(
                                        "w-full text-left p-2 rounded-md transition-colors text-sm",
                                        isDisabled && "cursor-not-allowed opacity-40",
                                        !isDisabled && "hover:bg-accent",
                                        selectedPlayerId === p.id && "ring-2 ring-primary bg-accent"
                                      )}
                                  >
                                      <p className="font-semibold">{p.name} {p.isOverseas && <span className="text-muted-foreground font-normal">(OS)</span>}</p>
                                      <p className={cn("text-xs font-semibold", roleStyles.text)}>{p.role}</p>
                                  </button>
                                  );
                              })
                              ) : (
                                  <p className="text-sm text-muted-foreground text-center p-4">No players in squad.</p>
                              )}
                          </div>
                        </div>
                    </div>

                    {/* Right Panel: Playing XI Slots */}
                    <div className="flex min-h-0 flex-col gap-2">
                        <h3 className="px-1 font-semibold text-muted-foreground">Playing XI &amp; Impact Player ({overseasInXI}/4 OS)</h3>
                        <div className="flex-1 rounded-lg border overflow-y-auto">
                          <div className="grid grid-cols-1 gap-2 p-2">
                            {playingXI.map((playerId, index) => {
                                const isImpactPlayer = index === 11;
                                const player = playerId ? squad.players.find(p => p.id === playerId) : null;
                                const hasPlayer = !!player;
                                const roleStyles = player ? getRoleStyles(player.role) : null;

                                const slotContent = hasPlayer && player && roleStyles ? (
                                    <>
                                        <Shirt className={cn("h-5 w-5", isImpactPlayer ? "text-amber-500" : "text-primary")} />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{player.name} {player.isOverseas && <span className="text-muted-foreground font-normal">(OS)</span>}</p>
                                            <p className={cn("text-xs font-semibold", roleStyles.text)}>{player.role}</p>
                                        </div>
                                        {isOwner && <MinusCircle className="h-5 w-5 text-destructive opacity-70" />}
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="h-5 w-5 text-muted-foreground" />
                                        <p className="font-semibold text-sm text-muted-foreground">
                                            {selectedPlayerId !== null 
                                                ? 'Click to place selected player' 
                                                : isImpactPlayer 
                                                    ? 'Empty Impact Player Slot' 
                                                    : `Empty Slot ${index + 1}`
                                            }
                                        </p>
                                    </>
                                );

                                return (
                                    <React.Fragment key={`slot-fragment-${index}`}>
                                        {isImpactPlayer && (
                                            <div className="relative my-2 border-t">
                                                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">Impact Player</span>
                                            </div>
                                        )}
                                        <button
                                            key={`player-slot-${index}`}
                                            disabled={!isOwner || (hasPlayer ? false : selectedPlayerId === null)}
                                            onClick={() => hasPlayer ? handleRemoveFromSlot(index) : handleAssignToSlot(index)}
                                            className={cn(
                                                "border rounded-lg p-3 flex items-center gap-3 h-14 text-left transition-colors",
                                                hasPlayer
                                                    ? cn("bg-card", isOwner && "hover:bg-destructive/10")
                                                    : "border-dashed bg-muted/30 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                            )}
                                        >
                                            {slotContent}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                          </div>
                        </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="border-t p-4">
                      <DialogClose asChild>
                          <Button type="button">Done</Button>
                      </DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </CardContent>
    </Card>
  );
}
