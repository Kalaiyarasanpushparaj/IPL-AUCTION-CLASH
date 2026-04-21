'use client';
import type { GameState, Player } from '@/lib/types';
import PlayerCard from './PlayerCard';
import TeamBiddingCard from './TeamBiddingCard';
import { Button } from '@/components/ui/button';
import { Pause, Play, StopCircle, List } from 'lucide-react';
import AuctionSidebar from './auction/AuctionSidebar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PLAYER_SETS } from '@/lib/data';
import { formatCurrency, getRoleStyles, cn } from '@/lib/utils';

type GameActions = {
  placeBid: (teamId: string) => void;
  togglePause: () => void;
  updatePlayingXI: (teamId: string, newXI: (number | null)[]) => void;
  endAuction: () => void;
  updateAuctionTimer: (duration: number) => void;
}

type AuctionStepProps = {
  gameState: GameState;
  gameActions: GameActions;
  isOwner: boolean;
  roomId: string;
};

export default function AuctionStep({ gameState, gameActions, isOwner, roomId }: AuctionStepProps) {
  if (!gameState.auction) return null;
  
  const currentPlayer = gameState.playerPool[gameState.auction.currentPlayerIndex];
  const isPaused = gameState.auction.isPaused;
  const { playerPool, auction: auctionState } = gameState;

  const remainingPlayersInSet = playerPool.slice(auctionState.currentPlayerIndex + 1);
  const upcomingSets = PLAYER_SETS.slice(auctionState.currentSetIndex + 1);

  return (
    <div className="relative">
      {isOwner && (
        <div className="absolute top-2 left-2 z-30">
            <Button variant="destructive" onClick={gameActions.endAuction}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Auction
            </Button>
        </div>
      )}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
                  <List className="h-4 w-4" />
                  <span className="sr-only">Upcoming Players</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Upcoming Players</SheetTitle>
                  <SheetDescription>
                    Players are auctioned in sets. Here's who is coming up next.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)] pr-4">
                  <div className="py-4 space-y-6">
                    {remainingPlayersInSet.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Next in {auctionState.setName}</h3>
                        <div className="space-y-2">
                          {remainingPlayersInSet.map(p => {
                            const roleStyles = getRoleStyles(p.role);
                            return (
                            <div key={p.id} className="p-2 rounded-md bg-muted/50 text-sm">
                              <p className="font-medium">{p.name} {p.isOverseas && <span className="text-muted-foreground font-normal">(OS)</span>}</p>
                              <p className={cn("text-xs font-semibold", roleStyles.text)}>{p.role} - <span className="font-normal text-muted-foreground">Base: {formatCurrency(p.basePrice)}</span></p>
                            </div>
                          )})}
                        </div>
                      </div>
                    )}

                    {upcomingSets.map(set => (
                      <div key={set.setName}>
                        <Separator className="my-4" />
                        <h3 className="font-semibold mb-2">{set.setName}</h3>
                        <div className="space-y-2">
                          {set.players.map(p => {
                             const roleStyles = getRoleStyles(p.role);
                             return (
                              <div key={p.id} className="p-2 rounded-md bg-muted/50 text-sm">
                                <p className="font-medium">{p.name} {p.isOverseas && <span className="text-muted-foreground font-normal">(OS)</span>}</p>
                                <p className={cn("text-xs font-semibold", roleStyles.text)}>{p.role} - <span className="font-normal text-muted-foreground">Base: {formatCurrency(p.basePrice)}</span></p>
                              </div>
                             )
                          })}
                        </div>
                      </div>
                    ))}

                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          {isOwner && (
            <Button variant="outline" size="icon" onClick={gameActions.togglePause} className="bg-background/80 backdrop-blur-sm">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span className="sr-only">{isPaused ? 'Resume' : 'Pause'}</span>
            </Button>
          )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pt-14">
        <div className="lg:col-span-2 space-y-6">
          <PlayerCard 
            player={currentPlayer} 
            auctionState={gameState.auction}
            playerPool={gameState.playerPool}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.teams.map(team => (
                  <TeamBiddingCard
                      key={team.id}
                      team={team}
                      squad={gameState.squads[team.id]}
                      auctionState={gameState.auction!}
                      onBid={() => gameActions.placeBid(team.id)}
                      currentPlayer={currentPlayer}
                  />
              ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4 sticky top-4">
          <AuctionSidebar 
            roomId={roomId}
            gameState={gameState}
            updatePlayingXI={gameActions.updatePlayingXI}
            updateAuctionTimer={gameActions.updateAuctionTimer}
            isRoomOwner={isOwner}
          />
        </div>
      </div>
    </div>
  );
}
