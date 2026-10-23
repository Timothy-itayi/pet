import type { App } from './app.ts';
import { h } from './dom.ts';
import { runbookPages, type RunbookPage } from '../game/pages.ts';

/**
 * The paper runbook, opened in your hands: two pages at a time, the old typed pages with your handwritten
 * corrections over them, a page for each tool you've been given, and blank pages at the back for what's to come.
 */

function sheet(n: number, ...children: (HTMLElement | false)[]): HTMLElement {
  return h('article', { class: 'sheet' }, h('p', { class: 'folio' }, `PAGE ${n}`), ...children);
}

function entry(page: RunbookPage, n: number): HTMLElement {
  return sheet(n,
    h('h3', { class: 'typed' }, page.title.toUpperCase()),
    page.status === 'missing' && !page.tool && h('div', { class: 'torn', 'aria-label': 'Torn out' }),
    page.status === 'yours'
      ? h('div', {},
        !page.tool && page.old !== undefined && h('p', { class: 'typed struck' }, page.old),
        h('p', { class: 'hand' }, page.text),
        h('p', { class: 'hand initials' }, '– you'))
      : h('p', { class: `typed ${page.status}` }, page.text),
  );
}

function insideCover(pages: RunbookPage[]): HTMLElement {
  return h('article', { class: 'sheet cover' },
    h('p', { class: 'typed' }, 'PROPERTY OF BURROW & CO. IT DEPT.'),
    h('p', { class: 'hand' }, 'If found, return to IT. (That’s you now.) – S'),
    h('h3', { class: 'typed' }, 'CONTENTS'),
    h('ol', { class: 'contents typed' }, ...pages.map((p, i) => h('li', {}, h('span', {}, p.title), h('span', {}, String(i + 1))))),
  );
}

function blank(n: number): HTMLElement {
  return sheet(n, h('p', { class: 'hand faint' }, 'Blank. Every fix you write up ends up in here.'));
}

function sheets(app: App): HTMLElement[] {
  const pages = runbookPages(app.state);
  const all = [insideCover(pages), ...pages.map((p, i) => entry(p, i + 1))];
  return [...all, blank(pages.length + 1), ...(all.length % 2 === 0 ? [blank(pages.length + 2)] : [])];
}

const spreadsOf = (app: App) => Math.ceil(sheets(app).length / 2);

/** Turn the pages: by -1 or +1 spreads. */
export function flipBook(app: App, by: number): void {
  const at = (app.ui.book ?? 0) + by;
  if (at < 0 || at >= spreadsOf(app)) return;
  app.ui.book = at;
  app.rerender();
}

export function closeBook(app: App): void {
  app.ui.book = undefined;
  app.rerender();
}

export function openBook(app: App): HTMLElement {
  const all = sheets(app);
  const spreads = Math.ceil(all.length / 2);
  const at = Math.min(app.ui.book ?? 0, spreads - 1);
  return h('section', { class: 'book', role: 'dialog', 'aria-label': 'The runbook, open', 'data-testid': 'book' },
    h('div', { class: 'spread' }, all[at * 2] ?? false, all[at * 2 + 1] ?? false),
    h('nav', { class: 'book-nav' },
      h('button', { class: 'btn', 'aria-label': 'Previous pages', disabled: at === 0, 'data-testid': 'book-back', onclick: () => flipBook(app, -1) }, '←'),
      h('span', { 'aria-live': 'polite' }, `Pages ${at * 2 + 1}–${at * 2 + 2} of ${all.length}`),
      h('button', { class: 'btn', 'aria-label': 'Next pages', disabled: at === spreads - 1, 'data-autofocus': true, 'data-testid': 'book-next', onclick: () => flipBook(app, 1) }, '→'),
      h('button', { class: 'btn', 'data-testid': 'close-book', onclick: () => closeBook(app) }, 'Close it')),
  );
}
