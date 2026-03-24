'use client';
import { useState } from 'react';
import type { GameState } from '@/lib/types';
import { getTrophyWinnerAnalysis } from '@/app/(actions)/analyze';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, ArrowLeftRight, RotateCcw } from 'lucide-react';
import TeamStatus from './TeamStatus';
import { ScrollArea } from '@/components/ui/scroll-area';
import PlayingXIEditor from './PlayingXIEditor';

type ResultsStepProps = {
  gameState: GameState;
  onRestart: () => void;
  isOwner: boolean;
};

export default function ResultsStep({ gameState, onRestart, isOwner }: ResultsStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rankings, setRankings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setRankings([]);

    const teamsToAnalyze: Record<string, string[]> = {};

    for (const team of gameState.teams) {
      const squad = gameState.squads[team.id];
      if (squad && squad.playingXI && squad.players) {
        const squadPlayerMap = new Map(squad.players.map(p => [p.id, p.name]));
        const playingXINames = squad.playingXI
          .map(playerId => {
            if (playerId === null) return null;
            return squadPlayerMap.get(playerId) || null;
          })
          .filter((name): name is string => name !== null);

        if (playingXINames.length > 0) {
          teamsToAnalyze[team.name] = playingXINames;
        }
      }
    }

    if (Object.keys(teamsToAnalyze).length < 2) {
      setError("At least two teams must have players in their Playing XI to run analysis.");
      setIsLoading(false);
      return;
    }

    const result = await getTrophyWinnerAnalysis(teamsToAnalyze);

    if (Array.isArray(result)) {
      setRankings(result);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Auction Over!</CardTitle>
            <CardDescription>Here are the final squads. Click below to get the AI-powered trophy winner analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!rankings.length && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <Trophy className="w-16 h-16 text-primary mb-4" />
                <h3 className="font-headline text-xl mb-2">Ready to find the Champion?</h3>
                <p className="text-muted-foreground mb-4">Our AI will analyze team composition and player stats to predict the winner.</p>
                <Button onClick={handleAnalyze} disabled={isLoading} size="lg">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
                  Analyze Trophy Winner
                </Button>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="ml-4 text-lg">Analyzing teams...</p>
              </div>
            )}
            {error && <p className="text-destructive text-center">{error}</p>}
            {rankings.length > 0 && (
              <div>
                <h3 className="font-headline text-2xl text-center mb-4">🏆 Trophy Winner Analysis 🏆</h3>
                <ol className="space-y-3">
                  {rankings.map((teamName, index) => {
                    const rankColor = index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-800' : 'text-foreground';
                    const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

                    return (
                      <li key={index} className="flex items-center text-xl p-3 bg-muted/50 rounded-lg">
                        <span className={`font-bold w-12 text-center ${rankColor}`}>{rankIcon}</span>
                        <span className={`font-semibold ${rankColor}`}>{teamName}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
             <div className="flex justify-center pt-6 space-x-4">
                <Button onClick={handleAnalyze} variant="outline" disabled={isLoading}>
                    <ArrowLeftRight className="mr-2 h-4 w-4" /> Re-Analyze
                </Button>
                {isOwner && (
                  <Button onClick={onRestart} variant="secondary">
                      <RotateCcw className="mr-2 h-4 w-4" /> New Game
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <h3 className="font-headline text-xl text-center mb-4">Final Squads</h3>
        <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
            {rankings.length > 0 
              ? gameState.teams.map(team => (
                  <PlayingXIEditor
                      key={team.id}
                      team={team}
                      squad={gameState.squads[team.id]}
                      isOwner={false} // View-only
                      onUpdatePlayingXI={() => {}} // Dummy function
                  />
              ))
              : gameState.teams.map(team => (
                  <TeamStatus key={team.id} team={team} squad={gameState.squads[team.id]} />
              ))
            }
            </div>
        </ScrollArea>
      </div>
    </div>
  );
}
