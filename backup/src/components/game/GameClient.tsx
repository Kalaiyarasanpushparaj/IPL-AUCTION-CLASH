'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { doc, collection, addDoc, setDoc, serverTimestamp, getDoc, runTransaction } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import type { GameState, Team, Squad, Player } from '@/lib/types';
import { IPL_TEAMS, PLAYER_SETS, INITIAL_BUDGET, AUCTION_TIMER_SECONDS, MAX_PLAYERS_PER_TEAM } from '@/lib/data';
import AuctionStep from './AuctionStep';
import ResultsStep from './ResultsStep';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { formatCurrency, getBidIncrement } from '@/lib/utils';
import TeamSelectionLobby from './lobby/TeamSelectionLobby';

type GameClientProps = {
    roomId: string;
}

export default function GameClient({ roomId }: GameClientProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const roomRef = useMemoFirebase(() => (firestore && !isUserLoading && user ? doc(firestore, 'rooms', roomId) : null), [firestore, user, isUserLoading, roomId]);
  const { data: gameState, isLoading: isGameLoading } = useDoc<GameState>(roomRef);

  const usersRef = useMemoFirebase(() => (firestore && !isUserLoading && user ? collection(firestore, 'rooms', roomId, 'users') : null), [firestore, user, isUserLoading, roomId]);
  const { data: usersInRoom } = useCollection(usersRef);
  
  const isOwner = useMemo(() => user?.uid === gameState?.ownerId, [user, gameState]);
  const displayName = useMemo(() => usersInRoom?.find(u => u.id === user?.uid)?.displayName, [usersInRoom, user]);

  const handleSelectTeam = (team: Team) => {
    if (!user || !roomRef || !gameState || !displayName || !firestore) return;

    const currentTeams = gameState.teams || [];
    const teamSelection = currentTeams.find(t => t.id === team.id);
    const messagesRef = collection(firestore, 'rooms', roomId, 'messages');

    // Case 1: Team is already selected by current user. They want to deselect it.
    if (teamSelection && teamSelection.ownerId === user.uid) {
        const updatedTeams = currentTeams.filter(t => t.id !== team.id);
        updateDocumentNonBlocking(roomRef, { teams: updatedTeams });
        toast({ title: "Team Deselected", description: `You are no longer the owner of ${team.name}.` });
        return;
    }

    // Case 2: Team is already selected by another user.
    if (teamSelection && teamSelection.ownerId !== user.uid) {
        toast({ title: "Team Taken", description: "This team is already owned by another player.", variant: "destructive" });
        return;
    }

    // Case 3: Team is available. Everyone (including host) can only have one team.
    if (!teamSelection) {
        const currentUserHasTeam = currentTeams.some(t => t.ownerId === user.uid);
        const otherUsersTeams = currentTeams.filter(t => t.ownerId !== user.uid);
        const newTeamForUser = { ...team, ownerId: user.uid };
        const updatedTeams = [...otherUsersTeams, newTeamForUser];

        updateDocumentNonBlocking(roomRef, { teams: updatedTeams });
        toast({
          title: currentUserHasTeam ? "Team Changed!" : "Team Selected!",
          description: `You are now the owner of the ${team.name}.`,
        });
        addDoc(messagesRef, {
            text: `selected the ${team.name}`,
            userId: user.uid,
            displayName,
            createdAt: serverTimestamp(),
            type: 'system',
            teamName: team.name,
            teamId: team.id,
            eventType: 'select_team',
        });
    }
  };

  const handleStartAuction = () => {
    if (!roomRef || !usersInRoom || !gameState || !isOwner) return;
    
    const teamsWithOwners = gameState.teams || [];

    if (teamsWithOwners.length < 2) {
        toast({
            title: "Not enough players",
            description: "At least 2 players must select a team to start.",
            variant: "destructive"
        });
        return;
    }

    const squads = teamsWithOwners.reduce((acc, team) => {
      if (team.id) {
          acc[team.id] = { players: [], budget: INITIAL_BUDGET, playingXI: Array(12).fill(null) };
      }
      return acc;
    }, {} as Record<string, Squad>);
    
    const firstSet = PLAYER_SETS[0];
    const shuffledPlayerPool = [...firstSet.players].sort(() => Math.random() - 0.5);
    const timerDuration = gameState.auctionTimerDuration || AUCTION_TIMER_SECONDS;
    const firstPlayer = shuffledPlayerPool[0];

    updateDocumentNonBlocking(roomRef, {
      teams: teamsWithOwners,
      squads: squads,
      playerPool: shuffledPlayerPool,
      phase: 'auction',
      auction: {
        currentSetIndex: 0,
        setName: firstSet.setName,
        currentPlayerIndex: 0,
        timer: timerDuration,
        currentBid: firstPlayer.basePrice,
        highestBidder: null,
        bidHistory: [],
        isPaused: false,
        auctionTimerDuration: timerDuration,
        bidIncrement: getBidIncrement(firstPlayer.basePrice),
      },
    });

    toast({
      title: "Auction Started!",
      description: "The first player is up for bidding.",
    });
  };

  const moveToNextPlayer = useCallback((currentSquads?: Record<string, Squad>) => {
    if (!gameState || !gameState.auction || !roomRef) return;

    const { auction, playerPool, squads } = gameState;
    const resolvedSquads = currentSquads || squads;
    const nextPlayerIndex = auction.currentPlayerIndex + 1;
    
    if (nextPlayerIndex >= playerPool.length) {
        const nextSetIndex = auction.currentSetIndex + 1;
        
        if (nextSetIndex >= PLAYER_SETS.length) {
            updateDocumentNonBlocking(roomRef, { phase: 'results', auction: null, squads: resolvedSquads });
            return;
        }

        const nextSet = PLAYER_SETS[nextSetIndex];
        const nextPlayerPool = [...nextSet.players].sort(() => Math.random() - 0.5);
        const auctionTimerDuration = auction.auctionTimerDuration || AUCTION_TIMER_SECONDS;
        const nextPlayer = nextPlayerPool[0];

        updateDocumentNonBlocking(roomRef, {
            squads: resolvedSquads,
            playerPool: nextPlayerPool,
            'auction.currentSetIndex': nextSetIndex,
            'auction.setName': nextSet.setName,
            'auction.currentPlayerIndex': 0,
            'auction.timer': auctionTimerDuration,
            'auction.currentBid': nextPlayer.basePrice,
            'auction.bidIncrement': getBidIncrement(nextPlayer.basePrice),
            'auction.highestBidder': null,
            'auction.bidHistory': [],
            'auction.isPaused': false,
        });
    } else {
        const auctionTimerDuration = auction.auctionTimerDuration || AUCTION_TIMER_SECONDS;
        const nextPlayer = playerPool[nextPlayerIndex];
        updateDocumentNonBlocking(roomRef, {
            squads: resolvedSquads,
            'auction.currentPlayerIndex': nextPlayerIndex,
            'auction.timer': auctionTimerDuration,
            'auction.currentBid': nextPlayer.basePrice,
            'auction.bidIncrement': getBidIncrement(nextPlayer.basePrice),
            'auction.highestBidder': null,
            'auction.bidHistory': [],
            'auction.isPaused': false,
        });
    }
  }, [gameState, roomRef]);

  const handleSellPlayer = useCallback(() => {
    if (!gameState || !gameState.auction || !roomRef || !gameState.teams || !firestore || !user) return;

    const { auction, playerPool, teams, squads } = gameState;
    const winningTeamId = auction.highestBidder;
    const player = playerPool[auction.currentPlayerIndex];
    let newSquads = { ...squads };
    const messagesRef = collection(firestore, 'rooms', roomId, 'messages');
    
    if (winningTeamId) {
        const winningTeam = teams.find(t => t.id === winningTeamId);
        const winningTeamSquad = squads[winningTeamId];
        if (winningTeam && winningTeamSquad) {
            newSquads[winningTeamId] = {
                ...winningTeamSquad,
                players: [...winningTeamSquad.players, { ...player, soldPrice: auction.currentBid }],
                budget: winningTeamSquad.budget - auction.currentBid,
            };
            const description = `${player.name} sold to ${winningTeam.name} for ${formatCurrency(auction.currentBid)}.`;
            const chatText = `SOLD: ${player.name} (${player.role}) to ${winningTeam.name} for ${formatCurrency(auction.currentBid)}!`;
            toast({ title: "Player Sold!", description });
            addDoc(messagesRef, {
                text: chatText,
                userId: gameState.ownerId,
                displayName: 'Auction',
                createdAt: serverTimestamp(),
                type: 'system',
                eventType: 'sold',
                teamId: winningTeam.id,
                teamName: winningTeam.name,
            });
        }
        moveToNextPlayer(newSquads);
    } else {
        const description = `${player.name} remains unsold.`;
        const chatText = `UNSOLD: ${player.name} (${player.role}).`;
        toast({ title: "Player Unsold", description });
        addDoc(messagesRef, {
            text: chatText,
            userId: gameState.ownerId,
            displayName: 'Auction',
            createdAt: serverTimestamp(),
            type: 'system',
            eventType: 'unsold',
        });
        updateDocumentNonBlocking(roomRef, {
            'auction.timer': -1, // Sentinel for unsold
            'auction.isPaused': true,
        });
    }
  }, [gameState, roomRef, toast, firestore, roomId, user, moveToNextPlayer]);


  useEffect(() => {
    if (isOwner && gameState?.phase === 'auction' && gameState.auction && !gameState.auction.isPaused) {
      if (gameState.auction.timer > 0) {
        const timerId = setTimeout(() => {
            if(roomRef && gameState?.auction) {
                updateDocumentNonBlocking(roomRef, { 'auction.timer': gameState.auction.timer - 1 });
            }
        }, 1000);
        return () => clearTimeout(timerId);
      } else if (gameState.auction.timer === 0) {
        handleSellPlayer();
      }
    }
  }, [isOwner, gameState, roomRef, handleSellPlayer]);
  
  useEffect(() => {
    if (isOwner && gameState?.auction?.timer === -1) {
      const delay = setTimeout(() => {
        moveToNextPlayer();
      }, 500); // 0.5-second delay to show unsold status
      return () => clearTimeout(delay);
    }
  }, [isOwner, gameState?.auction?.timer, moveToNextPlayer]);

  const [joinName, setJoinName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleLinkJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim() || !firestore || !user || !roomId || !roomRef || !usersRef) return;
    setIsJoining(true);

    try {
      const roomDocSnap = await getDoc(roomRef);
      if (!roomDocSnap.exists()) {
        toast({ title: 'Room Not Found', description: 'This room does not exist or has been deleted.', variant: 'destructive' });
        setIsJoining(false);
        return;
      }

      const userDocRef = doc(usersRef, user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: joinName.trim(),
          isRoomOwner: false,
          joinedAt: serverTimestamp(),
        });

        const messagesRef = collection(firestore, 'rooms', roomId, 'messages');
        await addDoc(messagesRef, {
          text: `${joinName.trim()} joined the room.`,
          userId: user.uid,
          displayName: joinName.trim(),
          createdAt: serverTimestamp(),
          type: 'system',
          eventType: 'join',
        });
      }
      toast({ title: 'Joined Room!', description: 'Welcome to the game lobby.' });
    } catch (error: any) {
      console.error('Failed to join room:', error);
      toast({
        title: 'Failed to Join',
        description: 'Room unavailable or permission error. Try copying the room code from the host.',
        variant: 'destructive',
      });
    }
    setIsJoining(false);
  };

  const handlePlaceBid = (teamId: string) => {
    if (!user || !gameState || !gameState.auction || !roomRef || gameState.auction.isPaused || gameState.auction.highestBidder === teamId || !firestore) {
      return;
    }

    const player = gameState.playerPool[gameState.auction.currentPlayerIndex];
    const biddingTeamSquad = gameState.squads[teamId];
    
    if (biddingTeamSquad.players.length >= MAX_PLAYERS_PER_TEAM) {
      toast({
        title: 'Squad Full',
        description: `Your squad has reached the maximum of ${MAX_PLAYERS_PER_TEAM} players.`,
        variant: 'destructive',
      });
      return;
    }

    if (player.isOverseas) {
      const overseasCount = biddingTeamSquad.players.filter(p => p.isOverseas).length;
      if (overseasCount >= 8) {
        toast({
          title: "Overseas Limit Reached",
          description: `Your squad already has ${overseasCount} overseas players. The maximum is 8.`,
          variant: "destructive",
        });
        return;
      }
    }

    const isFirstBid = !gameState.auction.highestBidder;
    const increment = gameState.auction.bidIncrement;
    const newBidValue = isFirstBid ? gameState.auction.currentBid : gameState.auction.currentBid + increment;
    const newBid = parseFloat(newBidValue.toFixed(2));
    
    if (!biddingTeamSquad || biddingTeamSquad.budget < newBid) {
        toast({
            title: "Can't Bid",
            description: "Not enough budget.",
            variant: "destructive"
        });
        return;
    }

    const auctionTimerDuration = gameState.auction.auctionTimerDuration || AUCTION_TIMER_SECONDS;
    
    updateDocumentNonBlocking(roomRef, {
        'auction.currentBid': newBid,
        'auction.highestBidder': teamId,
        'auction.timer': auctionTimerDuration,
        'auction.bidHistory': [...(gameState.auction.bidHistory || []), { teamId: teamId, bid: newBid, userId: user.uid }],
    });

    const team = gameState.teams.find(t => t.id === teamId);
    const userDisplayName = usersInRoom?.find(u => u.id === user.uid)?.displayName;
    
    if (team && userDisplayName) {
        const messagesRef = collection(firestore, 'rooms', roomId, 'messages');
        addDoc(messagesRef, {
            text: `bids ${formatCurrency(newBid)}`,
            userId: user.uid,
            displayName: `${userDisplayName} (${team.name})`,
            createdAt: serverTimestamp(),
            type: 'system',
            teamId: team.id,
            eventType: 'bid',
        });
    }
  };
  
  const handleTogglePause = () => {
    if (!roomRef || !gameState || !gameState.auction) return;
    if (isOwner) {
        // Prevent unpausing during the "unsold" display period
        if (gameState.auction.timer === -1) return;
        updateDocumentNonBlocking(roomRef, { 'auction.isPaused': !gameState.auction.isPaused });
    }
  };

  const handleUpdatePlayingXI = (teamId: string, newXI: (number | null)[]) => {
    if (!roomRef || !gameState || !gameState.teams || !user) return;
    const team = gameState.teams.find(t => t.id === teamId);

    const isRoomOwner = user.uid === gameState.ownerId;
    const isTeamOwner = user.uid === team?.ownerId;

    if (!isRoomOwner && !isTeamOwner) return;

    const fieldPath = `squads.${teamId}.playingXI`;

    updateDocumentNonBlocking(roomRef, {
      [fieldPath]: newXI,
    });
  };
  
  const handleEndAuction = () => {
    if (!roomRef || !isOwner) return;
    updateDocumentNonBlocking(roomRef, { 
      phase: 'results', 
      auction: null 
    });
    toast({
      title: "Auction Ended",
      description: "The auction has been manually ended by the host.",
    });
  };

  const handleRestartGame = () => {
    if (!roomRef || !isOwner) return;
    updateDocumentNonBlocking(roomRef, {
        phase: 'team-selection',
        teams: [],
        squads: {},
        playerPool: [],
        auction: null,
    });
  };
  
  const handleUpdateRoomTimer = (newDuration: number) => {
    if (!roomRef || !isOwner) return;
    updateDocumentNonBlocking(roomRef, { 'auctionTimerDuration': newDuration });
  };
  
  const handleUpdateAuctionTimer = (newDuration: number) => {
    if (!roomRef || !isOwner || !gameState?.auction) return;
    updateDocumentNonBlocking(roomRef, { 'auction.auctionTimerDuration': newDuration });
  };

  // Trigger anonymous auth for direct link access
  useEffect(() => {
    if (auth && !isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, isUserLoading, user]);

if (isGameLoading || isUserLoading || !user) {
    return <div className="flex items-center justify-center min-h-[50vh] p-8">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading game room...</p>
      </div>
    </div>;
  }
  
  const router = useRouter();
  if (!gameState && !isGameLoading) {
      return <div className="text-center p-12 max-w-md mx-auto">
        <Loader2 className="w-16 h-16 text-destructive mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
        <p className="text-muted-foreground mb-6">This room does not exist or has been deleted.</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Go to Lobby
        </Button>
      </div>
  }

  // If user is accessing via direct link and hasn't joined the database collection yet
  if (gameState && usersInRoom && user && !usersInRoom.find(u => u.id === user.uid)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <div className="max-w-md w-full bg-card/50 p-8 rounded-xl border border-primary/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-primary">Join Room</h2>
            <p className="text-muted-foreground">You've been invited to room <span className="font-mono font-bold text-foreground mx-1 text-lg">{gameState.roomCode}</span></p>
          </div>
          <form onSubmit={handleLinkJoin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="joinName" className="text-left block">Your Display Name</Label>
              <Input
                id="joinName"
                type="text"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                placeholder="Enter your name"
                className="w-full text-center text-lg h-12"
                disabled={isJoining}
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={isJoining || !joinName.trim()}>
              {isJoining ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Enter Game
            </Button>
          </form>
        </div>
      </div>
    );
  }
  
  const gameActions = {
      placeBid: handlePlaceBid,
      togglePause: handleTogglePause,
      updatePlayingXI: handleUpdatePlayingXI,
      endAuction: handleEndAuction,
      updateAuctionTimer: handleUpdateAuctionTimer,
  };

  const renderPhase = () => {
    if (!gameState) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-12 h-12 animate-spin" /></div>;
    
    switch (gameState.phase) {
      case 'lobby':
      case 'team-selection':
        return <TeamSelectionLobby
            roomId={roomId}
            allTeams={IPL_TEAMS} 
            onSelectTeam={handleSelectTeam}
            onStartAuction={handleStartAuction}
            isOwner={isOwner}
            gameState={gameState}
            usersInRoom={usersInRoom || []}
            onTimerChange={handleUpdateRoomTimer}
        />;
      case 'auction':
        if (!gameState.auction || !gameState.playerPool || gameState.playerPool.length === 0) return <div>Loading auction...</div>
        return <AuctionStep gameState={gameState} gameActions={gameActions} isOwner={isOwner} roomId={roomId}/>;
      case 'results':
        return <ResultsStep gameState={gameState} onRestart={handleRestartGame} isOwner={isOwner} />;
      default:
        return <div>Invalid game phase. Waiting for owner to start.</div>;
    }
  };

  return <div className="w-full">{renderPhase()}</div>;
}
