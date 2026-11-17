import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildHealth } from '../scripts/health-lib.mjs';

describe('health.json', () => {
  it('reprend le SHA fourni', () => {
    expect(buildHealth('abc123')).toEqual({ status: 'ok', sha: 'abc123' });
  });
  it('est écrit au build avec GITHUB_SHA', () => {
    execFileSync('node', ['scripts/write-health.mjs'], { env: { ...process.env, GITHUB_SHA: 'deadbeef' } });
    expect(JSON.parse(readFileSync('public/health.json', 'utf8'))).toEqual({ status: 'ok', sha: 'deadbeef' });
  });
});
