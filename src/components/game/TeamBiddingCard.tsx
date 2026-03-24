'use client';
import type { Team, Squad, AuctionState, Player } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { Gavel } from 'lucide-react';
import { TeamLogo } from '@/components/icons/TeamLogo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MAX_PLAYERS_PER_TEAM } from '@/lib/data';

type TeamBiddingCardProps = {
  team: Team;
  squad: Squad;
  auctionState: AuctionState;
  onBid: () => void;
  currentPlayer: Player;
};

export default function TeamBiddingCard({ team, squad, auctionState, onBid, currentPlayer }: TeamBiddingCardProps) {
  const isHighestBidder = auctionState.highestBidder === team.id;
  
  const increment = auctionState.bidIncrement;
  const nextBidValue = auctionState.highestBidder
    ? auctionState.currentBid + increment
    : auctionState.currentBid;
  const nextBid = parseFloat(nextBidValue.toFixed(2));

  const overseasPlayersInSquad = squad.players.filter(p => p.isOverseas).length;
  const hasMaxOverseas = overseasPlayersInSquad >= 8;
  const hasMaxPlayers = squad.players.length >= MAX_PLAYERS_PER_TEAM;

  const canBid = squad.budget >= nextBid && !auctionState.isPaused && !isHighestBidder && !(currentPlayer.isOverseas && hasMaxOverseas) && !hasMaxPlayers;

  let disabledReason = '';
  if (squad.budget < nextBid) disabledReason = 'Not enough budget';
  if (auctionState.isPaused) disabledReason = 'Auction is paused';
  if (isHighestBidder) disabledReason = 'You are the highest bidder';
  if (currentPlayer.isOverseas && hasMaxOverseas) disabledReason = 'Overseas player limit reached (8)';
  if (hasMaxPlayers) disabledReason = `Squad is full (${MAX_PLAYERS_PER_TEAM} players)`;

  const bidButton = (
      <Button onClick={onBid} disabled={!canBid} className="w-full">
          <Gavel className="w-4 h-4 mr-2"/>
          {isHighestBidder ? 'Highest Bidder' : `Bid ${formatCurrency(nextBid)}`}
      </Button>
  );

  return (
    <Card className={cn("transition-all", isHighestBidder && "ring-2 ring-primary border-primary")}>
      <CardHeader className="p-3 flex-row justify-between items-center">
        <CardTitle className="text-base flex items-center gap-2">
            <TeamLogo teamId={team.id} className="w-6 h-6 flex-shrink-0" />
            <span className="truncate font-semibold" style={{ color: 'white' }}>{team.name}</span>
        </CardTitle>
        <div className="text-right text-xs">
            <p className="font-mono text-white/90">{squad.players.length}/{MAX_PLAYERS_PER_TEAM} Players</p>
            <p className="text-muted-foreground">{overseasPlayersInSquad}/8 Overseas</p>
        </div>
      </CardHeader>
      <CardContent className="p-3 text-center">
        <p className="text-xs text-muted-foreground">Budget Remaining</p>
        <p className="font-bold text-lg font-mono">{formatCurrency(squad.budget)}</p>
      </CardContent>
      <CardFooter className="p-3">
        {disabledReason ? (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-full">{bidButton}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{disabledReason}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        ) : (
            bidButton
        )}
      </CardFooter>
    </Card>
  );
}
