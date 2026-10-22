import { describe, expect, it } from 'vitest';
import { ISSUES, TOOLS } from '../game/data.ts';
import { newGame } from '../game/rules.ts';
import { runbookPages } from './panels.ts';

describe('the runbook pages', () => {
  it('start as the old pages, one per problem', () => {
    const pages = runbookPages(newGame());
    expect(pages).toHaveLength(ISSUES.length);
    expect(pages[0]).toMatchObject({ title: ISSUES[0]?.title, text: ISSUES[0]?.page.text });
  });

  it('show your note over the old text once you rewrite a page', () => {
    const issue = ISSUES[2];
    if (!issue) throw new Error('no issue');
    const s = newGame();
    s.runbook[issue.id] = 'yours';
    const page = runbookPages(s)[2];
    expect(page?.status).toBe('yours');
    expect(page?.text).toBe(issue.notes.find((n) => n.right)?.text);
    expect(page?.old).toBe(issue.page.text);
  });

  it('grow a blank page for each tool you are given', () => {
    const tool = TOOLS[0];
    if (!tool) throw new Error('no tool');
    const s = newGame();
    s.tools = [tool.id];
    const last = runbookPages(s).at(-1);
    expect(last).toMatchObject({ title: tool.name, status: 'missing', tool: tool.id });
  });
});
