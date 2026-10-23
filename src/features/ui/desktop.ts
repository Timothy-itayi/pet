import { DAYS, MANAGER, VILLAGERS } from '../game/data.ts';
import { newsFor } from '../game/news.ts';
import { acceptOffer, goTo, isWeekOver, readNews, scriptFor } from '../game/rules.ts';
import { face } from '../art/sprites.ts';
import type { App, Panel } from './app.ts';
import { h, money } from './dom.ts';
import { panel } from './panels.ts';
import { leaveComputer } from './roomHud.ts';

const ICONS: { id: Panel; label: string; glyph: string }[] = [
  { id: 'inbox', label: 'Inbox', glyph: '✉' },
  { id: 'runbook', label: 'Runbook', glyph: '\u{1F4D6}' },
  { id: 'resume', label: 'resume.doc', glyph: '\u{1F4C4}' },
  { id: 'jobs', label: 'Job Board', glyph: '\u{1F4CC}' },
  { id: 'directory', label: 'Active Registry', glyph: '\u{1F5C2}' },
  { id: 'intranet', label: 'Burrow Intranet', glyph: '\u{1F310}' },
];

/** Unread posts on the intranet: they pop up as a notification until you go and read them. */
function newsToast(app: App, unread: number): HTMLElement | false {
  const latest = newsFor(app.state.day)[0];
  if (!unread || !latest) return false;
  return h('button', { class: 'toast news-toast', 'data-testid': 'news-toast', onclick: () => openNews(app) },
    h('span', { class: 'meta' }, `Burrow Intranet \u00b7 ${unread} new`),
    h('strong', {}, latest.title));
}

function openNews(app: App): void {
  app.ui.panel = 'intranet';
  app.set(readNews(app.state, newsFor(app.state.day).length));
}

function notification(app: App): HTMLElement {
  const { state } = app;
  const weekOver = isWeekOver(state);
  const day = scriptFor(state.day);
  return h('aside', { class: 'toast', role: 'status', 'data-testid': 'notification' },
    h('img', { class: 'sprite small', src: face(VILLAGERS.grisby), alt: '' }),
    h('div', {},
      h('p', { class: 'meta' }, `${MANAGER} · now`),
      weekOver
        ? h('p', {}, 'The Conversation: great news! I can offer you a PAID position. Minimum wage. Same desk. Still no phone.')
        : h('p', {}, day.memo),
      !weekOver && day.rule && h('p', { class: 'rule' }, `NEW RULE: ${day.rule}`),
      weekOver && h('div', { class: 'row' },
        h('button', { class: 'btn', 'data-testid': 'accept-offer', onclick: () => app.set(acceptOffer(state)) }, 'Accept the offer'),
        h('button', { class: 'btn primary', onclick: () => { app.ui.panel = 'jobs'; app.rerender(); } }, 'Check the job board first')),
    ),
  );
}

export function desktopScreen(app: App): HTMLElement {
  const { state } = app;
  const open = (id: Panel) => { if (id === 'intranet') { openNews(app); return; } app.ui.panel = id; app.rerender(); };
  const weekOver = isWeekOver(state);
  const unread = newsFor(state.day).length - state.newsRead;
  return h('main', { class: 'screen desktop', 'data-testid': 'desktop' },
    h('nav', { class: 'icons', 'aria-label': 'Desktop' }, ...ICONS.map((i) =>
      h('button', { class: 'icon', 'data-testid': `icon-${i.id}`, onclick: () => open(i.id) },
        h('span', { class: 'glyph', 'aria-hidden': 'true' }, i.glyph), i.label,
        i.id === 'intranet' && unread > 0 && h('span', { class: 'unread', 'aria-label': `${unread} unread` }, String(unread))))),
    app.ui.panel && panel(app, app.ui.panel),
    notification(app),
    newsToast(app, unread),
    h('footer', { class: 'taskbar' },
      h('span', { class: 'start', 'aria-hidden': 'true' }, h('span', { class: 'start-logo' }), 'Start'),
      h('button', { class: 'btn small', 'data-testid': 'back-to-desk', onclick: () => leaveComputer(app) }, 'Back to desk'),
      h('span', { class: 'tray' },
        h('span', {}, weekOver ? 'Saturday' : `Day ${state.day} of ${DAYS}`),
        h('span', {}, `Savings ${money(state.savings)}`)),
      !weekOver && h('button', {
        class: 'btn primary', 'data-testid': 'clock-in', 'data-autofocus': !app.ui.panel,
        onclick: () => { app.ui.panel = undefined; app.set(goTo(state, 'desk')); },
      }, 'Open Service Desk'),
    ),
  );
}
