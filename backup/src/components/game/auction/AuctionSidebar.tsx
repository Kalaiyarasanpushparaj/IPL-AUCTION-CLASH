'use client';
    
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Settings } from 'lucide-react';
import ChatBox from '@/components/game/lobby/ChatBox';
import PlayingXIEditor from '../PlayingXIEditor';
import { GameState } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

type AuctionSidebarProps = {
    roomId: string;
    gameState: GameState;
    updatePlayingXI: (teamId: string, newXI: (number | null)[]) => void;
    updateAuctionTimer: (duration: number) => void;
    isRoomOwner: boolean;
}

export default function AuctionSidebar({ roomId, gameState, updatePlayingXI, updateAuctionTimer, isRoomOwner }: AuctionSidebarProps) {
  const { user } = useUser();
  const userTeams = gameState.teams.filter(team => team.ownerId === user?.uid);
  const auctionState = gameState.auction;
  const currentTimerDuration = auctionState?.auctionTimerDuration;
  const [newTimerDuration, setNewTimerDuration] = useState(currentTimerDuration);

  useEffect(() => {
    setNewTimerDuration(currentTimerDuration);
  }, [currentTimerDuration]);

  const handleConfirmTimerChange = () => {
    if (newTimerDuration) {
        updateAuctionTimer(newTimerDuration);
    }
  };
  
  return (
    <Tabs defaultValue="teams" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="teams">
          <Users className="mr-2 h-4 w-4" /> Teams
        </TabsTrigger>
        <TabsTrigger value="chat">
          <MessageCircle className="mr-2 h-4 w-4" /> Chat
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="mr-2 h-4 w-4" /> Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="teams" className="mt-4">
        <Card>
            <CardContent className="p-2">
                <ScrollArea className="h-[calc(100vh-250px)]">
                    <div className="space-y-4 p-2">
                        {userTeams.length > 0 
                            ? userTeams.map(team => {
                                const isTeamOwner = user?.uid === team.ownerId;
                                return (
                                    <PlayingXIEditor 
                                    key={team.id} 
                                    team={team} 
                                    squad={gameState.squads[team.id]} 
                                    isOwner={isRoomOwner || isTeamOwner} 
                                    onUpdatePlayingXI={(newXI) => updatePlayingXI(team.id, newXI)}
                                    />
                                );
                            })
                            : <div className="p-4 text-center text-muted-foreground">Select a team to manage its Playing XI.</div>
                        }
                    </div>
                    <ScrollBar orientation="vertical"/>
                </ScrollArea>
            </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="chat" className="mt-4">
        <ChatBox roomId={roomId} />
      </TabsContent>
      
      <TabsContent value="settings" className="mt-4">
        <Card>
            <CardHeader>
                <CardTitle>Auction Settings</CardTitle>
                <CardDescription>Only the host can change these settings.</CardDescription>
            </CardHeader>
            <CardContent className="h-96 space-y-6 pt-2">
                 {auctionState && currentTimerDuration ? (
                <div className="space-y-3">
                    <Label htmlFor="bid-timer" className="flex justify-between">
                        <span>Bid Timer Duration</span>
                        <span className="text-muted-foreground font-mono">{newTimerDuration}s</span>
                    </Label>
                    <Slider
                        id="bid-timer"
                        min={5}
                        max={30}
                        step={1}
                        value={[newTimerDuration || 10]}
                        onValueChange={(value) => setNewTimerDuration(value[0])}
                        disabled={!isRoomOwner}
                    />
                    {isRoomOwner && (
                        <Button onClick={handleConfirmTimerChange} disabled={!newTimerDuration || newTimerDuration === currentTimerDuration}>
                            Confirm
                        </Button>
                    )}
                     {!isRoomOwner && <p className="text-xs text-muted-foreground">Only the host can adjust the bid timer.</p>}
                </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                         <p className="text-muted-foreground">No active auction settings.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
