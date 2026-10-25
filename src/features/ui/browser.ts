import { COMPANY, DAYS, POLICY } from '../game/data.ts';
import { artFor, BANNER, faceId, feedArt, newsArt } from '../game/art.ts';
import { NEWS, newsFor, type NewsPost } from '../game/news.ts';
import { HISTORY, socialFor, type SocialPost } from '../game/social.ts';
import { hrOn, OKTOPUS_DAY } from '../game/oktopus.ts';
import { BRRW, CANTEEN, TODAY, WEATHER } from '../game/office.ts';
import { moodWords, PEOPLE, sayNow, statusText } from '../game/people.ts';
import { weekday, weekOf } from '../game/rules.ts';
import {
  ArrowDownRight, ArrowUpRight, Building2, CalendarDays, CircleHelp, Clock, CloudSun, createElement, IdCard, User, X, FolderTree, History, House, KeyRound, LayoutGrid,
  LifeBuoy, Mail, Megaphone, MessageCircle, MessagesSquare, Newspaper, Search, ShieldCheck, ThumbsUp, Ticket, TrendingUp, Users, type IconNode,
} from 'lucide';
import type { App, AppId } from './app.ts';
import { openApp } from './desktop.ts';
import { h } from './dom.ts';
import { portrait } from './portrait.ts';

/**
 * Ridge, the office web browser: tabs, back and forward, an address bar you can type in, and favourites.
 * It's open on the Burrow Intranet, the company's own website. The rest of the web is blocked during the budget freeze.
 */

const HOST = 'intranet.burrow.local';
export const HOME = `http://${HOST}/`;

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
  app.ui.viewing = undefined;
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
type Part = HTMLElement | SVGElement | string | false | undefined;

interface Page { title: string; body: (app: App, link: Link) => HTMLElement }

const icon = (node: IconNode, size = 16) => createElement(node, { width: size, height: size, 'aria-hidden': 'true' });
/** A white icon on a coloured rounded square, the way the portal marks every section and card. */
const tile = (node: IconNode, colour: string, big = false) => h('span', { class: `tile${big ? ' big' : ''}`, style: `--tile:${colour}` }, icon(node, big ? 22 : 15));

interface Section { path: string; label: string; icon: IconNode; colour: string }
const SECTIONS = {
  home: { path: '/', label: 'Home', icon: House, colour: '#0176d3' },
  feed: { path: '/feed', label: 'Burrow Feed', icon: MessagesSquare, colour: '#2e844a' },
  people: { path: '/people', label: 'People', icon: Users, colour: '#7f56d9' },
  it: { path: '/it', label: 'IT Help', icon: LifeBuoy, colour: '#d83a00' },
  about: { path: '/about', label: 'About', icon: Building2, colour: '#3a49da' },
} satisfies Record<string, Section>;

/** The App Launcher: the programs on this computer, opened from the intranet. Oktopus only once it's arrived. */
const LAUNCHER: { id: AppId; label: string; about: string; icon: IconNode; colour: string }[] = [
  { id: 'desk', label: 'Service Desk', about: 'Tickets and requests', icon: Ticket, colour: '#0176d3' },
  { id: 'chat', label: 'Burrow Chat', about: 'Messages from the team', icon: MessageCircle, colour: '#2e844a' },
  { id: 'directory', label: 'Active Directory', about: 'Accounts and passwords', icon: FolderTree, colour: '#5867e8' },
  { id: 'okta', label: 'Oktopus Admin', about: 'Sign-on and apps', icon: ShieldCheck, colour: '#9050e9' },
  { id: 'mail', label: 'Mail', about: 'Burrow Mail', icon: Mail, colour: '#e3066a' },
];

function launcher(app: App): HTMLElement {
  const apps = LAUNCHER.filter((a) => a.id !== 'okta' || app.state.day >= OKTOPUS_DAY);
  return h('details', { class: 'launcher' },
    h('summary', { 'aria-label': 'App Launcher', title: 'App Launcher' }, icon(LayoutGrid, 18)),
    h('div', { class: 'launcher-panel' },
      h('p', { class: 'launcher-title' }, 'App Launcher'),
      h('div', { class: 'launcher-grid' }, ...apps.map((a) => h('button', { class: 'launcher-app', onclick: () => openApp(app, a.id) },
        tile(a.icon, a.colour, true), h('span', {}, h('strong', {}, a.label), h('span', {}, a.about)))))));
}

/** Every intranet page sits in the same portal: the search bar along the top, the section tabs, then the page. */
function portal(app: App, at: Section | undefined, ...body: Part[]): HTMLElement {
  const q = h('input', { class: 'gh-input', type: 'search', name: 'q', placeholder: 'Search Burrow Hub…', 'aria-label': 'Search the intranet', autocomplete: 'off' }) as HTMLInputElement;
  const to = (s: Section) => () => go(app, `http://${HOST}${s.path}`);
  const me = h('span', { class: 'gh-me', title: 'Intern (you)' });
  me.append(portrait('IT', 26));
  const brand = h('button', { class: 'gh-brand', onclick: to(SECTIONS.home) });
  brand.append(logo(26), h('span', {}, 'Burrow ', h('strong', {}, 'Hub')));
  return h('div', { class: 'portal' },
    h('header', { class: 'gh' }, brand,
      h('form', { class: 'gh-search', role: 'search', onsubmit: (e) => { e.preventDefault(); if (q.value.trim()) go(app, `ridge://search?q=${encodeURIComponent(q.value.trim())}`); } }, icon(Search, 14), q),
      h('div', { class: 'gh-tools' },
        h('button', { class: 'gh-tool', 'aria-label': 'Help', title: 'IT Help', onclick: to(SECTIONS.it) }, icon(CircleHelp, 18)),
        me)),
    h('nav', { class: 'ab', 'aria-label': 'Intranet' }, launcher(app), h('span', { class: 'ab-name' }, 'Intranet'),
      ...Object.values(SECTIONS).map((s) => h('button', { class: `ab-tab${s === at ? ' on' : ''}`, 'aria-current': s === at ? 'page' : undefined, onclick: to(s) }, s.label))),
    h('main', { class: 'pz' }, h('div', { class: 'pz-banner', 'aria-hidden': 'true' }, art(BANNER.id, true)), ...body),
    h('footer', { class: 'site-foot' }, `© 1987–2026 ${COMPANY} Ltd · Registered in Burrow Hollow · Burrow Hub v2.1, lovingly held together by Sam`));
}

/** The banner at the top of each page: its icon, what it is, and anything you can do from here. */
const pageHead = (s: Section, eyebrow: string, title: string, sub?: string, ...actions: HTMLElement[]) =>
  h('section', { class: 'ph' }, tile(s.icon, s.colour, true),
    h('div', { class: 'ph-text' }, h('p', { class: 'ph-eyebrow' }, eyebrow), h('h1', {}, title), sub && h('p', { class: 'ph-sub' }, sub)),
    actions.length > 0 && h('div', { class: 'ph-actions' }, ...actions));

function card(title: string, ic: IconNode, colour: string, ...body: Part[]): HTMLElement {
  return h('article', { class: 'lc' }, h('header', { class: 'lc-head' }, tile(ic, colour), h('h2', {}, title)), h('div', { class: 'lc-body' }, ...body));
}

/** A generated picture, once it's been made: moving if it loops and you're happy with motion, otherwise still. */
function art(id: string | undefined, moving = false): HTMLElement | undefined {
  const made = id ? artFor(id) : undefined;
  if (!made) return undefined;
  const still = import.meta.env.BASE_URL + made.image;
  if (!moving || !made.loop || matchMedia('(prefers-reduced-motion: reduce)').matches) return h('img', { class: 'art', src: still, alt: '', loading: 'lazy' });
  const clip = h('video', { class: 'art', src: import.meta.env.BASE_URL + made.loop, poster: still, autoplay: true, loop: true, playsinline: true }) as HTMLVideoElement;
  // The property, not the attribute: browsers only autoplay a video that's muted.
  clip.muted = true;
  return clip;
}

/** A news story's picture: its generated painting (moving, for the lead story), or until then its scene on its colour. */
function picture(p: NewsPost, big = false): HTMLElement {
  const painted = art(newsArt(p).id, big);
  return h('div', { class: `news-picture${big ? ' big' : ''}${painted ? ' painted' : ''}`, style: `--tone:${p.tone}`, 'aria-hidden': 'true' }, painted ?? h('span', {}, p.scene));
}

/** Who someone is, from HR: their name and job, for the top of their posts. */
function role(name: string, day: number): string {
  const row = hrOn(Math.min(day, DAYS)).find((r) => r.name === name);
  return row ? `${row.title}, ${row.dept}` : name === 'IT' ? 'The IT team (you)' : name === 'Sam' ? 'IT Administrator (left)' : COMPANY;
}

const when = (day: number) => (day < 1 ? (day < -5 ? 'Two weeks ago' : 'Last week') : `${weekday(day)}, week ${weekOf(day)}`);

function byline(p: NewsPost): HTMLElement {
  const el = h('p', { class: 'byline' });
  el.append(portrait(p.from, 22), ` ${p.from} · ${when(p.day)}`);
  return el;
}

/** One figure across the top of the home page. */
const kpi = (label: string, value: string, extra?: HTMLElement, testid?: string) =>
  h('div', { class: 'kpi', 'data-testid': testid }, h('span', { class: 'kpi-label' }, label), h('strong', {}, value), extra);

/** The home page: today at a glance, the company news, and what's coming up. */
function home(app: App, link: Link): HTMLElement {
  const { state } = app;
  const day = Math.min(state.day, DAYS);
  const price = BRRW[day - 1] ?? 0;
  const before = BRRW[day - 2] ?? price;
  const change = ((price - before) / before) * 100;
  const [lead, ...rest] = newsFor(state.day);
  const upcoming = NEWS.filter((p) => p.day > state.day && p.day <= DAYS).slice(0, 3);
  const hello = state.clock < 12 * 60 ? 'Good morning' : state.clock < 17 * 60 ? 'Good afternoon' : 'Good evening';
  const trend = h('span', { class: change >= 0 ? 'up' : 'down' }, icon(change >= 0 ? ArrowUpRight : ArrowDownRight, 13), `${Math.abs(change).toFixed(1)}%`);
  return portal(app, SECTIONS.home,
    pageHead(SECTIONS.home, 'Burrow Hub', `${hello}, Intern`, `${weekday(day)}, week ${weekOf(day)} · Burrow Hollow`),
    h('div', { class: 'kpis' },
      kpi('BRRW share price', `$${price.toFixed(2)}`, trend, 'stock'),
      kpi('Weather', WEATHER[day - 1] ?? 'Sunny'),
      kpi('Tickets you resolved today', String(state.today.resolved)),
      kpi('In the canteen', CANTEEN[(day - 1) % CANTEEN.length] ?? '')),
    h('div', { class: 'cols' },
      h('div', { class: 'col-main' },
        lead && card('Latest from Burrow', Megaphone, '#0176d3',
          h('article', { class: 'news-hero' }, picture(lead, true), h('div', { class: 'news-hero-text' }, h('h3', {}, lead.title), h('p', {}, lead.body), byline(lead)))),
        rest.length > 0 && card('More company news', Newspaper, '#3296ed',
          h('div', { class: 'news-grid' }, ...rest.map((p) => h('article', { class: 'news-story' }, picture(p), h('div', {}, h('h3', {}, p.title), h('p', {}, p.body), byline(p)))))),
        h('div', { class: 'feed-teaser' }, tile(MessagesSquare, SECTIONS.feed.colour), h('span', {}, 'What everyone’s talking about'), link('Go to Burrow Feed', `http://${HOST}/feed`, 'more'))),
      h('aside', { class: 'col-side' },
        upcoming.length > 0 && card('Coming up', CalendarDays, '#eb7092', h('ul', { class: 'lc-list' }, ...upcoming.map((p) => h('li', {}, h('strong', {}, weekday(p.day)), h('span', {}, p.title))))),
        card('Today at Burrow', Clock, '#0d9dda', h('ul', { class: 'lc-list' }, ...(TODAY[day - 1] ?? []).map((line) => h('li', {}, line)))),
        card('Markets', TrendingUp, '#2e844a',
          h('p', { class: 'stock-line' }, h('strong', {}, 'BRRW'), h('span', {}, `$${price.toFixed(2)}`), trend.cloneNode(true) as HTMLElement),
          sparkline(day),
          h('p', { class: 'stock-line small' }, h('span', {}, 'BIG OCEAN CORP'), h('span', {}, '$212.40'), h('span', { class: 'up' }, '▲ 0.3%'))))));
}

/** A post in Burrow Feed: who posted it, what they said, a picture if there is one, likes and a couple of comments. */
function feedPost(app: App, p: SocialPost): HTMLElement {
  const { ui } = app;
  const key = `${p.day}:${p.from}:${p.text.slice(0, 20)}`;
  const liked = (ui.liked ?? []).includes(key);
  const head = h('header', { class: 'post-head' });
  head.append(personLink(app, p.from, 40, false), h('div', {}, personLink(app, p.from), h('span', { class: 'meta' }, role(p.from, app.state.day)), h('span', { class: 'meta' }, when(p.day))));
  const comments = h('ul', { class: 'post-comments' }, ...p.comments.map(([who, said]) => {
    const li = h('li', {});
    li.append(portrait(who, 24), h('span', {}, h('strong', {}, who), ` ${said}`));
    return li;
  }));
  return h('article', { class: 'feed-post' }, head,
    h('p', {}, p.text),
    p.scene && h('div', { class: 'post-scene', 'aria-hidden': 'true' }, art(feedArt(p)?.id) ?? p.scene),
    h('p', { class: 'post-counts meta' }, `${p.likes + (liked ? 1 : 0)} likes · ${p.comments.length} comment${p.comments.length === 1 ? '' : 's'}`),
    h('div', { class: 'post-actions' },
      h('button', {
        class: `post-action${liked ? ' on' : ''}`, 'aria-pressed': liked ? 'true' : 'false', 'data-testid': 'like',
        onclick: () => { ui.liked = liked ? (ui.liked ?? []).filter((k) => k !== key) : [...(ui.liked ?? []), key]; app.rerender(); },
      }, icon(ThumbsUp, 14), liked ? 'Liked' : 'Like')),
    comments);
}

/** Burrow Feed: everyone's everyday posts, like a work social network for the company only. */
function feed(app: App, link: Link): HTMLElement {
  const { state } = app;
  const day = Math.min(state.day, DAYS);
  const staff = hrOn(day).filter((r) => r.status === 'active');
  const me = h('div', { class: 'feed-me' });
  me.append(portrait('IT', 56), h('strong', {}, 'Intern (you)'), h('span', { class: 'meta' }, `IT Intern at ${COMPANY}`), h('p', { class: 'meta' }, `Tickets resolved today: ${state.today.resolved}`));
  const company = h('div', { class: 'feed-me' });
  company.append(logo(40), h('strong', {}, COMPANY), h('span', { class: 'meta' }, `Office supplies · ${staff.length} people`));
  const team = h('ul', { class: 'feed-team' }, ...staff.filter((r) => r.login !== 'intern').slice(0, 8).map((r) => {
    const li = h('li', {});
    li.append(personLink(app, r.name, 28, false), h('span', {}, personLink(app, r.name), h('span', { class: 'meta' }, r.title)));
    return li;
  }));
  return portal(app, SECTIONS.feed,
    pageHead(SECTIONS.feed, 'Burrow Hub', 'Burrow Feed', 'What everyone at Burrow is up to'),
    h('div', { class: 'feed' },
      h('aside', { class: 'feed-left' }, card('You', Users, SECTIONS.people.colour, me), card('Your company', Building2, SECTIONS.about.colour, company)),
      h('section', { class: 'feed-main', 'aria-label': 'Burrow Feed' }, ...socialFor(state.day).map((p) => feedPost(app, p))),
      h('aside', { class: 'feed-right' }, card('People at Burrow', Users, SECTIONS.people.colour, team, link('See everyone', `http://${HOST}/people`, 'more')))));
}

/** People: everyone at Burrow from HR, as a list you'd sort and filter. */
function people(app: App): HTMLElement {
  const { state } = app;
  const day = Math.min(state.day, DAYS);
  const rows = hrOn(day).filter((r) => r.status === 'active').sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name));
  const cell = (r: (typeof rows)[number]) => h('td', {}, personLink(app, r.name, 24));
  return portal(app, SECTIONS.people,
    pageHead(SECTIONS.people, 'People', 'All staff', `${rows.length} people · Sorted by department · Straight from HR. If you’re not on here, talk to Otis.`),
    h('div', { class: 'lc lt-wrap' },
      h('table', { class: 'lt' },
        h('thead', {}, h('tr', {}, ...['Name', 'Title', 'Department', 'Right now', 'Phone'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', {}, ...rows.map((r) => h('tr', {}, cell(r), h('td', {}, r.title), h('td', {}, h('span', { class: 'pill' }, r.dept)),
          r.login === 'intern' ? h('td', { class: 'lt-now' }, 'At Sam’s old desk') : h('td', { class: 'lt-now', 'data-now': r.login }, statusText(r.login, day, state.clock)), h('td', {}, extension(r.employeeId))))))));
}

/** Everyone who's ever been on the HR file, by name: the login their profile lives under. "IT" posts are you. */
function loginOf(name: string): string | undefined {
  if (name === 'IT') return 'intern';
  return hrOn(DAYS).find((r) => r.name === name)?.login;
}

const extension = (employeeId: string) => `ext. ${200 + Number(employeeId.slice(-2))}`;

/**
 * A link to someone's profile: their name, or their small portrait when `size` is given (with `named` false, just the
 * portrait). Anyone without a profile is plain text.
 */
function personLink(app: App, name: string, size?: number, named = true): HTMLElement {
  const login = loginOf(name);
  const face = size ? portrait(name, size) : undefined;
  const label = named ? (face ? [face, name] : [name]) : face ? [face] : [];
  if (!login) return h('span', { class: 'person' }, ...label);
  return h('button', {
    class: 'person-link', 'aria-label': named ? undefined : `${name}’s profile`, onclick: () => go(app, `http://${HOST}/people/${login}`),
  }, ...label);
}

/** Someone's profile: who they are, where they are right now, how today's treating them, and what they've posted. */
function profile(login: string): Page {
  const row = hrOn(DAYS).find((r) => r.login === login);
  if (!row) return missing(`/people/${login}`);
  return {
    title: `${row.name} - Burrow Hub`,
    body: (app) => {
      const { state, ui } = app;
      const day = Math.min(state.day, DAYS);
      const now = hrOn(day).find((r) => r.login === login) ?? row;
      const here = now.status === 'active';
      const person = PEOPLE[login];
      const you = login === 'intern';
      const manager = hrOn(day).find((r) => r.employeeId === now.manager)?.name ?? '—';
      const painted = artFor(faceId(row.name));
      const face = portrait(row.name, 112);
      // Only here, on their own profile, can you open their photo and see it properly.
      const big = painted ? h('button', { class: 'profile-face', 'aria-label': `See ${row.name}’s photo full size`, onclick: () => { ui.viewing = login; app.rerender(); } }, face) : h('span', { class: 'profile-face' }, face);
      const posts = socialFor(state.day).filter((p) => loginOf(p.from) === login).slice(0, 3);
      const detail = (k: string, v: string) => [h('dt', {}, k), h('dd', {}, v)];
      return portal(app, SECTIONS.people,
        h('section', { class: 'ph profile-head' }, big,
          h('div', { class: 'ph-text' }, h('p', { class: 'ph-eyebrow' }, 'People'), h('h1', {}, row.name), h('p', { class: 'ph-sub' }, `${now.title} · ${now.dept}`)),
          h('span', { class: `presence${here ? '' : ' gone'}`, 'data-now': you ? undefined : login }, you ? 'That’s you' : statusText(login, day, state.clock))),
        h('div', { class: 'cols' },
          h('div', { class: 'col-main' },
            !you && card('Right now', Clock, '#0d9dda',
              h('p', { class: 'now', 'data-now': login }, statusText(login, day, state.clock)),
              h('p', { class: 'quote', 'data-say': login }, `“${sayNow(login, state)}”`)),
            card('About', User, SECTIONS.people.colour, h('p', {}, you ? 'The new IT intern. Unpaid, keen, and sitting at Sam’s old desk. Fixing printers, writing the runbook Sam never did, and looking for a way out.' : person?.about ?? '')),
            posts.length > 0 && card(`Recent posts by ${row.name}`, MessagesSquare, SECTIONS.feed.colour,
              h('ul', { class: 'lc-list' }, ...posts.map((p) => h('li', {}, h('strong', {}, when(p.day)), h('span', {}, p.text)))))),
          h('aside', { class: 'col-side' },
            !you && here && card('Today', CloudSun, '#eb7092', h('p', {}, moodWords(login, day))),
            card('Details', IdCard, '#3a49da', h('dl', { class: 'details' },
              ...detail('Title', now.title), ...detail('Department', now.dept), ...detail('Manager', manager),
              ...detail('Phone', extension(now.employeeId)), ...detail('Employee ID', now.employeeId), ...(here ? [] : detail('Status', 'Left the company')))),
            person && person.routine.length > 0 && card('A usual day', CalendarDays, '#7f56d9',
              h('ul', { class: 'lc-list routine' }, ...person.routine.map((r) => h('li', {}, h('strong', {}, r.at), h('span', {}, r.where))))))));
    },
  };
}

/** Someone's photo full size, over the page. Esc, the close button or a click outside the photo puts it away. */
function viewer(app: App, login: string): HTMLElement | undefined {
  const row = hrOn(DAYS).find((r) => r.login === login);
  const painted = row && artFor(faceId(row.name));
  if (!row || !painted) return undefined;
  const close = () => { app.ui.viewing = undefined; app.rerender(); };
  return h('div', {
    class: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${row.name}’s photo`,
    onclick: (e) => { if (e.target === e.currentTarget) close(); },
    // Esc puts the photo away, and only the photo: the window would close on it too.
    onkeydown: (e) => { if ((e as KeyboardEvent).key === 'Escape') { e.stopPropagation(); close(); } },
  },
    h('figure', {}, h('img', { src: import.meta.env.BASE_URL + (painted.large ?? painted.image), alt: row.name }), h('figcaption', {}, h('strong', {}, row.name), ` · ${row.title}`)),
    h('button', { class: 'viewer-close', 'aria-label': 'Close', 'data-autofocus': true, onclick: close }, icon(X, 18)));
}

function itHelp(app: App): HTMLElement {
  return portal(app, SECTIONS.it,
    pageHead(SECTIONS.it, 'IT Help', 'Need something fixed?', 'Log a ticket. That’s how it gets fixed, and it’s how we know what keeps breaking. The IT team (one intern) will reply as soon as they can.',
      h('button', { class: 'lb brand', onclick: () => openApp(app, 'desk') }, icon(Ticket, 14), 'Open the Service Desk')),
    h('div', { class: 'cols' },
      h('div', { class: 'col-main' }, card('How IT handles things', ShieldCheck, '#3a49da', h('ol', { class: 'policy-list' }, ...POLICY.map((rule) => h('li', {}, rule))))),
      h('aside', { class: 'col-side' }, card('Your password', KeyRound, '#d83a00', h('p', {}, 'Nobody from IT will ever ask for your password. Not even nicely. Not even Mr. Grisby.')))));
}

function about(app: App): HTMLElement {
  return portal(app, SECTIONS.about,
    pageHead(SECTIONS.about, 'About', COMPANY, 'Supplies, sundries & good intentions since 1987'),
    h('div', { class: 'cols' },
      h('div', { class: 'col-main' },
        card('Our story', Building2, SECTIONS.about.colour,
          h('p', {}, 'Burrow & Co. began in 1987 in a garden shed in Burrow Hollow, when a young Mr. Grisby started selling stationery, string and “useful odds and ends” to the businesses on the high street.'),
          h('p', {}, 'Today we supply offices across the valley with paper, pens, printers (and, increasingly, apologies about printers). We’re a small team who care about doing things properly, eventually.'),
          h('p', { class: 'values' }, 'Our values: Be helpful. Be honest. Log a ticket.'))),
      h('aside', { class: 'col-side' },
        card('Burrow through the years', History, '#7f56d9', h('ol', { class: 'history' }, ...HISTORY.map(([year, what]) => h('li', {}, h('strong', {}, year), h('span', {}, what))))))));
}

/** Search results: the intranet pages that mention it. The wider web is blocked. */
function search(q: string): Page {
  const pages: [Section, string][] = [[SECTIONS.home, 'news announcements share price weather canteen'], [SECTIONS.feed, 'feed posts birthday cake kudos stapler'],
    [SECTIONS.people, 'people staff directory phone extension'], [SECTIONS.it, 'it help password ticket policy printer'], [SECTIONS.about, 'about history company 1987']];
  const hits = pages.filter(([s, words]) => `${s.label} ${words}`.toLowerCase().includes(q.toLowerCase()));
  return {
    title: `${q} - Burrow Hub Search`,
    body: (app) => portal(app, undefined,
      h('section', { class: 'ph' }, tile(Search, '#54698d', true), h('div', { class: 'ph-text' }, h('p', { class: 'ph-eyebrow' }, 'Search results'), h('h1', {}, `“${q}”`))),
      h('div', { class: 'lc' }, h('ul', { class: 'results' },
        ...(hits.length ? hits.map(([s]) => h('li', {}, h('button', { class: 'result', onclick: () => go(app, `http://${HOST}${s.path}`) }, tile(s.icon, s.colour),
          h('span', {}, h('strong', {}, s.label), h('span', { class: 'meta' }, `${HOST}${s.path}`))))) : [h('li', { class: 'meta' }, 'Nothing on the intranet matches that.')]),
        h('li', { class: 'meta' }, 'Results from the wider web are hidden: internet access is limited during the budget freeze.')))),
  };
}

const PAGES: Record<string, Page> = {
  '/': { title: 'Burrow Hub', body: home },
  '/feed': { title: 'Burrow Feed - Burrow Hub', body: feed },
  '/people': { title: 'People - Burrow Hub', body: people },
  '/it': { title: 'IT Help - Burrow Hub', body: itHelp },
  '/about': { title: 'About - Burrow Hub', body: about },
};

const missing = (path: string): Page => ({
  title: 'Can’t reach this page',
  body: () => h('div', { class: 'ridge-error' }, h('p', { class: 'glyph' }, '\u{1F615}'), h('h1', {}, 'Hmm… can’t reach this page'), h('p', {}, `${HOST}${path} doesn’t exist on the intranet.`)),
});

function pageAt(url: string): Page {
  const q = searchText(url);
  if (q !== undefined) return search(q);
  const match = /^[a-z]+:\/\/([^/]+)(\/[^?#]*)?/i.exec(url);
  const host = match?.[1]?.toLowerCase() ?? '';
  const path = (match?.[2] ?? '/').replace(/\/+$/, '') || '/';
  if (host === HOST) {
    const person = /^\/people\/([a-z]+)$/.exec(path)?.[1];
    return PAGES[path] ?? (person ? profile(person) : missing(path));
  }
  return {
    title: 'Blocked',
    body: () => h('div', { class: 'ridge-error' }, h('p', { class: 'glyph' }, '⛔'), h('h1', {}, 'This site is blocked'),
      h('p', {}, `${host || url} isn’t on the list. ${COMPANY} internet policy: intranet only during the budget freeze.`)),
  };
}

/** What was searched for, readable, if this address is a search. */
function searchText(url: string): string | undefined {
  if (!url.startsWith('ridge://search?q=')) return undefined;
  const q = url.slice('ridge://search?q='.length);
  try { return decodeURIComponent(q); } catch { return q; }
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
  const address = h('input', { class: 'ridge-address', name: 'address', value: searchText(url) ?? url, 'aria-label': 'Address', autocomplete: 'off', 'data-testid': 'ridge-address' }) as HTMLInputElement;
  return h('div', { class: 'ridge', 'data-testid': 'browser' },
    h('div', { class: 'ridge-tabs', role: 'tablist' },
      ...all.map((t, i) => h('span', { class: `ridge-tab${i === ui.tab ? ' on' : ''}` },
        h('button', { class: 'ridge-tab-name', role: 'tab', 'aria-selected': i === ui.tab ? 'true' : 'false', onclick: () => { ui.tab = i; app.rerender(); } },
          pageAt(urlOf(t)).title.replace(/ - Burrow Hub$/, '')),
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
    // A different page in this tab starts at the top; the same page keeps its place when the screen redraws.
    h('div', { class: 'ridge-page', 'data-scroll-key': `${ui.tab}:${url}` }, pageAt(url).body(app, link)),
    ui.viewing && url.endsWith(`/people/${ui.viewing}`) && viewer(app, ui.viewing),
  );
}
