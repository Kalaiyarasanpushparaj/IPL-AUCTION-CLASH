'use server';

import { analyzeTeams } from '@/ai/flows/trophy-winner-analysis';

export async function getTrophyWinnerAnalysis(teams: Record<string, string[]>): Promise<string[] | { error: string }> {
  if (!teams || Object.keys(teams).length < 2) {
    return { error: 'Not enough teams to analyze. Please provide at least two teams with players.' };
  }

  try {
    const result = await analyzeTeams({ teams });
    return result.rankedTeams;
  } catch (error) {
    console.error('Error analyzing teams:', error);
    return { error: 'An error occurred during analysis. Please try again.' };
  }
}
