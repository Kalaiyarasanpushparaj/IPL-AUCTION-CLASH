'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { 
    writeBatch,
    doc,
    collection,
    serverTimestamp,
    query,
    where,
    limit,
    getDocs,
    setDoc,
    addDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { CricketBatIcon } from '@/components/icons/CricketBatIcon';
import { Slider } from '@/components/ui/slider';
import { AUCTION_TIMER_SECONDS } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function LobbyPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [auctionTimer, setAuctionTimer] = useState(AUCTION_TIMER_SECONDS);

  useEffect(() => {
    if (!auth) return;
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const handleCreateRoom = async () => {
    if (!user || !firestore) {
      toast({ title: 'Authentication or database service is not ready.', variant: 'destructive' });
      return;
    }
    if (!displayName) {
        toast({ title: 'Please enter a display name.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    try {
        const batch = writeBatch(firestore);
        const newRoomRef = doc(collection(firestore, 'rooms'));
        
        batch.set(newRoomRef, {
            ownerId: user.uid,
            roomCode: generateRoomCode(),
            createdAt: serverTimestamp(),
            phase: 'team-selection',
            auctionTimerDuration: auctionTimer,
            teams: [],
        });
        
        const userRef = doc(firestore, 'rooms', newRoomRef.id, 'users', user.uid);
        batch.set(userRef, {
            displayName,
            isRoomOwner: true,
        });
        
        await batch.commit();

        const messagesRef = collection(firestore, 'rooms', newRoomRef.id, 'messages');
        await addDoc(messagesRef, {
            text: 'joined the room.',
            userId: user.uid,
            displayName: displayName,
            createdAt: serverTimestamp(),
            type: 'system',
            eventType: 'join',
        });

        router.push(`/game/${newRoomRef.id}`);
    } catch (error) {
        console.error("Error creating room: ", error);
        toast({ title: 'Failed to create room.', description: 'Please try again.', variant: 'destructive' });
        setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({ title: 'Authentication or database service is not ready.', variant: 'destructive' });
      return;
    }
    if (!displayName) {
        toast({ title: 'Please enter a display name.', variant: 'destructive' });
        return;
    }
    if (!roomCode) {
      toast({ title: 'Please enter a room code.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
        const roomsRef = collection(firestore, 'rooms');
        const q = query(roomsRef, where('roomCode', '==', roomCode.toUpperCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ title: 'Room not found.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        const roomDoc = querySnapshot.docs[0];
        const userRef = doc(firestore, 'rooms', roomDoc.id, 'users', user.uid);

        await setDoc(userRef, {
            displayName,
            isRoomOwner: false
        }, { merge: true });

        const messagesRef = collection(firestore, 'rooms', roomDoc.id, 'messages');
        await addDoc(messagesRef, {
            text: 'joined the room.',
            userId: user.uid,
            displayName,
            createdAt: serverTimestamp(),
            type: 'system',
            eventType: 'join',
        });
        
        router.push(`/game/${roomDoc.id}`);

    } catch (error) {
        console.error("Error joining room: ", error);
        toast({ title: 'Room not found or unable to join.', variant: 'destructive' });
        setIsLoading(false);
    }
  };
  
  if (isUserLoading || !auth || !firestore) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-background p-4">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-[spin_20s_linear_infinite_reverse]"></div>
        </div>

        <div className="container relative z-10 flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4">
                 <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter flex items-center justify-center gap-4">
                    <CricketBatIcon className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                    IPL Auction Clash
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                    Experience the thrill of a real IPL auction. Create a room, invite your friends, and build your dream team in a live bidding war.
                </p>
            </div>

            <div className="w-full max-w-md mx-auto">
                <div className="space-y-2 mb-6">
                    <Label htmlFor="displayName" className="text-left">Your Display Name</Label>
                    <Input
                        id="displayName"
                        placeholder="Enter your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isLoading}
                        className="text-center text-lg h-12"
                    />
                </div>

                <Tabs defaultValue="create" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Create Room</TabsTrigger>
                        <TabsTrigger value="join">Join Room</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="create" className="mt-6">
                        <Card className="bg-card/50">
                            <CardHeader>
                                <CardTitle>New Auction Room</CardTitle>
                                <CardDescription>Set up your private auction room.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="bid-timer" className="flex justify-between">
                                    <span>Bid Timer</span>
                                    <span className="text-muted-foreground font-mono">{auctionTimer}s</span>
                                    </Label>
                                    <Slider
                                        id="bid-timer"
                                        min={5}
                                        max={30}
                                        step={1}
                                        value={[auctionTimer]}
                                        onValueChange={(value) => setAuctionTimer(value[0])}
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button onClick={handleCreateRoom} className="w-full" disabled={isLoading || !displayName}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Create New Room
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="join" className="mt-6">
                         <Card className="bg-card/50">
                            <CardHeader>
                                <CardTitle>Join an Existing Room</CardTitle>
                                <CardDescription>Enter a room code to join your friends.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleJoinRoom} className="space-y-4">
                                    <div className="space-y-2">
                                    <Label htmlFor="roomCode" className="sr-only">Join with Code</Label>
                                    <Input
                                        id="roomCode"
                                        placeholder="Enter room code"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        disabled={isLoading}
                                    />
                                    </div>
                                    <Button type="submit" variant="secondary" className="w-full" disabled={isLoading || !displayName || !roomCode}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Join Room
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="w-full max-w-4xl grid md:grid-cols-3 gap-4 pt-12 text-left">
                <div className="p-6 border rounded-lg bg-card/50">
                    <h3 className="text-xl font-bold">1. Create & Join</h3>
                    <p className="text-muted-foreground mt-2">Instantly create a private auction room or join with a code.</p>
                </div>
                <div className="p-6 border rounded-lg bg-card/50">
                    <h3 className="text-xl font-bold">2. Live Bidding</h3>
                    <p className="text-muted-foreground mt-2">Battle it out with your friends in a real-time player auction.</p>
                </div>
                <div className="p-6 border rounded-lg bg-card/50">
                    <h3 className="text-xl font-bold">3. AI Analysis</h3>
                    <p className="text-muted-foreground mt-2">Get AI-powered rankings to see who built the champion squad.</p>
                </div>
            </div>
        </div>
    </main>
  );
}
