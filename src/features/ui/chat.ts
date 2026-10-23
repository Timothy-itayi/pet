import { CHAT_LATER, MAX_PUSHES, VILLAGERS } from '../game/data.ts';
import { newsFor } from '../game/news.ts';
import { askForTicket, canPush, goNow, later, moodName, ticketById, ticketState, type GameState } from '../game/rules.ts';
import type { Ticket } from '../game/types.ts';
import { face } from '../art/sprites.ts';
import type { App } from './app.ts';
import { dueText, urgent } from './desk.ts';
import { openApp } from './desktop.ts';
import { clockText, h } from './dom.ts';

/**
 * Burrow Chat, the company's chat app. #service-desk announces every new ticket; #general has the company news;
 * and people who'd rather not log a ticket message you directly.
 */

/** Today's tickets, in the order they turned up: what the Service Desk bot has posted in #service-desk. */
function announced(s: GameState): Ticket[] {
  return Object.keys(s.tickets).map(ticketById)
    .filter((t) => (t.via === 'tray' || ticketState(s, t.id).logged) && (t.day === s.day || s.queue.includes(t.id)))
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

/**
 * A direct message from someone who'd rather not log a ticket. Their face, DOOM-style, shows how they're taking it:
 * the longer you leave them, the crosser they look.
 */
function chatView(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const v = VILLAGERS[t.who];
  return h('article', { class: 'ticket-view chat-view', 'aria-label': `Chat with ${v.name}` },
    h('div', { class: 'ticket-info' },
      h('header', { class: 'chat-head' },
        h('figure', { class: `chat-face mood-${st.mood}` },
          h('img', { class: 'sprite', src: face(v, st.mood), alt: `${v.name}, looking ${moodName(st.mood).toLowerCase()}`, 'data-testid': 'chat-face' }),
          h('figcaption', {}, moodName(st.mood))),
        h('div', {},
          h('h2', {}, v.name),
          h('p', { class: 'meta' }, 'Direct message. Not a ticket.'),
          h('p', { class: `due${urgent(state, t.id) ? ' urgent' : ''}`, 'data-due': t.id }, dueText(state, t.id)))),
      h('ol', { class: 'conversation', 'data-testid': 'conversation' }, ...st.messages.map((m) =>
        h('li', { class: `msg ${m.from}` },
          h('span', { class: 'msg-meta' }, `${m.from === 'you' ? 'You' : v.name}, ${clockText(m.at)}`),
          h('span', {}, m.text))))),
    h('section', { class: 'decide', 'aria-label': 'Reply' },
      h('button', { class: 'btn primary', 'data-testid': 'go-now', onclick: () => app.set(goNow(state, t.id)) }, 'On my way'),
      h('button', { class: 'btn choice', 'data-testid': 'later', disabled: !canPush(state, t.id), onclick: () => app.set(later(state, t.id)) },
        h('strong', {}, 'Can it wait?'),
        h('span', {}, canPush(state, t.id) ? `They’ll message again in ${CHAT_LATER} minutes. ${MAX_PUSHES - st.pushes} left` : 'Not again')),
      h('button', { class: 'btn choice', 'data-testid': 'ask-ticket', onclick: () => app.set(askForTicket(state, t.id)) },
        h('strong', {}, 'Please log a ticket'),
        h('span', {}, 'They’ll be annoyed, but then it counts'))),
  );
}

export function chatApp(app: App): HTMLElement {
  const { state, ui } = app;
  if (ui.chat && !state.chats.includes(ui.chat)) ui.chat = undefined;
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
      ...(state.chats.length
        ? state.chats.map((id) => {
          const v = VILLAGERS[ticketById(id).who];
          return link(`● ${v.name}`, id === dm, go({ chat: id }), `chat-${id}`, h('span', { class: 'unread' }, '1'));
        })
        : [h('p', { class: 'chat-empty' }, 'Nobody. Suspiciously quiet.')])),
    dm ? chatView(app, ticketById(dm))
      : h('section', { class: 'chat-channel', 'aria-label': `#${channel}` },
        h('header', { class: 'chat-channel-head' }, h('strong', {}, `# ${channel}`),
          h('span', { class: 'meta' }, channel === 'general' ? 'Company news and announcements' : 'New tickets, posted by the Service Desk bot')),
        h('ol', { class: 'chat-feed' }, ...(channel === 'general' ? generalChannel(app) : serviceDeskChannel(app)))),
  );
}
