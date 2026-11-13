import { describe, expect, it } from 'vitest';
import { ISSUES } from './data.ts';
import { BANK } from './questions.ts';

describe('the question bank', () => {
  it('every question on every kind of problem is one of the bank’s', () => {
    for (const issue of ISSUES) for (const a of issue.asks) expect(a.kind && BANK[a.kind], `${issue.id}: ${a.id}`).toBeDefined();
  });
});
