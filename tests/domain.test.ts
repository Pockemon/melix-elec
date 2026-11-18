import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('domaine personnalisé', () => {
  it('sert le site à la racine avec le CNAME melix-elec.com', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('melix-elec.com');
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/base: '\/'/);
  });
});
