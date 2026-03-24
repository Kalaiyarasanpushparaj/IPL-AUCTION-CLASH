'use client';
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

type PlayerListTabProps = {
    usersInRoom: { id: string, displayName: string }[];
}

export default function PlayerListTab({ usersInRoom }: PlayerListTabProps) {
    return (
        <Card>
            <CardContent className="p-4 space-y-3 h-96 overflow-y-auto">
                {usersInRoom.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <span className="font-medium">{user.displayName}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
