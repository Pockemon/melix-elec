import { mkdirSync, writeFileSync } from 'node:fs';
import { buildHealth } from './health-lib.mjs';

mkdirSync('public', { recursive: true });
writeFileSync('public/health.json', JSON.stringify(buildHealth(process.env.GITHUB_SHA)) + '\n');
