import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildHealth } from '../scripts/health-lib.mjs';

describe('health.json', () => {
  it('reprend le SHA fourni', () => {
    expect(buildHealth('abc123')).toEqual({ status: 'ok', sha: 'abc123' });
  });
  it('est écrit au build avec GITHUB_SHA', () => {
    const script = fileURLToPath(new URL('../scripts/write-health.mjs', import.meta.url));
    const cwd = mkdtempSync(join(tmpdir(), 'health-'));
    execFileSync(process.execPath, [script], { cwd, env: { ...process.env, GITHUB_SHA: 'deadbeef' } });
    expect(JSON.parse(readFileSync(join(cwd, 'public/health.json'), 'utf8'))).toEqual({ status: 'ok', sha: 'deadbeef' });
  });
});
