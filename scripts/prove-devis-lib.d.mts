type Obs = { status: number; body: string } | null;
export const FIELD_NAMES: string[];
export const MAILTO_PREFIX: string;
export function missingFields(html: string): string[];
export function scriptSrc(html: string): string | null;
export function bundleBuildsMailto(js: string): boolean;
export function evaluateDevis(o: { health: Obs; expectedSha: string; page: Obs; bundle: Obs }): { verdict: 'SATISFIED' | 'NOT_PROVEN'; facts: string[]; failures: string[] };
export function formatDevis(r: { verdict: string; facts: string[]; failures: string[] }): string;
