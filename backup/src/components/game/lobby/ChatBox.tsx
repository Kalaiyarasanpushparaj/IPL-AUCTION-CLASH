'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Gavel } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Message } from '@/lib/types';
import { cn, formatTimestamp } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TeamLogo } from '@/components/icons/TeamLogo';
import { TEAM_COLORS } from '@/lib/team-visuals';

type ChatBoxProps = {
  roomId: string;
};

export default function ChatBox({ roomId }: ChatBoxProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: usersInRoom } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'rooms', roomId, 'users') : null, [firestore, roomId]));

  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesRef = useMemoFirebase(
    () => firestore ? query(collection(firestore, `rooms/${roomId}/messages`), orderBy('createdAt', 'asc')) : null,
    [firestore, roomId]
  );
  const { data: messages } = useCollection<Message>(messagesRef);

  const displayName = usersInRoom?.find(u => u.id === user?.uid)?.displayName;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !firestore || !displayName) return;

    const messagesCollection = collection(firestore, `rooms/${roomId}/messages`);
    await addDoc(messagesCollection, {
      text: message,
      userId: user.uid,
      displayName: displayName,
      createdAt: serverTimestamp(),
      type: 'user',
    });

    setMessage('');
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col h-96">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-2">
              {messages?.map((msg) => {
                const isSoldMessage = msg.eventType === 'sold';
                const isUnsoldMessage = msg.eventType === 'unsold';
                const isBidMessage = msg.eventType === 'bid';
                
                const teamColor = msg.teamId ? TEAM_COLORS[msg.teamId] : null;

                return (
                <div key={msg.id} 
                    className={cn(
                        "flex items-start gap-3 p-2 rounded-lg transition-colors",
                        isUnsoldMessage && "bg-destructive/10"
                    )}
                >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center pt-0.5">
                        {msg.type === 'system' && msg.teamId && <TeamLogo teamId={msg.teamId} className="w-5 h-5" />}
                        {msg.type === 'system' && msg.displayName === 'Auction' && <Gavel className="w-4 h-4 text-muted-foreground" />}
                        {msg.type === 'system' && !msg.teamId && msg.displayName !== 'Auction' && <User className="w-5 h-5 text-muted-foreground" />}
                        {msg.type === 'user' && <div className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full bg-muted text-muted-foreground">{msg.displayName.charAt(0)}</div>}
                    </div>
                  <div className="flex-1">
                    <p className={cn("text-sm", msg.type === 'system' && !isSoldMessage && !isUnsoldMessage && "text-muted-foreground")}>
                      <span 
                        className="font-semibold"
                        style={(isBidMessage && teamColor) ? { color: teamColor } : { color: 'white' }}
                      >
                        {msg.displayName}
                      </span>
                      <span 
                        className={cn(
                            (msg.teamName || isSoldMessage) && "font-bold",
                            isUnsoldMessage && "text-destructive font-semibold",
                        )}
                        style={!isBidMessage && teamColor && !isUnsoldMessage ? { color: teamColor } : {}}
                      > 
                        {' '}{msg.text}
                      </span>
                    </p>
                    <time className="text-xs text-muted-foreground/60">
                      {formatTimestamp(msg.createdAt)}
                    </time>
                  </div>
                </div>
              )})}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!message.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
