'use client';
import type { Player, AuctionState } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { IPL_TEAMS, AUCTION_TIMER_SECONDS } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { PauseCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import RoleBadge from './RoleBadge';

type PlayerCardProps = {
  player: Player;
  auctionState: AuctionState;
  playerPool: Player[];
};

export default function PlayerCard({ player, auctionState, playerPool }: PlayerCardProps) {
  const timerDuration = auctionState.auctionTimerDuration || AUCTION_TIMER_SECONDS;
  const progress = (auctionState.timer / timerDuration) * 100;
  const highestBidderTeam = IPL_TEAMS.find(t => t.id === auctionState.highestBidder);
  const isPaused = auctionState.isPaused;
  const isUnsold = auctionState.timer < 0;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <Card className={cn("overflow-hidden")}>
      <CardHeader className="bg-muted/50 p-4">
        <CardTitle className="font-headline text-2xl text-center">{auctionState.setName}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex flex-col items-center">
            <Avatar className={cn(
                "h-32 w-32 border-4 shadow-lg",
                (player.role === 'Batsman' || player.role === 'Bowler' ? 'border-batsman-bowler' : 'border-primary')
              )}>
              <AvatarFallback className="text-4xl font-bold bg-muted">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>
          <h2 className="text-2xl font-bold font-headline mt-4 text-center">
            {player.name} {player.isOverseas && <span className="text-lg text-muted-foreground font-medium">(OS)</span>}
            </h2>
          <div className="flex items-center gap-2 mt-2">
            <RoleBadge role={player.role} />
            <Badge variant="outline">{player.nationality}</Badge>
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-6">
            {isUnsold ? (
                 <div className="text-center space-y-4 flex flex-col items-center justify-center h-[164px]">
                    <p className="text-5xl font-bold font-mono text-destructive">UNSOLD</p>
                </div>
            ) : (
                <div className="text-center space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Base Price</p>
                        <p className="text-2xl font-bold font-mono">{formatCurrency(player.basePrice)}</p>
                    </div>
                    <div className="h-20 flex flex-col items-center justify-center">
                        <p className="text-sm text-muted-foreground">Current Bid</p>
                        <motion.p 
                            key={auctionState.currentBid}
                            initial={{ scale: 1, color: 'hsl(var(--foreground))' }}
                            animate={{ scale: [1, 1.2, 1], color: ['hsl(var(--primary))', 'hsl(var(--primary))', 'hsl(var(--foreground))'] }}
                            transition={{ duration: 0.5 }}
                            className="text-5xl font-bold font-mono text-primary"
                        >
                            {formatCurrency(auctionState.currentBid)}
                        </motion.p>
                        {highestBidderTeam ? (
                            <p className="text-sm text-muted-foreground mt-1">
                                by <span className="font-semibold text-foreground">{highestBidderTeam.name}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-1 h-[20px]"></p>
                        )}
                    </div>
                </div>
            )}
            
            <div className="h-[35px] flex flex-col justify-center">
              {isUnsold ? null : isPaused ? (
                <div className="flex items-center justify-center gap-2 text-lg font-semibold text-primary border rounded-lg p-3 bg-muted/50">
                  <PauseCircle className="h-5 w-5" />
                  <span>Auction Paused</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-muted-foreground">Time Remaining</p>
                    <p className="text-sm font-bold font-mono">{auctionState.timer}s</p>
                  </div>
                  <Progress value={progress} className="w-full h-3" />
                </>
              )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
