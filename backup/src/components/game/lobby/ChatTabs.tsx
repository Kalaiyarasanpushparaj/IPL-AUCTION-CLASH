'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Settings } from 'lucide-react';
import PlayerListTab from './PlayerListTab';
import ChatBox from './ChatBox';
import SettingsTab from './SettingsTab';
import type { GameState } from '@/lib/types';

type ChatTabsProps = {
    roomId: string;
    usersInRoom: { id: string, displayName: string }[];
    isOwner: boolean;
    gameState: GameState;
    onTimerChange: (duration: number) => void;
}

export default function ChatTabs({ roomId, usersInRoom, isOwner, gameState, onTimerChange }: ChatTabsProps) {
  return (
    <Tabs defaultValue="chat" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="players">
          <Users className="mr-2" /> Players ({usersInRoom.length})
        </TabsTrigger>
        <TabsTrigger value="chat">
          <MessageCircle className="mr-2" /> Chat
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="mr-2" /> Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="players">
        <PlayerListTab usersInRoom={usersInRoom} />
      </TabsContent>
      <TabsContent value="chat">
        <ChatBox roomId={roomId} />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab isOwner={isOwner} gameState={gameState} onTimerChange={onTimerChange}/>
      </TabsContent>
    </Tabs>
  );
}
