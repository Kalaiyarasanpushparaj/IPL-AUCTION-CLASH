'use client';
import type { Team, GameState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Rocket } from 'lucide-react';
import { TeamLogo } from '@/components/icons/TeamLogo';

type TeamSelectionStepProps = {
  allTeams: Team[];
  gameState: GameState;
  usersInRoom: {id: string, displayName: string}[];
  onSelectTeam: (team: Team) => void;
  onStartAuction: () => void;
  isOwner: boolean;
};

export default function TeamSelectionStep({ allTeams, gameState, usersInRoom, onSelectTeam, onStartAuction, isOwner }: TeamSelectionStepProps) {
  const { user } = useUser();
  const selectedTeams = gameState.teams || [];

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-lg font-semibold mb-2">Select Your Team</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {allTeams.map(team => {
                const teamData = selectedTeams.find(t => t.id === team.id);
                const isSelectedByCurrentUser = teamData && teamData.ownerId === user?.uid;
                const isSelectedByOther = teamData && teamData.ownerId !== user?.uid;
                const teamOwner = usersInRoom.find(u => u.id === teamData?.ownerId);

                return (
                <button
                    key={team.id}
                    onClick={() => onSelectTeam(team)}
                    disabled={isSelectedByOther}
                    className={cn(
                    "border rounded-lg p-3 text-center space-y-2 transition-all duration-200 flex flex-col items-center justify-between aspect-square",
                    "bg-card/50",
                    isSelectedByOther ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:ring-2 hover:ring-primary hover:shadow-lg",
                    isSelectedByCurrentUser && "ring-2 ring-primary border-primary shadow-lg"
                    )}
                >
                    <div className="flex-grow flex flex-col items-center justify-center">
                    <TeamLogo teamId={team.id} className="w-12 h-12 mb-2" />
                    <p className="font-semibold text-sm leading-tight">{team.name}</p>
                    </div>
                    {teamData ? (
                    <div className="text-xs text-muted-foreground mt-1 text-center w-full">
                        <p className="font-semibold truncate">{teamOwner?.displayName || 'Selected'}</p>
                    </div>
                    ) : (
                        <div className="text-xs text-muted-foreground mt-1 h-[16px]"></div>
                    )}
                </button>
                );
            })}
            </div>
        </div>
        
        <div className="p-4 rounded-lg bg-card/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Rocket className="w-8 h-8 text-primary" />
                <div>
                    <h3 className="font-bold text-white">Play IPL Simulation Game! <span className="text-xs text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full align-middle">LIVE</span></h3>
                    <p className="text-sm text-muted-foreground">24/7 cricket simulation • Play now at cricketdirector.com</p>
                </div>
            </div>
             <Rocket className="w-8 h-8 text-primary" />
        </div>

        {isOwner && (
            <div className="flex justify-center">
                <Button onClick={onStartAuction} size="lg" className="w-full md:w-1/2 font-headline" disabled={(selectedTeams?.length || 0) < 2}>
                Start Auction ({selectedTeams?.length || 0} players ready)
                </Button>
            </div>
        )}
    </div>
  );
}
