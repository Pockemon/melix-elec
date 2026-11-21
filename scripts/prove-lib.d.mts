export const REQUIRED_MARKERS: string[];
export function evaluate(o: { expectedSha: string; health: { status: number; body: string } | null; page: { status: number; body: string } | null }): { verdict: 'SATISFIED' | 'NOT_PROVEN'; facts: string[]; failures: string[] };
export function formatResult(r: { verdict: string; facts: string[]; failures: string[] }): string;
export const REQUIRED_SECTIONS: string[];
export const REQUIRED_TEXTS: string[];
export function checkPage(html: string): string[];
export function judge(input: { health: { status?: string; sha?: string } | null; deliverySha?: string; missing: string[] }): { verdict: 'SATISFIED' | 'NOT_PROVEN'; facts: string[] };
