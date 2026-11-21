export const PAGE_MARKERS: string[];
export const CODE_MARKERS: string[];
export function scriptUrls(html: string): string[];
export function chunkNames(js: string): string[];
export function evaluate(o: { expectedSha: string; health: { status: number; body: string } | null; page: { status: number; body: string } | null; code: string }): { verdict: 'SATISFIED' | 'NOT_PROVEN'; facts: string[]; failures: string[] };
export function formatResult(r: { verdict: string; facts: string[]; failures: string[] }): string;
