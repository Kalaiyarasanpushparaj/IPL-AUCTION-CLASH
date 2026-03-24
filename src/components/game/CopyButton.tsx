'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CopyButtonProps = {
    textToCopy: string;
}

export default function CopyButton({ textToCopy }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            toast({ title: "Room code copied!" });
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            toast({ title: "Failed to copy", description: "Could not copy text to clipboard.", variant: "destructive" });
        });
    };

    return (
        <Button onClick={handleCopy} size="icon" variant="ghost">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy room code</span>
        </Button>
    );
}
