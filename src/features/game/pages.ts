import { ISSUES, TOOLS } from './data.ts';
import type { GameState } from './rules.ts';
import type { PageStatus } from './types.ts';

/** One page of the runbook as it stands now: the old page, or yours if you've rewritten it. */
export interface RunbookPage {
  title: string;
  status: PageStatus;
  text: string;
  /** What the old runbook said, before your note replaced it. */
  old?: string;
  /** A page for one of your tools (it starts blank), not one of the old problems. */
  tool?: string;
}

/** Every page, in order: the old problems first, then a page for each tool you've been given. It grows as you go. */
export function runbookPages(state: GameState): RunbookPage[] {
  const right = (notes: { text: string; right?: true }[]) => notes.find((n) => n.right)?.text ?? '';
  return [
    ...ISSUES.map((issue) => {
      const status = state.runbook[issue.id] ?? issue.page.status;
      return { title: issue.title, status, text: status === 'yours' ? right(issue.notes) : issue.page.text, old: issue.page.text };
    }),
    ...TOOLS.filter((tool) => state.tools.includes(tool.id)).map((tool): RunbookPage => {
      const yours = state.runbook[`tool:${tool.id}`] === 'yours';
      return { title: tool.name, status: yours ? 'yours' : 'missing', text: yours ? right(tool.notes) : '(No page yet. Use it once, then write it up.)', tool: tool.id };
    }),
  ];
}
