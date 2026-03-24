import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from "firebase/firestore";
import type { Player } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (value < 1) {
    return `${Math.round(value * 100)}L`;
  }
  return `${value.toFixed(2)} Cr`;
}

export function formatTimestamp(timestamp: Timestamp | Date | null | undefined): string {
  if (!timestamp) {
    return '';
  }
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
    date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
  } else {
    return '';
  }
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getBidIncrement(basePrice: number): number {
  if (basePrice < 1) {
    return 0.05; // 5 Lakh
  } else if (basePrice >= 1 && basePrice < 5) {
    return 0.20; // 20 Lakh
  } else { // >= 5
    return 0.25; // 25 Lakh
  }
}

export function getRoleStyles(role: Player['role']) {
  switch (role) {
    case 'Wicketkeeper':
      return {
        badge: 'bg-wicketkeeper text-wicketkeeper-badge-text border-transparent',
        text: 'text-wicketkeeper',
      };
    case 'Batsman':
    case 'Bowler':
      return {
        badge: 'bg-batsman-bowler text-primary-foreground border-transparent',
        text: 'text-batsman-bowler',
      };
    case 'All-Rounder':
      return {
        badge: 'bg-all-rounder text-primary-foreground border-transparent',
        text: 'text-all-rounder',
      };
    default:
      return {
        badge: 'bg-secondary text-secondary-foreground',
        text: 'text-muted-foreground',
      };
  }
}
