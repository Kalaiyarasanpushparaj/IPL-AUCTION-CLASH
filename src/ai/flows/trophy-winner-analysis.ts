'use server';

/**
 * @fileOverview Analyzes the drafted teams and provides a ranking of potential winners.
 *
 * - analyzeTeams - A function that analyzes the teams and ranks them based on player form and stats.
 * - AnalyzeTeamsInput - The input type for the analyzeTeams function, a list of team names.
 * - AnalyzeTeamsOutput - The return type for the analyzeTeams function, a list of ranked team names.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTeamsInputSchema = z.object({
  teams: z
    .record(z.string(), z.array(z.string()))
    .describe('An object where each key is a team name and the value is an array of player names in their squad.'),
});
export type AnalyzeTeamsInput = z.infer<typeof AnalyzeTeamsInputSchema>;

const AnalyzeTeamsOutputSchema = z.object({
  rankedTeams: z
    .array(z.string())
    .describe('An array of IPL team names ranked by likelihood of winning.'),
});
export type AnalyzeTeamsOutput = z.infer<typeof AnalyzeTeamsOutputSchema>;

export async function analyzeTeams(input: AnalyzeTeamsInput): Promise<AnalyzeTeamsOutput> {
  return analyzeTeamsFlow(input);
}

const analyzeTeamsPrompt = ai.definePrompt({
  name: 'analyzeTeamsPrompt',
  input: {schema: AnalyzeTeamsInputSchema},
  output: {schema: AnalyzeTeamsOutputSchema},
  prompt: `You are an expert IPL (Indian Premier League) analyst. Your task is to rank the likelihood of teams winning the tournament based *only* on the recent form of their players.

**Analysis Criteria:**
1.  **Focus exclusively on recent performance:** Analyze each player's form based on their last 10-20 professional matches (T20 format where applicable).
2.  **Ignore historical data:** Do not consider career statistics, past reputation, or performances from more than a year ago. Your analysis must be based on current, up-to-date form.
3.  **Key Metrics for Recent Form:**
    *   **Batsmen:** High batting average, high strike rate, and consistency in scoring.
    *   **Bowlers:** Low bowling economy rate, high wicket-taking ability.
    *   **All-rounders:** Significant impact with both bat and ball.
    *   **Overall Match Impact:** Consider players who have been impactful in winning recent matches for their teams.

Given the following teams and their players from the Playing XI and Impact Player slots, perform your analysis.

{{#each teams}}
Team: {{@key}}
Players:
{{#each this}}
- {{this}}
{{/each}}

{{/each}}

Based on this strict, recent-form analysis, rank the teams from most likely to win to least likely to win. Provide only the team names in order.

Output the ranked teams as a JSON object with a 'rankedTeams' key containing an array of strings. Do not include any other text, explanation, or formatting.
For example, if the input is {"teams": {"Team A": ["Player 1", "Player 2"], "Team B": ["Player 3", "Player 4"]}}, the output should be {"rankedTeams": ["Team B", "Team A"]}.
`,
});

const analyzeTeamsFlow = ai.defineFlow(
  {
    name: 'analyzeTeamsFlow',
    inputSchema: AnalyzeTeamsInputSchema,
    outputSchema: AnalyzeTeamsOutputSchema,
  },
  async input => {
    const {output} = await analyzeTeamsPrompt(input);
    return output!;
  }
);
