import { COMPANY, DAYS } from '../game/data.ts';
import { newsFor } from '../game/news.ts';
import type { App } from './app.ts';
import { openApp } from './desktop.ts';
import { h } from './dom.ts';

/**
 * Ridge, the office web browser, open on the Burrow Intranet home page: laid out like a modern browser's
 * news start page, with company news, the share price, the weather and what's on at the office.
 */

/** Burrow & Co.'s share price at the end of each day. It jumps on Friday, when the investment is announced. */
const BRRW = [4.12, 4.05, 3.98, 4.21, 5.37];
const WEATHER = ['Drizzle, 13°', 'Showers, 12°', 'Cloudy, 14°', 'Sunny spells, 16°', 'Sunny, 18°'];
const TODAY = [
  ['9:30 Welcome coffee for the new intern (there is no coffee)', '15:00 Sam’s leaving card, kitchen'],
  ['10:00 Budget meeting (cancelled: no budget)', '16:00 Fire drill (probably)'],
  ['11:00 Marketing stand-up', 'Biscuit’s birthday: cake in the kitchen'],
  ['10:30 Client visit, meeting room', '14:00 Printer appreciation hour'],
  ['12:00 All-hands: an announcement', '17:00 Drinks?'],
] as const;

/** The share price so far this week, as a little line chart. */
function sparkline(day: number): HTMLElement {
  const points = BRRW.slice(0, Math.min(day, DAYS));
  const [lo, hi] = [3.8, 5.5];
  const path = points.map((p, i) => `${(i / (BRRW.length - 1)) * 200},${60 - ((p - lo) / (hi - lo)) * 56}`).join(' ');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 64');
  svg.setAttribute('class', 'spark');
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('points', path);
  svg.append(line);
  const wrap = h('div', {});
  wrap.append(svg);
  return wrap;
}

export function browser(app: App): HTMLElement {
  const { state } = app;
  const day = Math.min(state.day, DAYS);
  const price = BRRW[day - 1] ?? 0;
  const before = BRRW[day - 2] ?? price;
  const change = ((price - before) / before) * 100;
  const [lead, ...rest] = newsFor(state.day);
  const tile = (label: string, glyph: string, onclick?: () => void, note?: string) =>
    h('button', { class: `ridge-tile${onclick ? '' : ' off'}`, disabled: !onclick, onclick, title: note ?? label },
      h('span', { class: 'glyph', 'aria-hidden': 'true' }, glyph), h('span', {}, label), note && h('span', { class: 'meta' }, note));
  return h('div', { class: 'ridge', 'data-testid': 'browser' },
    h('div', { class: 'ridge-tabs', 'aria-hidden': 'true' }, h('span', { class: 'ridge-tab on' }, '\u{1F310} Burrow Intranet'), h('span', { class: 'ridge-tab new' }, '+')),
    h('div', { class: 'ridge-bar' },
      h('span', { class: 'ridge-nav', 'aria-hidden': 'true' }, '← → ↻'),
      h('span', { class: 'ridge-address', 'aria-label': 'Address' }, 'http://intranet.burrow.local/home')),
    h('div', { class: 'ridge-page' },
      h('p', { class: 'ridge-hello' }, `Good morning · ${COMPANY}`),
      h('div', { class: 'ridge-search', 'aria-hidden': 'true' }, 'Search the intranet or the web'),
      h('div', { class: 'ridge-tiles' },
        tile('Service Desk', '\u{1F3AB}', () => openApp(app, 'desk')),
        tile('Burrow Chat', '\u{1F4AC}', () => openApp(app, 'chat')),
        tile('Directory', '\u{1F5C2}', () => openApp(app, 'directory')),
        tile('Payroll', '\u{1F4B7}', undefined, 'Down for maintenance since 2019'),
        tile('Oktopus', '\u{1F419}', undefined, 'Coming soon')),
      h('div', { class: 'ridge-feed' },
        h('section', { class: 'ridge-main' },
          lead && h('article', { class: 'ridge-card hero' },
            h('p', { class: 'meta' }, `Company news · ${lead.from} · Day ${lead.day}`),
            h('h2', {}, lead.title),
            h('p', {}, lead.body)),
          ...rest.map((p) => h('article', { class: 'ridge-card' },
            h('p', { class: 'meta' }, `${p.from} · Day ${p.day}`),
            h('h3', {}, p.title),
            h('p', {}, p.body)))),
        h('aside', { class: 'ridge-side' },
          h('article', { class: 'ridge-card stock', 'data-testid': 'stock' },
            h('p', { class: 'meta' }, 'Markets'),
            h('p', { class: 'stock-line' }, h('strong', {}, 'BRRW'), h('span', {}, `$${price.toFixed(2)}`),
              h('span', { class: change >= 0 ? 'up' : 'down' }, `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}%`)),
            sparkline(day),
            h('p', { class: 'meta' }, `${COMPANY} · this week`),
            h('p', { class: 'stock-line small' }, h('span', {}, 'BIG OCEAN CORP'), h('span', {}, '$212.40'), h('span', { class: 'up' }, '▲ 0.3%')),
            h('p', { class: 'stock-line small' }, h('span', {}, 'MEADOW LIBRARY TRUST'), h('span', {}, 'not listed'), h('span', {}, '—'))),
          h('article', { class: 'ridge-card' },
            h('p', { class: 'meta' }, 'Weather · Burrow Hollow'),
            h('p', { class: 'weather' }, WEATHER[day - 1] ?? 'Sunny')),
          h('article', { class: 'ridge-card' },
            h('p', { class: 'meta' }, 'Today at Burrow'),
            h('ul', { class: 'ridge-list' }, ...(TODAY[day - 1] ?? []).map((line) => h('li', {}, line)))))),
    ),
  );
}
