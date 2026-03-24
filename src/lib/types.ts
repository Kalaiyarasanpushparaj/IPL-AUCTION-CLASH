import { Timestamp } from "firebase/firestore";

export type Player = {
  id: number;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper';
  nationality: string;
  basePrice: number;
  isOverseas: boolean;
};

export type SoldPlayer = Player & {
  soldPrice: number;
};

export type Team = {
  id: string;
  name:string;
  ownerId?: string;
};

export type Squad = {
  players: SoldPlayer[];
  budget: number;
  playingXI: (number | null)[];
};

export type AuctionState = {
  currentSetIndex: number;
  setName: string;
  currentPlayerIndex: number;
  timer: number;
  currentBid: number;
  highestBidder?: string | null; // Team ID
  bidHistory: { teamId: string; bid: number }[];
  isPaused: boolean;
  auctionTimerDuration: number;
  bidIncrement: number;
};

export type GameState = {
  ownerId: string;
  roomCode: string;
  phase: 'lobby' | 'team-selection' | 'auction' | 'results';
  teams: Team[];
  squads: Record<string, Squad>;
  playerPool: Player[];
  auction: AuctionState | null;
  auctionTimerDuration?: number;
};

export type Message = {
  id: string;
  text: string;
  userId: string;
  displayName: string;
  createdAt: Timestamp;
  type: 'user' | 'system';
  teamId?: string;
  teamName?: string;
  eventType?: 'sold' | 'unsold' | 'bid' | 'join' | 'select_team';
};
