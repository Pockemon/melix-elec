export const MODEL_PATH: string;
export function checkGlb(buf: Buffer | null): string | null;
export function evaluate(o: {
  expectedSha: string;
  health: { status: number; body: string } | null;
  page: { status: number; body: string } | null;
  glb: { status: number; buffer: Buffer } | null;
  scripts: string[] | null;
}): { verdict: 'SATISFIED' | 'NOT_PROVEN'; facts: string[]; failures: string[] };
export function formatResult(r: { verdict: string; facts: string[]; failures: string[] }): string;
