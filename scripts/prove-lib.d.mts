export const REQUIRED_SECTIONS: string[];
export const REQUIRED_TEXTS: string[];
export function checkPage(html: string): string[];
export function judge(input: { health: { status?: string; sha?: string } | null; deliverySha?: string; missing: string[] }): { verdict: 'SATISFIED' | 'NOT_PROVEN'; facts: string[] };
