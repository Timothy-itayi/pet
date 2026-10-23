import { COMPANY, DAYS, POLICY } from '../game/data.ts';
import { NEWS, newsFor, type NewsPost } from '../game/news.ts';
import { HISTORY, socialFor, type SocialPost } from '../game/social.ts';
import { hrOn } from '../game/oktopus.ts';
import { weekday, weekOf } from '../game/rules.ts';
import type { App } from './app.ts';
import { openApp } from './desktop.ts';
import { h } from './dom.ts';
import { portrait } from './portrait.ts';

/**
 * Ridge, the office web browser: tabs, back and forward, an address bar you can type in, and favourites.
 * It's open on the Burrow Intranet, the company's own website. The rest of the web is blocked during the budget freeze.
 */

const HOST = 'intranet.burrow.local';
export const HOME = `http://${HOST}/`;

/** Burrow & Co.'s share price at the end of each day. It jumps on the first Friday, when the investment is announced. */
const BRRW = [4.12, 4.05, 3.98, 4.21, 5.37, 5.52, 5.61, 5.48, 5.44, 5.83];
const WEATHER = ['Drizzle, 13°', 'Showers, 12°', 'Cloudy, 14°', 'Sunny spells, 16°', 'Sunny, 18°', 'Windy, 15°', 'Rain, 11°', 'Fog, 12°', 'Cloudy, 14°', 'Sunny, 19°'];
const TODAY = [
  ['9:30 Welcome coffee for the new intern (there is no coffee)', '15:00 Sam’s leaving card, kitchen'],
  ['10:00 Budget meeting (cancelled: no budget)', '16:00 Fire drill (probably)'],
  ['11:00 Marketing stand-up', 'Biscuit’s birthday: cake in the kitchen'],
  ['10:30 Client visit, meeting room', '14:00 Printer appreciation hour'],
  ['12:00 All-hands: an announcement', '17:00 Drinks?'],
  ['9:00 Oktopus kick-off (it’s just you)', '15:00 Marketing try out Hootsweet'],
  ['9:30 Fern’s first day', '12:30 Welcome lunch, kitchen'],
  ['10:00 Basil’s first Sales meeting', '16:00 Hand-over: Marketing to Sales'],
  ['All day: auditors in the meeting room', '15:00 Wren’s leaving card (late)'],
  ['11:00 Juniper’s client workshop', '17:00 The Conversation'],
] as const;
const CANTEEN = ['Soup of the day (yesterday’s)', 'Cheese toastie', 'Carrot cake (Biscuit made it)', 'Mystery stew', 'Fish & chips Friday'];

const svg = (tag: string, attrs: Record<string, string>) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

/**
 * The Burrow & Co. logo: a wireframe globe with a businessman running across it, briefcase in hand and a star for a
 * head, in the style of a late-80s company mark. Drawn in the current text colour; the star is a shade lighter.
 */
export function logo(size = 44): SVGSVGElement {
  const mark = svg('svg', { viewBox: '0 0 100 80', width: String(Math.round(size * 1.25)), height: String(size), class: 'burrow-logo', 'aria-hidden': 'true' }) as SVGSVGElement;
  const line = { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6' };
  const globe = svg('g', { transform: 'rotate(-14 40 42)' });
  globe.append(svg('circle', { cx: '40', cy: '42', r: '25', ...line }));
  for (const rx of [7, 15, 21]) globe.append(svg('ellipse', { cx: '40', cy: '42', rx: String(rx), ry: '25', ...line }));
  for (const dy of [-18, -9, 0, 9, 18]) {
    const half = Math.sqrt(25 * 25 - dy * dy);
    globe.append(svg('line', { x1: String(40 - half), y1: String(42 + dy), x2: String(40 + half), y2: String(42 + dy), ...line }));
  }
  const limb = (d: string, width = '7') => svg('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const runner = svg('g', {});
  runner.append(
    limb('M50 54 L64 36', '9'),                       // body, leaning into the run
    limb('M62 38 L52 30 L44 27'),                     // arm back, holding the briefcase
    svg('rect', { x: '33', y: '20', width: '12', height: '15', rx: '2', fill: 'currentColor', transform: 'rotate(-20 39 27)' }),
    limb('M63 38 L76 44 L82 42'),                     // arm forward
    svg('circle', { cx: '84', cy: '41', r: '3.2', fill: 'currentColor' }),
    limb('M51 53 L40 60 L36 70'),                     // back leg
    limb('M52 53 L68 60 L82 70'),                     // front leg, mid-stride
  );
  const star = svg('polygon', { points: '72,10 75,20 86,20 77,26 81,37 72,30 63,37 67,26 58,20 69,20', fill: 'currentColor', class: 'logo-star' });
  const registered = svg('text', { x: '91', y: '36', 'font-size': '7', fill: 'currentColor', 'font-family': 'Arial, sans-serif' });
  registered.textContent = '\u00AE';
  mark.append(globe, runner, star, registered);
  return mark;
}

/** The share price so far, as a little line chart. */
function sparkline(day: number): SVGSVGElement {
  const points = BRRW.slice(0, Math.min(day, DAYS));
  const [lo, hi] = [3.8, 6];
  const chart = svg('svg', { viewBox: '0 0 200 64', class: 'spark', 'aria-hidden': 'true' }) as SVGSVGElement;
  chart.append(svg('polyline', { points: points.map((p, i) => `${(i / (BRRW.length - 1)) * 200},${60 - ((p - lo) / (hi - lo)) * 56}`).join(' ') }));
  return chart;
}

// ---- Tabs and history ------------------------------------------------------------------------------------------

interface Tab { history: string[]; at: number }

function tabs(app: App): Tab[] {
  app.ui.tabs ??= [{ history: [HOME], at: 0 }];
  return app.ui.tabs;
}
function tab(app: App): Tab {
  const all = tabs(app);
  const i = Math.min(app.ui.tab ?? 0, all.length - 1);
  app.ui.tab = i;
  return all[i] ?? { history: [HOME], at: 0 };
}
const urlOf = (t: Tab) => t.history[t.at] ?? HOME;

/** Go to an address in this tab, dropping anything you'd gone "back" from. */
function go(app: App, url: string): void {
  const t = tab(app);
  t.history = [...t.history.slice(0, t.at + 1), url];
  t.at = t.history.length - 1;
  app.rerender();
}

/** What you typed in the address bar: an address, or something to search for. */
function addressFor(typed: string): string {
  const text = typed.trim();
  if (!text) return HOME;
  if (/^[a-z]+:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(text)) return `http://${text}`;
  return `ridge://search?q=${encodeURIComponent(text)}`;
}

// ---- Pages -----------------------------------------------------------------------------------------------------

type Link = (label: string, url: string, cls?: string) => HTMLElement;

interface Page { title: string; body: (app: App, link: Link) => HTMLElement }

const NAV: [string, string][] = [['Home', '/'], ['Burrow Feed', '/feed'], ['People', '/people'], ['IT Help', '/it'], ['About', '/about']];

function siteHeader(link: Link, path: string): HTMLElement {
  const brand = h('div', { class: 'site-brand' });
  brand.append(logo(), h('div', {}, h('strong', {}, COMPANY), h('span', {}, 'Supplies, sundries & good intentions since 1987')));
  return h('header', { class: 'site-head' }, brand,
    h('nav', { class: 'site-nav', 'aria-label': 'Intranet' }, ...NAV.map(([label, to]) => link(label, `http://${HOST}${to}`, to === path ? 'on' : ''))));
}

const siteFoot = () => h('footer', { class: 'site-foot' },
  `© 1987–2026 ${COMPANY} Ltd · Registered in Burrow Hollow · Intranet v2.1, lovingly held together by Sam`);

function card(title: string, ...body: (HTMLElement | SVGElement | string | false)[]): HTMLElement {
  const el = h('article', { class: 'ridge-card' }, h('p', { class: 'card-title' }, title));
  for (const b of body) if (b !== false) el.append(b);
  return el;
}

/** A news story's picture: its scene on its colour, with a soft light across it, like a photo. */
const picture = (p: NewsPost, big = false) => h('div', { class: `news-picture${big ? ' big' : ''}`, style: `--tone:${p.tone}`, 'aria-hidden': 'true' }, h('span', {}, p.scene));

/** Who someone is, from HR: their name and job, for the top of their posts. */
function role(name: string, day: number): string {
  const row = hrOn(Math.min(day, DAYS)).find((r) => r.name === name);
  return row ? `${row.title}, ${row.dept}` : name === 'IT' ? 'The IT team (you)' : name === 'Sam' ? 'IT Administrator (left)' : COMPANY;
}

const when = (day: number) => (day < 1 ? (day < -5 ? 'Two weeks ago' : 'Last week') : `${weekday(day)}, week ${weekOf(day)}`);

/** The home page: the company's news front page. The big story with its picture, then the rest. */
function home(app: App, link: Link): HTMLElement {
  const { state } = app;
  const day = Math.min(state.day, DAYS);
  const price = BRRW[day - 1] ?? 0;
  const before = BRRW[day - 2] ?? price;
  const change = ((price - before) / before) * 100;
  const [lead, ...rest] = newsFor(state.day);
  const upcoming = NEWS.filter((p) => p.day > state.day && p.day <= DAYS).slice(0, 3);
  const byline = (p: NewsPost) => {
    const el = h('p', { class: 'byline' });
    el.append(portrait(p.from, 22), ` ${p.from} \u00b7 ${when(p.day)}`);
    return el;
  };
  return h('div', { class: 'site' },
    siteHeader(link, '/'),
    h('div', { class: 'news-front' },
      h('section', { class: 'news-main', 'aria-label': 'Company news' },
        lead && h('article', { class: 'news-hero' }, picture(lead, true),
          h('div', { class: 'news-hero-text' }, h('p', { class: 'kicker' }, 'Latest from Burrow'), h('h1', {}, lead.title), h('p', {}, lead.body), byline(lead))),
        rest.length > 0 && h('h2', { class: 'section-title' }, 'More company news'),
        h('div', { class: 'news-grid' }, ...rest.map((p) => h('article', { class: 'news-story' }, picture(p),
          h('div', {}, h('h3', {}, p.title), h('p', {}, p.body), byline(p))))),
        h('div', { class: 'feed-teaser' }, h('span', {}, 'What everyone\u2019s talking about'), link('Go to Burrow Feed \u2192', `http://${HOST}/feed`, 'more'))),
      h('aside', { class: 'news-side' },
        upcoming.length > 0 && card('Coming up', h('ul', { class: 'ridge-list' }, ...upcoming.map((p) => h('li', {}, h('strong', {}, `${weekday(p.day)}: `), p.title)))),
        card('Markets',
          h('p', { class: 'stock-line', 'data-testid': 'stock' }, h('strong', {}, 'BRRW'), h('span', {}, `$${price.toFixed(2)}`),
            h('span', { class: change >= 0 ? 'up' : 'down' }, `${change >= 0 ? '\u25B2' : '\u25BC'} ${Math.abs(change).toFixed(1)}%`)),
          sparkline(day),
          h('p', { class: 'stock-line small' }, h('span', {}, 'BIG OCEAN CORP'), h('span', {}, '$212.40'), h('span', { class: 'up' }, '\u25B2 0.3%'))),
        card('Today at Burrow', h('ul', { class: 'ridge-list' }, ...(TODAY[day - 1] ?? []).map((line) => h('li', {}, line)))),
        card('Weather \u00b7 Burrow Hollow', h('p', { class: 'weather' }, WEATHER[day - 1] ?? 'Sunny')),
        card('In the canteen', h('p', {}, CANTEEN[(day - 1) % CANTEEN.length] ?? '')))),
    siteFoot(),
  );
}

/** A post in Burrow Feed: who posted it, what they said, a picture if there is one, likes and a couple of comments. */
function feedPost(app: App, p: SocialPost): HTMLElement {
  const { ui } = app;
  const key = `${p.day}:${p.from}:${p.text.slice(0, 20)}`;
  const liked = (ui.liked ?? []).includes(key);
  const head = h('header', { class: 'post-head' });
  head.append(portrait(p.from, 40), h('div', {}, h('strong', {}, p.from), h('span', { class: 'meta' }, role(p.from, app.state.day)), h('span', { class: 'meta' }, when(p.day))));
  const comments = h('ul', { class: 'post-comments' }, ...p.comments.map(([who, said]) => {
    const li = h('li', {});
    li.append(portrait(who, 24), h('span', {}, h('strong', {}, who), ` ${said}`));
    return li;
  }));
  return h('article', { class: 'feed-post' }, head,
    h('p', {}, p.text),
    p.scene && h('div', { class: 'post-scene', 'aria-hidden': 'true' }, p.scene),
    h('p', { class: 'post-counts meta' }, `\u{1F44D} ${p.likes + (liked ? 1 : 0)} \u00b7 ${p.comments.length} comment${p.comments.length === 1 ? '' : 's'}`),
    h('div', { class: 'post-actions' },
      h('button', {
        class: `post-action${liked ? ' on' : ''}`, 'aria-pressed': liked ? 'true' : 'false', 'data-testid': 'like',
        onclick: () => { ui.liked = liked ? (ui.liked ?? []).filter((k) => k !== key) : [...(ui.liked ?? []), key]; app.rerender(); },
      }, liked ? '\u{1F44D} Liked' : '\u{1F44D} Like')),
    comments);
}

/** Burrow Feed: everyone's everyday posts, like a work social network for the company only. */
function feed(app: App, link: Link): HTMLElement {
  const { state } = app;
  const day = Math.min(state.day, DAYS);
  const staff = hrOn(day).filter((r) => r.status === 'active');
  const company = h('div', { class: 'feed-company' });
  company.append(logo(48), h('strong', {}, COMPANY), h('span', { class: 'meta' }, `Office supplies \u00b7 Burrow Hollow \u00b7 ${staff.length} people`));
  const me = h('section', { class: 'ridge-card feed-me' });
  me.append(portrait('IT', 56), h('strong', {}, 'Intern (you)'), h('span', { class: 'meta' }, `IT Intern at ${COMPANY}`), h('p', { class: 'meta' }, `Tickets resolved today: ${state.today.resolved}`));
  const team = h('ul', { class: 'feed-team' }, ...staff.filter((r) => r.login !== 'intern').slice(0, 8).map((r) => {
    const li = h('li', {});
    li.append(portrait(r.name, 28), h('span', {}, h('strong', {}, r.name), h('span', { class: 'meta' }, r.title)));
    return li;
  }));
  return h('div', { class: 'site' },
    siteHeader(link, '/feed'),
    h('div', { class: 'feed' },
      h('aside', { class: 'feed-left' }, me, h('section', { class: 'ridge-card' }, company)),
      h('section', { class: 'feed-main', 'aria-label': 'Burrow Feed' }, ...socialFor(state.day).map((p) => feedPost(app, p))),
      h('aside', { class: 'feed-right' }, card('People at Burrow', team), link('See everyone \u2192', `http://${HOST}/people`, 'more'))),
    siteFoot());
}

function people(app: App, link: Link): HTMLElement {
  const rows = hrOn(Math.min(app.state.day, DAYS)).filter((r) => r.status === 'active').sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name));
  return h('div', { class: 'site' }, siteHeader(link, '/people'),
    h('h1', { class: 'site-title' }, 'People'),
    h('p', { class: 'site-column' }, 'Everyone at Burrow, straight from HR. If you\u2019re not on here, talk to Otis.'),
    h('ul', { class: 'site-people' }, ...rows.map((r, i) => {
      const li = h('li', {});
      li.append(portrait(r.name, 44), h('div', {}, h('strong', {}, r.name), h('span', {}, r.title), h('span', { class: 'meta' }, `${r.dept} \u00b7 ext. ${201 + i}`)));
      return li;
    })),
    siteFoot());
}

function itHelp(app: App, link: Link): HTMLElement {
  return h('div', { class: 'site' }, siteHeader(link, '/it'),
    h('h1', { class: 'site-title' }, 'IT Help'),
    h('div', { class: 'site-column' },
      card('Need something fixed?',
        h('p', {}, 'Log a ticket. That\u2019s how it gets fixed, and it\u2019s how we know what keeps breaking. The IT team (one intern) will reply as soon as they can.'),
        h('button', { class: 'btn primary', onclick: () => openApp(app, 'desk') }, 'Open the Service Desk')),
      card('How IT handles things', h('ol', { class: 'policy-list' }, ...POLICY.map((rule) => h('li', {}, rule)))),
      card('Your password', h('p', {}, 'Nobody from IT will ever ask for your password. Not even nicely. Not even Mr. Grisby.'))),
    siteFoot());
}

function about(_app: App, link: Link): HTMLElement {
  return h('div', { class: 'site' }, siteHeader(link, '/about'),
    h('div', { class: 'about-cover', 'aria-hidden': 'true' }, h('span', {}, '\u{1F3E1}\u{1F333}\u{1F69A}\u{1F333}\u{1F3EA}')),
    h('h1', { class: 'site-title' }, `About ${COMPANY}`),
    h('div', { class: 'site-column' },
      h('p', {}, 'Burrow & Co. began in 1987 in a garden shed in Burrow Hollow, when a young Mr. Grisby started selling stationery, string and \u201Cuseful odds and ends\u201D to the businesses on the high street.'),
      h('p', {}, 'Today we supply offices across the valley with paper, pens, printers (and, increasingly, apologies about printers). We\u2019re a small team who care about doing things properly, eventually.'),
      card('Burrow through the years', h('ol', { class: 'history' }, ...HISTORY.map(([year, what]) => h('li', {}, h('strong', {}, year), h('span', {}, what))))),
      h('p', {}, 'Our values: Be helpful. Be honest. Log a ticket.')),
    siteFoot());
}

/** Search results: the intranet pages that mention it. The wider web is blocked. */
function search(q: string): Page {
  const pages: [string, string, string][] = [['Home', '/', 'news announcements share price weather canteen'], ['Burrow Feed', '/feed', 'feed posts birthday cake kudos stapler'],
    ['People', '/people', 'people staff directory phone extension'], ['IT Help', '/it', 'it help password ticket policy printer'], ['About', '/about', 'about history company 1987']];
  const hits = pages.filter(([title, , words]) => `${title} ${words}`.toLowerCase().includes(q.toLowerCase()));
  return {
    title: `${q} - Ridge Search`,
    body: (_app, link) => h('div', { class: 'site' },
      h('h1', { class: 'site-title' }, `Results for \u201C${q}\u201D`),
      h('div', { class: 'site-column' },
        ...(hits.length ? hits.map(([title, path]) => h('p', {}, link(title, `http://${HOST}${path}`), h('span', { class: 'meta' }, ` ${HOST}${path}`))) : [h('p', {}, 'Nothing on the intranet matches that.')]),
        h('p', { class: 'meta' }, 'Results from the wider web are hidden: internet access is limited during the budget freeze.'))),
  };
}

const PAGES: Record<string, Page> = {
  '/': { title: 'Burrow Intranet', body: home },
  '/feed': { title: 'Burrow Feed - Burrow Intranet', body: feed },
  '/people': { title: 'People - Burrow Intranet', body: people },
  '/it': { title: 'IT Help - Burrow Intranet', body: itHelp },
  '/about': { title: 'About - Burrow Intranet', body: about },
};

function pageAt(url: string): Page {
  if (url.startsWith('ridge://search?q=')) return search(decodeURIComponent(url.slice('ridge://search?q='.length)));
  const match = /^[a-z]+:\/\/([^/]+)(\/[^?#]*)?/i.exec(url);
  const host = match?.[1]?.toLowerCase() ?? '';
  const path = (match?.[2] ?? '/').replace(/\/+$/, '') || '/';
  if (host === HOST) {
    return PAGES[path] ?? { title: 'Can’t reach this page', body: () => h('div', { class: 'ridge-error' }, h('p', { class: 'glyph' }, '\u{1F615}'), h('h1', {}, 'Hmm… can’t reach this page'), h('p', {}, `${HOST}${path} doesn’t exist on the intranet.`)) };
  }
  return {
    title: 'Blocked',
    body: () => h('div', { class: 'ridge-error' }, h('p', { class: 'glyph' }, '⛔'), h('h1', {}, 'This site is blocked'),
      h('p', {}, `${host || url} isn’t on the list. ${COMPANY} internet policy: intranet only during the budget freeze.`)),
  };
}

/** The title of the page in the front tab, for the window's title bar. */
export const browserTitle = (app: App) => `${pageAt(urlOf(tab(app))).title} — Ridge`;

export function browser(app: App): HTMLElement {
  const { ui } = app;
  const all = tabs(app);
  const current = tab(app);
  const url = urlOf(current);
  const link: Link = (label, to, cls = '') => h('button', { class: `site-link ${cls}`, onclick: () => go(app, to) }, label);
  const travel = (by: number) => () => { current.at += by; app.rerender(); };
  const address = h('input', { class: 'ridge-address', name: 'address', value: url.replace(/^ridge:\/\/search\?q=/, ''), 'aria-label': 'Address', autocomplete: 'off', 'data-testid': 'ridge-address' }) as HTMLInputElement;
  return h('div', { class: 'ridge', 'data-testid': 'browser' },
    h('div', { class: 'ridge-tabs', role: 'tablist' },
      ...all.map((t, i) => h('span', { class: `ridge-tab${i === ui.tab ? ' on' : ''}` },
        h('button', { class: 'ridge-tab-name', role: 'tab', 'aria-selected': i === ui.tab ? 'true' : 'false', onclick: () => { ui.tab = i; app.rerender(); } },
          pageAt(urlOf(t)).title.replace(/ - Burrow Intranet$/, '')),
        h('button', {
          class: 'ridge-tab-close', 'aria-label': 'Close tab',
          onclick: () => { all.splice(i, 1); if (!all.length) all.push({ history: [HOME], at: 0 }); ui.tab = Math.max(0, Math.min(ui.tab ?? 0, all.length - 1)); app.rerender(); },
        }, '×'))),
      h('button', { class: 'ridge-tab new', 'aria-label': 'New tab', 'data-testid': 'ridge-new-tab', onclick: () => { all.push({ history: [HOME], at: 0 }); ui.tab = all.length - 1; app.rerender(); } }, '+')),
    h('form', { class: 'ridge-bar', onsubmit: (e) => { e.preventDefault(); go(app, addressFor(address.value)); } },
      h('button', { type: 'button', class: 'ridge-nav', 'aria-label': 'Back', disabled: current.at === 0, 'data-testid': 'ridge-back', onclick: travel(-1) }, '←'),
      h('button', { type: 'button', class: 'ridge-nav', 'aria-label': 'Forward', disabled: current.at >= current.history.length - 1, 'data-testid': 'ridge-forward', onclick: travel(1) }, '→'),
      h('button', { type: 'button', class: 'ridge-nav', 'aria-label': 'Refresh', onclick: () => app.rerender() }, '↻'),
      address),
    h('div', { class: 'ridge-page' }, pageAt(url).body(app, link)),
  );
}
