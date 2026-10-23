import { VILLAGERS } from '../game/data.ts';
import { newsFor } from '../game/news.ts';
import { askForTicket, moodName, ticketById, ticketState, type GameState } from '../game/rules.ts';
import type { Ticket } from '../game/types.ts';
import { face } from '../art/sprites.ts';
import type { App } from './app.ts';
import { openApp } from './desktop.ts';
import { clockText, h } from './dom.ts';

/**
 * Burrow Chat, the company's chat app. #service-desk announces every new ticket; #general has the company news;
 * and people who'd rather not log a ticket message you directly.
 */

/** Today's tickets, in the order they turned up: what the Service Desk bot has posted in #service-desk. */
function announced(s: GameState): Ticket[] {
  return Object.keys(s.tickets).map(ticketById)
    .filter((t) => ticketState(s, t.id).logged && !s.arriving.some((a) => a.id === t.id) && (t.day === s.day || s.queue.includes(t.id)))
    .sort((a, b) => a.at.localeCompare(b.at, undefined, { numeric: true }));
}

function post(who: string, at: string, ...body: (HTMLElement | string | false)[]): HTMLElement {
  return h('li', { class: 'chat-post' },
    h('span', { class: 'chat-avatar', 'aria-hidden': 'true' }, who.slice(0, 1)),
    h('div', {}, h('p', { class: 'chat-who' }, h('strong', {}, who), h('span', { class: 'meta' }, at)), ...body));
}

function serviceDeskChannel(app: App): HTMLElement[] {
  const { state, ui } = app;
  const tickets = announced(state);
  if (!tickets.length) return [h('p', { class: 'chat-empty' }, 'No tickets yet today. The Service Desk bot is waiting.')];
  return tickets.map((t) => {
    const waiting = state.queue.includes(t.id);
    return post('Service Desk', t.at, h('p', {}, `\u{1F3AB} New ticket from ${VILLAGERS[t.who].name}: `, h('strong', {}, t.title)),
      waiting
        ? h('button', { class: 'btn small', 'data-testid': `open-ticket-${t.id}`, onclick: () => { ui.selected = t.id; openApp(app, 'desk'); } }, 'Open in Service Desk')
        : h('p', { class: 'meta' }, ticketState(state, t.id).status === 'resolved' ? '✔ Resolved' : 'Set to pending'));
  });
}

const generalChannel = (app: App) => newsFor(app.state.day).reverse().map((p) => post(p.from, `Day ${p.day}`, h('p', {}, h('strong', {}, p.title)), h('p', {}, p.body)));

/** Where a conversation stands once you've answered it. */
function after(app: App, t: Ticket): HTMLElement | false {
  const { state, ui } = app;
  const st = ticketState(state, t.id);
  if (state.chats.includes(t.id)) return false;
  if (st.status === 'resolved') return h('p', { class: 'chat-status' }, '\u2714 Resolved');
  if (state.queue.includes(t.id)) {
    return h('p', { class: 'chat-status' }, 'Logged as a ticket. ',
      h('button', { class: 'btn small', 'data-testid': `dm-open-${t.id}`, onclick: () => { ui.selected = t.id; openApp(app, 'desk'); } }, 'Open in Service Desk'));
  }
  if (state.arriving.some((a) => a.id === t.id)) return h('p', { class: 'chat-status' }, 'Logging a ticket\u2026 it\u2019ll land in your queue soon.');
  return h('p', { class: 'chat-status' }, 'Waiting until tomorrow.');
}

/**
 * A direct message from a friend, who'd rather not log a ticket. Their face shows how they're taking it.
 * The rule is still: every request is a ticket.
 */
function chatView(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const v = VILLAGERS[t.who];
  const open = state.chats.includes(t.id);
  return h('article', { class: 'chat-dm', 'aria-label': `Chat with ${v.name}` },
    h('header', { class: 'chat-head' },
      h('figure', { class: `chat-face mood-${st.mood}` },
        h('img', { class: 'sprite', src: face(v, st.mood), alt: `${v.name}, looking ${moodName(st.mood).toLowerCase()}`, 'data-testid': 'chat-face' }),
        h('figcaption', {}, moodName(st.mood))),
      h('div', {},
        h('h2', {}, v.name),
        h('p', { class: 'meta' }, 'Direct message. Not a ticket yet.'))),
    h('ol', { class: 'chat-feed', 'data-testid': 'conversation' }, ...st.messages.map((m) =>
      post(m.from === 'you' ? 'You' : v.name, clockText(m.at), h('p', {}, m.text)))),
    after(app, t),
    open && h('div', { class: 'chat-composer' },
      h('div', { class: 'chat-suggest', role: 'group', 'aria-label': 'Reply' },
        h('button', { class: 'chat-chip primary', 'data-testid': 'ask-ticket', onclick: () => app.set(askForTicket(state, t.id)) }, 'Please log a ticket')),
      h('input', { class: 'chat-input', disabled: true, placeholder: `Message ${v.name}\u2026`, 'aria-label': `Message ${v.name}` })),
  );
}

/** Everyone who's messaged you today, the ones still waiting first. */
function conversations(s: GameState): Ticket[] {
  const waiting = s.chats.map(ticketById);
  const earlier = Object.keys(s.tickets).map(ticketById)
    .filter((t) => ticketState(s, t.id).asked && !s.chats.includes(t.id) && (t.day === s.day || s.queue.includes(t.id)));
  return [...waiting, ...earlier];
}

export function chatApp(app: App): HTMLElement {
  const { state, ui } = app;
  const people = conversations(state);
  if (ui.chat && !people.some((t) => t.id === ui.chat)) ui.chat = undefined;
  const dm = ui.channel ? undefined : ui.chat ?? state.chats[0];
  const channel = dm ? undefined : ui.channel ?? 'service-desk';
  const go = (to: { channel?: 'general' | 'service-desk'; chat?: string }) => () => { ui.channel = to.channel; ui.chat = to.chat; app.rerender(); };
  const link = (label: string, on: boolean, onclick: () => void, testid: string, extra?: HTMLElement | false) =>
    h('button', { class: `chat-link${on ? ' on' : ''}`, 'aria-current': on ? 'true' : 'false', 'data-testid': testid, onclick }, label, extra ?? false);
  return h('div', { class: 'chat-app', 'data-testid': 'chat-app' },
    h('nav', { class: 'chat-side', 'aria-label': 'Channels and messages' },
      h('p', { class: 'chat-workspace' }, 'Burrow & Co.'),
      h('p', { class: 'chat-section' }, 'Channels'),
      link('# general', channel === 'general', go({ channel: 'general' }), 'channel-general'),
      link('# service-desk', channel === 'service-desk', go({ channel: 'service-desk' }), 'channel-service-desk'),
      h('p', { class: 'chat-section' }, 'Direct messages'),
      ...(people.length
        ? people.map((t) => {
          const waiting = state.chats.includes(t.id);
          return link(`${waiting ? '\u25CF' : '\u25CB'} ${VILLAGERS[t.who].name}`, t.id === dm, go({ chat: t.id }), `chat-${t.id}`,
            waiting && h('span', { class: 'unread' }, '1'));
        })
        : [h('p', { class: 'chat-empty' }, 'Nobody. Suspiciously quiet.')])),
    dm ? chatView(app, ticketById(dm))
      : h('section', { class: 'chat-channel', 'aria-label': `#${channel}` },
        h('header', { class: 'chat-channel-head' }, h('strong', {}, `# ${channel}`),
          h('span', { class: 'meta' }, channel === 'general' ? 'Company news and announcements' : 'New tickets, posted by the Service Desk bot')),
        h('ol', { class: 'chat-feed' }, ...(channel === 'general' ? generalChannel(app) : serviceDeskChannel(app)))),
  );
}
