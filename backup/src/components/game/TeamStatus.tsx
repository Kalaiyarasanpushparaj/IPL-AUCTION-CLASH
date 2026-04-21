'use client';
import type { Team, Squad, SoldPlayer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, getRoleStyles, cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { TeamLogo } from '@/components/icons/TeamLogo';
import { MAX_PLAYERS_PER_TEAM } from '@/lib/data';

type TeamStatusProps = {
  team: Team;
  squad: Squad;
};

export default function TeamStatus({ team, squad }: TeamStatusProps) {
  const overseasCount = squad.players.filter(p => p.isOverseas).length;

  return (
    <Card>
      <Collapsible>
        <CardHeader className="flex flex-row items-center justify-between p-0 hover:bg-muted/50 transition-colors rounded-t-lg">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-3 group">
            <CardTitle className="text-base font-headline flex items-center gap-2">
                <TeamLogo teamId={team.id} className="w-5 h-5" />
                {team.name}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right space-y-1">
                  <p className="text-xs font-mono">{formatCurrency(squad.budget)} Left</p>
                  <p className="text-xs text-muted-foreground">{squad.players.length}/{MAX_PLAYERS_PER_TEAM} Players ({overseasCount}/8 OS)</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0 border-t">
            <ScrollArea className="h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right pr-3">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {squad.players.length > 0 ? (
                    squad.players.map((player: SoldPlayer) => {
                      const roleStyles = getRoleStyles(player.role);
                      return (
                      <TableRow key={player.id}>
                        <TableCell className="py-2">
                          <div className="font-medium text-sm">{player.name} {player.isOverseas && <span className="text-muted-foreground text-xs">(OS)</span>}</div>
                          <div className={cn("text-xs font-semibold", roleStyles.text)}>{player.role}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm pr-3">{formatCurrency(player.soldPrice)}</TableCell>
                      </TableRow>
                    )})
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-4">No players bought.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
