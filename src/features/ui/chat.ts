import { CHANNEL_INFO, CHANNELS, personName, stampOf, unreadCount, visiblePosts, type Channel, type TalkChannel } from '../game/channels.ts';
import { VILLAGERS } from '../game/data.ts';
import { askForTicket, clockTime, moodName, ticketById, ticketState, type GameState } from '../game/rules.ts';
import type { Ticket } from '../game/types.ts';
import { portrait } from './portrait.ts';
import type { App } from './app.ts';
import { openIncident } from './desk.ts';
import { clockText, h } from './dom.ts';

/**
 * Burrow Chat, the company's chat app. #service-desk announces every new ticket; #general has the company news;
 * the department channels and #random are where the office talks (see channels.ts); and people who'd rather not
 * log a ticket, or have something to tell you, message you directly.
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
  const { state } = app;
  const tickets = announced(state);
  if (!tickets.length) return [h('p', { class: 'chat-empty' }, 'No tickets yet today. The Service Desk bot is waiting.')];
  return tickets.map((t) => {
    const waiting = state.queue.includes(t.id);
    return post('Service Desk', t.at, h('p', {}, `\u{1F3AB} New ticket from ${VILLAGERS[t.who].name}: `, h('strong', {}, t.title)),
      waiting
        ? h('button', { class: 'btn small', 'data-testid': `open-ticket-${t.id}`, onclick: () => openIncident(app, t.id) }, 'Open in Service Desk')
        : h('p', { class: 'meta' }, ticketState(state, t.id).status === 'resolved' ? '✔ Resolved' : 'Set to pending'));
  });
}

/** Yesterday's posts and today's so far, newest at the bottom, with a divider where the day changes. */
function talkChannel(app: App, channel: TalkChannel): HTMLElement[] {
  const { day, clock } = app.state;
  const posts = visiblePosts(day, clock, channel);
  if (!posts.length) return [h('p', { class: 'chat-empty' }, 'Quiet in here so far.')];
  return posts.flatMap((p, i) => [
    ...(p.day !== posts[i - 1]?.day && (p.day < day || i > 0) ? [h('li', { class: 'chat-divider' }, h('span', {}, p.day < day ? 'Yesterday' : 'Today'))] : []),
    post(personName(p.from), clockText(clockTime(p.at)), ...(p.title ? [h('p', {}, h('strong', {}, p.title))] : []), h('p', {}, p.text)),
  ]);
}

/** What a colleague has told you directly today. */
function pingView(app: App, name: string): HTMLElement {
  const { state } = app;
  return h('article', { class: 'chat-dm', 'aria-label': `Chat with ${name}` },
    h('header', { class: 'chat-head' },
      h('figure', { class: 'chat-face' }, portrait(name, 96)),
      h('div', {}, h('h2', {}, name), h('p', { class: 'meta' }, 'Direct message. Not a ticket.'))),
    h('ol', { class: 'chat-feed', 'data-testid': 'conversation', 'data-scroll-key': `dm:${name}` }, ...state.pings
      .filter((p) => p.day === state.day && p.from === name)
      .map((p) => post(name, clockText(p.at), h('p', {}, p.text)))));
}

const badge = (n: number) => h('span', { class: 'unread', 'aria-label': `${n} unread` }, String(n));

/** The last conversation drawn, so opening a different one starts at the bottom, where the newest is. */
let shownView = '';

/** Where a conversation stands once you've answered it. */
function after(app: App, t: Ticket): HTMLElement | false {
  const { state } = app;
  const st = ticketState(state, t.id);
  if (state.chats.includes(t.id)) return false;
  if (st.status === 'resolved') return h('p', { class: 'chat-status' }, '\u2714 Resolved');
  if (state.queue.includes(t.id)) {
    return h('p', { class: 'chat-status' }, 'Logged as a ticket. ',
      h('button', { class: 'btn small', 'data-testid': `dm-open-${t.id}`, onclick: () => openIncident(app, t.id) }, 'Open in Service Desk'));
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
        portrait(v.name, 96),
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
  const pingers = [...new Set(state.pings.filter((p) => p.day === state.day).map((p) => p.from))];
  if (ui.ping && !pingers.includes(ui.ping)) ui.ping = undefined;
  const ping = ui.channel ? undefined : ui.ping;
  const dm = ui.channel || ping ? undefined : ui.chat ?? state.chats[0];
  const channel = dm || ping ? undefined : ui.channel ?? 'service-desk';
  // Looking at a conversation (not just having it open behind another window) reads it.
  const front = ui.windows.at(-1);
  const view = channel ?? (ping ? `dm:${ping}` : `ticket:${dm}`);
  if (front?.id === 'chat' && !front.min && (channel || ping)) (ui.seen ??= {})[view] = stampOf(state.day, state.clock);
  const since = (key: string) => ui.seen?.[key];
  const go = (to: { channel?: Channel; chat?: string; ping?: string }) => () => { ui.channel = to.channel; ui.chat = to.chat; ui.ping = to.ping; app.rerender(); };
  const link = (label: string, on: boolean, onclick: () => void, testid: string, extra?: HTMLElement | false) =>
    h('button', { class: `chat-link${on ? ' on' : ''}`, 'aria-current': on ? 'true' : 'false', 'data-testid': testid, onclick }, label, extra ?? false);
  const channelLink = (c: Channel) => {
    const n = c === 'service-desk' ? 0 : unreadCount(state.day, state.clock, c, since(c));
    return link(`# ${c}`, c === channel, go({ channel: c }), `channel-${c}`, n > 0 && badge(n));
  };
  const pinged = (name: string) => {
    const n = state.pings.filter((p) => p.day === state.day && p.from === name && stampOf(p.day, p.at) > (since(`dm:${name}`) ?? stampOf(state.day, 0))).length;
    return link(`\u25CB ${name}`, name === ping, go({ ping: name }), `ping-${name}`, n > 0 && badge(n));
  };
  const root = h('div', { class: 'chat-app', 'data-testid': 'chat-app' },
    h('nav', { class: 'chat-side', 'aria-label': 'Channels and messages' },
      h('p', { class: 'chat-workspace' }, 'Burrow & Co.'),
      h('p', { class: 'chat-section' }, 'Channels'),
      ...CHANNELS.map(channelLink),
      h('p', { class: 'chat-section' }, 'Direct messages'),
      ...(people.length || pingers.length
        ? [...people.map((t) => {
          const waiting = state.chats.includes(t.id);
          return link(`${waiting ? '\u25CF' : '\u25CB'} ${VILLAGERS[t.who].name}`, t.id === dm, go({ chat: t.id }), `chat-${t.id}`, waiting && badge(1));
        }), ...pingers.map(pinged)]
        : [h('p', { class: 'chat-empty' }, 'Nobody. Suspiciously quiet.')])),
    ping ? pingView(app, ping)
      : dm ? chatView(app, ticketById(dm))
        : h('section', { class: 'chat-channel', 'aria-label': `#${channel}` },
          h('header', { class: 'chat-channel-head' }, h('strong', {}, `# ${channel}`), h('span', { class: 'meta' }, CHANNEL_INFO[channel ?? 'service-desk'])),
          h('ol', { class: 'chat-feed', 'data-scroll-key': view }, ...(channel && channel !== 'service-desk' ? talkChannel(app, channel) : serviceDeskChannel(app)))),
  );
  // Like real chat, a conversation opens at the bottom. shortcut: a feed scrolled to the very top snaps down on a redraw too; fine for a few dozen posts.
  const fresh = view !== shownView;
  shownView = view;
  requestAnimationFrame(() => {
    const feed = root.querySelector('.chat-feed');
    if (feed && (fresh || !feed.scrollTop)) feed.scrollTop = feed.scrollHeight;
  });
  return root;
}
