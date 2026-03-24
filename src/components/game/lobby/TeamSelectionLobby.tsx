'use client';
import type { Team, GameState } from '@/lib/types';
import InviteFriends from './InviteFriends';
import TeamSelectionStep from '../TeamSelectionStep';
import ChatTabs from './ChatTabs';

type TeamSelectionLobbyProps = {
  roomId: string;
  allTeams: Team[];
  gameState: GameState;
  usersInRoom: { id: string; displayName: string }[];
  onSelectTeam: (team: Team) => void;
  onStartAuction: () => void;
  isOwner: boolean;
  onTimerChange: (duration: number) => void;
};

export default function TeamSelectionLobby({
  roomId,
  allTeams,
  gameState,
  usersInRoom,
  onSelectTeam,
  onStartAuction,
  isOwner,
  onTimerChange,
}: TeamSelectionLobbyProps) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary text-center">
            IPL Auction Lobby
        </h1>
        <InviteFriends roomId={roomId} />
        <TeamSelectionStep
            allTeams={allTeams}
            gameState={gameState}
            usersInRoom={usersInRoom}
            onSelectTeam={onSelectTeam}
            onStartAuction={onStartAuction}
            isOwner={isOwner}
        />
        <ChatTabs 
            roomId={roomId} 
            usersInRoom={usersInRoom} 
            isOwner={isOwner} 
            gameState={gameState} 
            onTimerChange={onTimerChange} 
        />
    </div>
  );
}
