import { newsFor } from '../game/news.ts';
import type { App } from './app.ts';
import { h } from './dom.ts';

/** The Burrow Intranet: company news, newest first. It's how you find out what the company wants next. */
export function intranet(app: App): HTMLElement {
  return h('div', { class: 'intranet' },
    h('header', { class: 'intranet-head' }, h('strong', {}, 'Burrow & Co.'), h('span', {}, 'Intranet · Company news')),
    h('ol', { class: 'news', 'data-testid': 'news' }, ...newsFor(app.state.day).map((p) => h('li', { class: 'post' },
      h('h3', {}, p.title),
      h('p', { class: 'meta' }, `${p.from} · Day ${p.day}`),
      h('p', {}, p.body)))),
  );
}
