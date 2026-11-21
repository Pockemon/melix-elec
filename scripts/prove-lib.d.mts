export const REQUIRED_MARKERS: string[];
export function evaluate(o: { expectedSha: string; health: { status: number; body: string } | null; page: { status: number; body: string } | null }): { verdict: 'SATISFIED' | 'NOT_PROVEN'; facts: string[]; failures: string[] };
export function formatResult(r: { verdict: string; facts: string[]; failures: string[] }): string;
