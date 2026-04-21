'use client';
import { Input } from "@/components/ui/input";
import CopyButton from "@/components/game/CopyButton";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function InviteFriends({ roomId, roomCode }: { roomId: string, roomCode?: string }) {
    const [inviteLink, setInviteLink] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setInviteLink(`${window.location.origin}/game/${roomId}`);
        }
    }, [roomId]);

    const handleShare = () => {
        if(navigator.share) {
            navigator.share({
                title: 'Join my IPL Auction Clash!',
                text: `Join my auction room with code ${roomCode || ''} or use this link.`,
                url: inviteLink,
            })
        }
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Invite Friends</h2>
            
            {roomCode && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">Room Code</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center gap-2">
                        <Input value={roomCode} readOnly className="bg-muted text-center font-mono font-bold text-xl tracking-widest uppercase"/>
                        <CopyButton textToCopy={roomCode} />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm">Invite Link</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex items-center gap-2">
                    <Input value={inviteLink} readOnly className="bg-muted"/>
                    <CopyButton textToCopy={inviteLink} />
                    {typeof navigator.share !== 'undefined' && (
                        <Button onClick={handleShare}>
                            <Share2 className="mr-2" /> Share
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
