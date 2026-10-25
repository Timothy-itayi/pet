/**
 * Oktopus Workflows: the flow list, and the editor, laid out like Okta Workflows. Cards sit in a row; each card's
 * output fields are pills you drag (or click) onto a later card's input slots, and wires show what feeds what.
 * Test runs the flow on Sam Sample and shows every card's values; the switch turns it on for real.
 */
import { MINUTES_A_DAY } from '../game/directory.ts';
import {
  addCard, CARDS, deleteFlow, newFlow, removeCard, renameFlow, setInput, switchFlow, testFlow, TRIGGERS,
  type Card, type CardGroup, type CardKind, type Flow, type FlowRun, type Trigger,
} from '../game/flows.ts';
import type { App } from './app.ts';
import { clockText, h } from './dom.ts';

const stamp = (at: number) => `Day ${Math.floor(at / MINUTES_A_DAY)}, ${clockText(at % MINUTES_A_DAY)}`;
const groupClass = (g: CardGroup) => `g-${g.toLowerCase().replace(/\s+/g, '-')}`;
const titleOf = (flow: Flow, card: Card) => (card.kind === 'event' ? TRIGGERS[flow.trigger] : CARDS[card.kind].title);

/** The list of flows, and a way to start a new one. */
function list(app: App): HTMLElement {
  const { state, ui } = app;
  const { flows, runs } = state.okta;
  const trigger = h('select', { name: 'trigger', 'aria-label': 'Starts when', 'data-testid': 'flow-trigger' },
    ...(Object.entries(TRIGGERS) as [Trigger, string][]).map(([id, label]) => h('option', { value: id }, label))) as HTMLSelectElement;
  const name = h('input', { name: 'name', placeholder: 'Name, e.g. New starters', autocomplete: 'off', 'aria-label': 'Flow name', 'data-testid': 'flow-name' }) as HTMLInputElement;
  return h('div', { class: 'okta-page', 'data-testid': 'flows' },
    h('h1', {}, 'Workflows'),
    h('p', { class: 'meta' }, 'Automate the jobs HR keeps giving you. A flow starts when something changes in HR, then each card does one thing with what the cards before it found.'),
    h('section', { class: 'okta-card' },
      flows.length === 0 ? h('p', { class: 'okta-empty' }, 'No flows yet.')
        : h('table', { class: 'okta-table' },
          h('thead', {}, h('tr', {}, ...['Flow', 'Starts when', 'Status', 'Last run', ''].map((c) => h('th', {}, c)))),
          h('tbody', {}, ...flows.map((f) => {
            const last = runs.filter((r) => r.flow === f.id && !r.test).at(-1);
            return h('tr', {},
              h('td', {}, h('button', { class: 'okta-link', 'data-testid': `flow-open-${f.id}`, onclick: () => { ui.flowOpen = f.id; ui.flowTest = undefined; app.rerender(); } }, f.name)),
              h('td', {}, TRIGGERS[f.trigger]),
              h('td', {}, h('span', { class: `okta-status ${f.on ? 'on' : 'off'}` }, f.on ? 'On' : 'Off')),
              h('td', {}, last ? `${stamp(last.at)}: ${last.subject}${last.steps.some((x) => x.error) ? ' (failed)' : ''}` : 'Never'),
              h('td', {}, h('button', { class: 'okta-btn small', onclick: () => app.set(deleteFlow(state, f.id)) }, 'Delete')));
          })))),
    h('form', { class: 'okta-form', onsubmit: (e) => {
      e.preventDefault();
      const next = newFlow(state, trigger.value as Trigger, name.value);
      ui.flowOpen = next.okta.flows.at(-1)?.id;
      app.set(next);
    } }, h('span', {}, 'New flow, starts when'), trigger, name, h('button', { class: 'okta-btn primary', type: 'submit', 'data-testid': 'flow-new' }, 'Create flow')));
}

/** Where a card goes: the "+" between cards opens this. */
function palette(app: App, flow: Flow, at: number): HTMLElement {
  const groups = ['Object', 'Function', 'Action', 'Flow control'] as const;
  const kinds = (g: CardGroup) => (Object.entries(CARDS) as [CardKind, (typeof CARDS)[CardKind]][]).filter(([, c]) => c.group === g);
  const after = flow.cards[at - 1];
  return h('div', { class: 'flow-palette', role: 'dialog', 'aria-label': 'Add a card', 'data-testid': 'flow-palette' },
    h('p', { class: 'flow-palette-title' }, `Add a card after \u201C${after ? titleOf(flow, after) : 'the start'}\u201D`),
    ...groups.map((g) => h('div', {}, h('p', { class: `flow-palette-group ${groupClass(g)}` }, g),
      ...kinds(g).map(([kind, c]) => h('button', {
        class: 'flow-palette-item', 'data-testid': `flow-add-${kind}`,
        onclick: () => { app.ui.flowAdd = undefined; app.set(addCard(app.state, flow.id, at, kind)); },
      }, c.title)))),
    h('button', { class: 'okta-btn small', 'data-autofocus': true, onclick: () => { app.ui.flowAdd = undefined; app.rerender(); } }, 'Cancel'));
}

/** One card: its header, its input slots, its output pills, and (after a test) what it saw. */
function cardView(app: App, flow: Flow, card: Card, index: number, step: FlowRun['steps'][number] | undefined): HTMLElement {
  const { state, ui } = app;
  const spec = CARDS[card.kind];
  const connect = (name: string) => {
    const pick = ui.flowPick;
    if (!pick) return false;
    const next = setInput(state, flow.id, card.id, name, { wire: pick });
    ui.flowPick = undefined;
    ui.flowSaid = next === state ? 'Wires only go left to right: from a card’s output to a card after it.' : undefined;
    ui.flowTest = undefined;
    if (next === state) app.rerender(); else app.set(next);
    return true;
  };
  const slot = ({ name, required }: { name: string; required?: true }) => {
    const input = card.inputs[name];
    const key = `${card.id}:${name}`;
    const typing = ui.flowTyping === key;
    const clear = h('button', { class: 'flow-x', 'aria-label': `Clear ${name}`, onclick: (e) => { e.stopPropagation(); app.set(setInput(state, flow.id, card.id, name, undefined)); } }, '×');
    let body: HTMLElement;
    if (input && 'wire' in input) {
      const from = flow.cards.find((c) => c.id === input.wire.card);
      body = h('button', { class: 'flow-slot wired', 'data-slot': key, 'data-testid': `slot-${key}`, onclick: () => connect(name) },
        h('span', { class: `flow-dot ${groupClass(from ? CARDS[from.kind].group : 'Event')}` }), input.wire.field, clear);
    } else if ((input && 'text' in input) || typing) {
      body = h('input', {
        class: 'flow-slot text', 'data-slot': key, 'data-testid': `slot-${key}`, value: input && 'text' in input ? input.text : '', 'aria-label': name,
        'data-autofocus': typing, autocomplete: 'off',
        onchange: (e) => { ui.flowTyping = undefined; const v = (e.target as HTMLInputElement).value; app.set(setInput(state, flow.id, card.id, name, v ? { text: v } : undefined)); },
        onkeydown: (e) => { if ((e as KeyboardEvent).key === 'Escape') { e.stopPropagation(); ui.flowTyping = undefined; app.rerender(); } },
      });
    } else {
      body = h('button', {
        class: `flow-slot empty${ui.flowPick ? ' ready' : ''}`, 'data-slot': key, 'data-testid': `slot-${key}`,
        onclick: () => { if (!connect(name)) { ui.flowTyping = key; app.rerender(); } },
      }, ui.flowPick ? `Wire ${ui.flowPick.field} here` : 'Click or drop here (or type)');
    }
    return h('div', { class: 'flow-input' }, h('span', { class: 'flow-label' }, name, required && h('span', { class: 'flow-req', 'aria-label': 'required' }, '*')), body);
  };
  const pill = (field: string) => {
    const picked = ui.flowPick?.card === card.id && ui.flowPick.field === field;
    return h('button', {
      class: `flow-pill${picked ? ' picked' : ''}`, 'data-out': `${card.id}:${field}`, 'data-testid': `out-${card.id}:${field}`, 'aria-pressed': picked ? 'true' : 'false',
      onclick: () => { ui.flowPick = picked ? undefined : { card: card.id, field }; ui.flowSaid = undefined; app.rerender(); },
      // Drag a pill onto a slot: on letting go over one, wire it there.
      onpointerdown: (e) => {
        const down = e as PointerEvent;
        const up = (u: PointerEvent) => {
          removeEventListener('pointerup', up);
          if (Math.hypot(u.clientX - down.clientX, u.clientY - down.clientY) < 6) return;
          const target = (document.elementFromPoint(u.clientX, u.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-slot]');
          const [toCard, toName] = target?.dataset.slot?.split(':') ?? [];
          if (!toCard || !toName) return;
          const next = setInput(app.state, flow.id, toCard, toName, { wire: { card: card.id, field } });
          ui.flowPick = undefined;
          ui.flowSaid = next === app.state ? 'Wires only go left to right: from a card’s output to a card after it.' : undefined;
          ui.flowTest = undefined;
          if (next === app.state) app.rerender(); else app.set(next);
        };
        addEventListener('pointerup', up);
      },
    }, h('span', { class: 'flow-grip', 'aria-hidden': 'true' }, '⋮⋮'), field);
  };
  return h('article', { class: `flow-card ${groupClass(spec.group)}${step?.error ? ' failed' : ''}`, 'data-card': card.id, 'data-testid': `card-${card.id}` },
    h('header', { class: 'flow-card-head' },
      h('span', { class: 'flow-card-group' }, spec.group),
      h('strong', {}, titleOf(flow, card)),
      index > 0 && h('button', { class: 'flow-x', 'aria-label': `Remove ${spec.title}`, 'data-testid': `remove-${card.id}`, onclick: () => app.set(removeCard(state, flow.id, card.id)) }, '×')),
    spec.inputs.length > 0 && h('div', { class: 'flow-inputs' }, ...spec.inputs.map(slot)),
    spec.outputs.length > 0 && h('div', { class: 'flow-outputs' }, ...spec.outputs.map(pill)),
    step && h('div', { class: 'flow-step' },
      step.error ? h('p', { class: 'flow-error', role: 'alert' }, step.error) : step.note && h('p', { class: 'meta' }, step.note),
      Object.keys(step.values).length > 0 && h('dl', { class: 'flow-values' }, ...Object.entries(step.values).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]))));
}

/** A point inside the canvas, in its own layout (not the screen's): correct even on the tilted monitor. */
function within(el: HTMLElement, canvas: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (let at: HTMLElement | null = el; at && at !== canvas; at = at.offsetParent as HTMLElement | null) { x += at.offsetLeft; y += at.offsetTop; }
  return { x, y };
}

/** The wires: a curve from each output pill to every slot it feeds. */
function drawWires(canvas: HTMLElement, svg: SVGSVGElement, flow: Flow): void {
  svg.setAttribute('width', String(canvas.scrollWidth));
  svg.setAttribute('height', String(canvas.scrollHeight));
  svg.replaceChildren();
  for (const card of flow.cards) {
    for (const [name, input] of Object.entries(card.inputs)) {
      if (!('wire' in input)) continue;
      const from = canvas.querySelector<HTMLElement>(`[data-out="${input.wire.card}:${input.wire.field}"]`);
      const to = canvas.querySelector<HTMLElement>(`[data-slot="${card.id}:${name}"]`);
      if (!from || !to) continue;
      const a = within(from, canvas);
      const b = within(to, canvas);
      const [x1, y1, x2, y2] = [a.x + from.offsetWidth, a.y + from.offsetHeight / 2, b.x, b.y + to.offsetHeight / 2];
      const bend = Math.max(30, (x2 - x1) / 2);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`);
      svg.append(path);
    }
  }
}

function editor(app: App, flow: Flow): HTMLElement {
  const { state, ui } = app;
  const show = ui.flowMappings ?? true;
  const test = ui.flowTest?.flow === flow.id ? ui.flowTest : undefined;
  const plus = (at: number) => h('div', { class: 'flow-plus-wrap' },
    h('button', { class: `flow-plus${ui.flowAdd === at ? ' on' : ''}`, 'aria-label': 'Add a card here', 'data-testid': `flow-plus-${at}`, onclick: () => { ui.flowAdd = ui.flowAdd === at ? undefined : at; app.rerender(); } }, '+'));
  const row = h('div', { class: 'flow-row' }, ...flow.cards.flatMap((c, i) => [cardView(app, flow, c, i, test?.steps.find((x) => x.card === c.id)), plus(i + 1)]));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'flow-wires');
  svg.setAttribute('aria-hidden', 'true');
  const canvas = h('div', {
    class: 'flow-canvas', 'data-testid': 'flow-canvas',
    onkeydown: (e) => { if ((e as KeyboardEvent).key === 'Escape' && ui.flowPick) { e.stopPropagation(); ui.flowPick = undefined; app.rerender(); } },
  }, svg, row);
  // Measure once the cards are on the page, and again if a card changes size.
  if (show) requestAnimationFrame(() => drawWires(canvas, svg, flow));
  const runs = state.okta.runs.filter((r) => r.flow === flow.id && !r.test).slice(-5).reverse();
  const nameBox = h('input', {
    class: 'flow-title', value: flow.name, 'aria-label': 'Flow name', autocomplete: 'off',
    onchange: (e) => app.set(renameFlow(state, flow.id, (e.target as HTMLInputElement).value)),
  });
  return h('div', { class: 'okta-page flow-editor', 'data-testid': 'flow-editor' },
    h('div', { class: 'flow-bar' },
      h('button', { class: 'okta-back', onclick: () => { ui.flowOpen = undefined; ui.flowPick = undefined; ui.flowTest = undefined; app.rerender(); } }, '← Flows'),
      nameBox,
      h('button', { class: 'okta-btn', 'data-testid': 'flow-test', onclick: () => { ui.flowTest = testFlow(state, flow).run; app.rerender(); } }, '▶ Test'),
      h('label', { class: 'flow-toggle' },
        h('input', { type: 'checkbox', checked: flow.on, 'data-testid': 'flow-on', onchange: () => app.set(switchFlow(state, flow.id, !flow.on)) }),
        flow.on ? 'Flow is ON' : 'Flow is OFF'),
      h('label', { class: 'flow-toggle' },
        h('input', { type: 'checkbox', checked: show, onchange: () => { ui.flowMappings = !show; app.rerender(); } }), 'Show mappings')),
    h('p', { class: `flow-hint${ui.flowSaid ? ' warn' : ''}`, role: 'status', 'data-testid': 'flow-hint' },
      ui.flowSaid ?? (ui.flowPick ? `Now click an input to wire ${ui.flowPick.field} into it. Esc to cancel.`
        : test ? (test.steps.some((x) => x.error) ? 'Test on Sam Sample: it stopped at a card. Its error is in red.' : 'Test on Sam Sample: every card ran. Check the values under each one.')
          : 'Drag an output onto an input, or click one then the other. Test it on Sam Sample before you switch it on.')),
    // Above the canvas, not in it: the canvas scrolls sideways and would cut the palette off.
    ui.flowAdd !== undefined && palette(app, flow, ui.flowAdd),
    canvas,
    h('section', { class: 'okta-card' },
      h('h2', {}, 'History'),
      runs.length === 0 ? h('p', { class: 'meta' }, 'It hasn’t run yet. Switched on, it runs first thing in the morning when HR changes.')
        : h('ul', { class: 'flow-history' }, ...runs.map((r) => h('li', {},
          h('strong', {}, `${stamp(r.at)}: ${r.subject}`),
          ` ${r.steps.find((x) => x.error)?.error ?? r.steps.map((x) => titleOf(flow, flow.cards.find((c) => c.id === x.card) ?? { id: '', kind: 'return', inputs: {} })).join(' → ')}`)))));
}

export function workflowsPage(app: App): HTMLElement {
  const flow = app.state.okta.flows.find((f) => f.id === app.ui.flowOpen);
  return flow ? editor(app, flow) : list(app);
}
