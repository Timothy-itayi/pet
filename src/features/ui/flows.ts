/**
 * Oktopus Workflows: the flow list, and the editor, laid out like Okta Workflows. Cards sit in a row; each card's
 * output fields are pills you drag (or click) onto a later card's input slots, and wires show what feeds what. Every
 * field shows its type; a person opens (▸) into their fields. Test runs the flow on Sam Sample and shows every card's
 * values, a helper's steps nested under the card that called it; the switch turns it on for real.
 */
import { createElement, List, Type, User, Users, type IconNode } from 'lucide';
import { MINUTES_A_DAY } from '../game/directory.ts';
import {
  addCard, CARDS, deleteFlow, firstError, inputProblem, newFlow, outputType, PERSON, removeCard, renameFlow, runNow, setHelper, setInput,
  setLabel, switchFlow, testFlow, TRIGGERS, TYPE_WORDS,
  type Card, type CardGroup, type CardKind, type FieldType, type Flow, type FlowRun, type Input, type Step, type Trigger,
} from '../game/flows.ts';
import type { App } from './app.ts';
import { clockText, h } from './dom.ts';

const stamp = (at: number) => `Day ${Math.floor(at / MINUTES_A_DAY)}, ${clockText(at % MINUTES_A_DAY)}`;
const groupClass = (g: CardGroup) => `g-${g.toLowerCase().replace(/\s+/g, '-')}`;
const titleOf = (flow: Flow, card: Card) => (card.kind === 'event' || card.kind === 'schedule' ? TRIGGERS[flow.trigger] : CARDS[card.kind].title);
const ICONS: Record<FieldType, IconNode> = { text: Type, person: User, people: Users, texts: List };
const typeIcon = (type: FieldType) => h('span', { class: `flow-type t-${type}`, title: TYPE_WORDS[type] },
  createElement(ICONS[type], { width: 13, height: 13, 'aria-hidden': 'true' }), h('span', { class: 'sr-only' }, TYPE_WORDS[type]));
const helpersOf = (state: App['state']) => state.okta.flows.filter((f) => f.trigger === 'helper');
const outcome = (r: FlowRun) => (firstError(r.steps) ? 'stopped at a card' : 'every card ran');

/** The flows, helpers apart (as Okta lists them), and a way to start a new one. */
function list(app: App): HTMLElement {
  const { state, ui } = app;
  const { flows, runs } = state.okta;
  const trigger = h('select', { name: 'trigger', 'aria-label': 'Starts when', 'data-testid': 'flow-trigger' },
    ...(Object.entries(TRIGGERS) as [Trigger, string][]).map(([id, label]) => h('option', { value: id }, label))) as HTMLSelectElement;
  const name = h('input', { name: 'name', placeholder: 'Name, e.g. New starters', autocomplete: 'off', 'aria-label': 'Flow name', 'data-testid': 'flow-name' }) as HTMLInputElement;
  const open = (f: Flow) => h('button', { class: 'okta-link', 'data-testid': `flow-open-${f.id}`, onclick: () => { ui.flowOpen = f.id; ui.flowTest = undefined; ui.flowSaid = undefined; app.rerender(); } }, f.name);
  // Deleting asks first: a flow and its history are gone for good.
  const remove = (f: Flow) => (ui.flowDeleting === f.id
    ? h('span', { class: 'okta-confirm', role: 'group', 'aria-label': `Delete ${f.name}?` },
      h('span', {}, 'Delete it, and its history?'),
      h('button', { class: 'okta-btn small danger', 'data-testid': `flow-delete-yes-${f.id}`, onclick: () => { ui.flowDeleting = undefined; app.set(deleteFlow(state, f.id)); } }, 'Yes, delete'),
      h('button', { class: 'okta-btn small', 'data-autofocus': true, onclick: () => { ui.flowDeleting = undefined; app.rerender(); } }, 'No'))
    : h('button', { class: 'okta-btn small', 'data-testid': `flow-delete-${f.id}`, onclick: () => { ui.flowDeleting = f.id; app.rerender(); } }, 'Delete'));
  const main = flows.filter((f) => f.trigger !== 'helper');
  const helpers = flows.filter((f) => f.trigger === 'helper');
  return h('div', { class: 'okta-page', 'data-testid': 'flows' },
    h('h1', {}, 'Workflows'),
    h('p', { class: 'meta' }, 'Automate the jobs HR keeps giving you. A flow starts when HR changes or every morning; each card does one thing with what the cards before it found. Helper flows are like functions: other flows call them, once for each person.'),
    h('section', { class: 'okta-card' },
      h('h2', {}, 'Flows'),
      main.length === 0 ? h('p', { class: 'okta-empty' }, 'No flows yet.')
        : h('table', { class: 'okta-table' },
          h('thead', {}, h('tr', {}, ...['Flow', 'Starts when', 'Status', 'Last run', ''].map((c) => h('th', {}, c)))),
          h('tbody', {}, ...main.map((f) => {
            const last = runs.filter((r) => r.flow === f.id && !r.test).at(-1);
            return h('tr', {},
              h('td', {}, open(f)),
              h('td', {}, TRIGGERS[f.trigger]),
              h('td', {}, h('span', { class: `okta-status ${f.on ? 'on' : 'off'}` }, f.on ? 'On' : 'Off')),
              h('td', {}, last ? `${stamp(last.at)}${last.subject ? `: ${last.subject}` : ''}${firstError(last.steps) ? ' (failed)' : ''}` : 'Never'),
              h('td', { class: 'okta-actions' },
                f.trigger === 'schedule' && h('button', { class: 'okta-btn small', 'data-testid': `flow-run-${f.id}`, onclick: () => app.set(runNow(state, f.id)) }, '▶ Run now'),
                remove(f)));
          })))),
    h('section', { class: 'okta-card' },
      h('h2', {}, 'Helper flows'),
      helpers.length === 0 ? h('p', { class: 'okta-empty' }, 'No helpers yet. A helper starts with a User, and For Each, Map or Call flow hands it one.')
        : h('ul', { class: 'flow-helpers' }, ...helpers.map((f) => h('li', {}, open(f), remove(f))))),
    h('form', { class: 'okta-form', onsubmit: (e) => {
      e.preventDefault();
      const next = newFlow(state, trigger.value as Trigger, name.value);
      ui.flowOpen = next.okta.flows.at(-1)?.id;
      ui.flowSaid = undefined;
      app.set(next);
    } }, h('span', {}, 'New flow, starts when'), trigger, name, h('button', { class: 'okta-btn primary', type: 'submit', 'data-testid': 'flow-new' }, 'Create flow')));
}

/** Where a card goes: the "+" between cards opens this. */
function palette(app: App, flow: Flow, at: number): HTMLElement {
  const groups = ['Object', 'Function', 'Action', 'List', 'Flow control'] as const;
  const kinds = (g: CardGroup) => (Object.entries(CARDS) as [CardKind, (typeof CARDS)[CardKind]][]).filter(([, c]) => c.group === g && !c.hidden);
  const after = flow.cards[at - 1];
  return h('div', { class: 'flow-palette', role: 'dialog', 'aria-label': 'Add a card', 'data-testid': 'flow-palette' },
    h('p', { class: 'flow-palette-title' }, `Add a card after “${after ? titleOf(flow, after) : 'the start'}”`,
      h('button', { class: 'okta-btn small', onclick: () => { app.ui.flowAdd = undefined; app.rerender(); } }, 'Cancel')),
    ...groups.map((g, gi) => h('div', {}, h('p', { class: `flow-palette-group ${groupClass(g)}` }, g),
      ...kinds(g).map(([kind, c], i) => h('button', {
        class: 'flow-palette-item', 'data-testid': `flow-add-${kind}`, 'data-autofocus': gi === 0 && i === 0,
        onclick: () => { app.ui.flowAdd = undefined; app.ui.flowTest = undefined; app.ui.flowScrollTo = at; app.set(addCard(app.state, flow.id, at, kind)); },
      }, c.title)))));
}

/** Wire or type into an input; when it doesn't fit, say why instead. */
function connect(app: App, flow: Flow, cardId: string, name: string, input: Input): void {
  const { ui } = app;
  const next = setInput(app.state, flow.id, cardId, name, input);
  ui.flowPick = undefined;
  ui.flowSaid = next === app.state ? inputProblem(flow, cardId, name, input) ?? 'That can’t go there.' : undefined;
  ui.flowTest = undefined;
  if (next === app.state) app.rerender(); else app.set(next);
}

/** What a run did, card by card; a helper's runs open underneath the card that called it. */
function stepsView(flows: Flow[], flow: Flow, steps: Step[], inline = false): HTMLElement[] {
  return steps.map((x) => {
    const card = flow.cards.find((c) => c.id === x.card);
    const helper = flows.find((f) => f.id === card?.helper);
    return h('div', { class: inline ? '' : `flow-history-step${x.error ? ' failed' : ''}` },
      !inline && h('strong', {}, card ? titleOf(flow, card) : 'A card since removed'),
      x.error ? h('p', { class: 'flow-error' }, x.error) : x.note && h('p', { class: 'meta' }, x.note),
      valuesView(x),
      ...(x.calls ?? []).map((r) => h('details', { class: 'flow-call' },
        h('summary', {}, `${helper?.name ?? 'Helper'} for ${r.subject || 'nobody'}: ${outcome(r)}${r.result !== undefined ? `, returned “${r.result}”` : ''}`),
        ...(helper ? stepsView(flows, helper, r.steps) : []))));
  });
}

const valuesView = (x: Step) => Object.keys(x.values).length > 0 && h('dl', { class: 'flow-values' }, ...Object.entries(x.values).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]));

/** One card: its header, its input slots, its output pills, and (after a test) what it saw. */
function cardView(app: App, flow: Flow, card: Card, index: number, step: Step | undefined): HTMLElement {
  const { state, ui } = app;
  const spec = CARDS[card.kind];
  const slot = ({ name, type, required }: { name: string; type: FieldType; required?: true }) => {
    const input = card.inputs[name];
    const key = `${card.id}:${name}`;
    const typing = ui.flowTyping === key;
    const clear = h('button', { class: 'flow-x', 'aria-label': `Clear ${name}`, onclick: (e) => { e.stopPropagation(); app.set(setInput(state, flow.id, card.id, name, undefined)); } }, '×');
    const pick = ui.flowPick;
    let body: HTMLElement;
    if (input && 'wire' in input) {
      const from = flow.cards.find((c) => c.id === input.wire.card);
      body = h('button', { class: 'flow-slot wired', 'data-slot': key, 'data-testid': `slot-${key}`, onclick: () => { if (pick) connect(app, flow, card.id, name, { wire: pick }); } },
        h('span', { class: `flow-dot ${groupClass(from ? CARDS[from.kind].group : 'Event')}` }), from?.kind === 'assign' ? from.label ?? 'Value' : input.wire.field.replace('.', ' › '), clear);
    } else if (type === 'text' && ((input && 'text' in input) || typing)) {
      body = h('input', {
        class: 'flow-slot text', 'data-slot': key, 'data-testid': `slot-${key}`, value: input && 'text' in input ? input.text : '', 'aria-label': name,
        'data-autofocus': typing, autocomplete: 'off',
        onchange: (e) => { ui.flowTyping = undefined; const v = (e.target as HTMLInputElement).value; app.set(setInput(state, flow.id, card.id, name, v ? { text: v } : undefined)); },
        onkeydown: (e) => { if ((e as KeyboardEvent).key === 'Escape') { e.stopPropagation(); ui.flowTyping = undefined; app.rerender(); } },
      });
    } else {
      body = h('button', {
        class: `flow-slot empty${pick ? ' ready' : ''}`, 'data-slot': key, 'data-testid': `slot-${key}`,
        onclick: () => {
          if (pick) connect(app, flow, card.id, name, { wire: pick });
          else if (type === 'text') { ui.flowTyping = key; app.rerender(); }
        },
      }, pick ? `Wire ${pick.field.split('.').at(-1) ?? ''} here` : type === 'text' ? 'Click or drop here (or type)' : `Drop ${TYPE_WORDS[type]} here`);
    }
    return h('div', { class: 'flow-input' }, h('span', { class: 'flow-label' }, name, required && h('span', { class: 'flow-req', 'aria-label': 'required' }, '*'), typeIcon(type)), body);
  };
  const pill = (field: string, label: string, type: FieldType, sub = false) => {
    const picked = ui.flowPick?.card === card.id && ui.flowPick.field === field;
    return h('button', {
      class: `flow-pill${picked ? ' picked' : ''}${sub ? ' sub' : ''}`, 'data-out': `${card.id}:${field}`, 'data-testid': `out-${card.id}:${field}`, 'aria-pressed': picked ? 'true' : 'false',
      onclick: () => { ui.flowPick = picked ? undefined : { card: card.id, field }; ui.flowSaid = undefined; app.rerender(); },
      // Drag a pill onto a slot: on letting go over one, wire it there.
      onpointerdown: (e) => {
        const down = e as PointerEvent;
        const up = (u: PointerEvent) => {
          removeEventListener('pointerup', up);
          if (Math.hypot(u.clientX - down.clientX, u.clientY - down.clientY) < 6) return;
          const target = (document.elementFromPoint(u.clientX, u.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-slot]');
          const [toCard, toName] = target?.dataset.slot?.split(':') ?? [];
          if (toCard && toName) connect(app, flow, toCard, toName, { wire: { card: card.id, field } });
        };
        addEventListener('pointerup', up);
      },
    }, h('span', { class: 'flow-grip', 'aria-hidden': 'true' }, '⋮⋮'), label, typeIcon(type));
  };
  const outputs = spec.outputs.flatMap(({ name, type }) => {
    const label = card.kind === 'assign' ? card.label ?? 'Value' : name;
    if (type !== 'person') return [pill(name, label, type)];
    // A person opens into their fields, like an object in Okta: wire the whole person, or one field.
    const key = `${card.id}:${name}`;
    const opened = ui.flowOpened?.includes(key) ?? false;
    const toggle = h('button', {
      class: 'flow-chevron', 'aria-expanded': opened ? 'true' : 'false', 'aria-label': `${opened ? 'Close' : 'Open'} ${name}`, 'data-testid': `open-${key}`,
      onclick: () => { ui.flowOpened = opened ? ui.flowOpened?.filter((k) => k !== key) : [...(ui.flowOpened ?? []), key]; app.rerender(); },
    }, opened ? '▾' : '▸');
    return [h('div', { class: 'flow-object' }, toggle, pill(name, name, type)), ...(opened ? PERSON.map((f) => pill(`${name}.${f}`, f, 'text', true)) : [])];
  });
  const helpers = helpersOf(state);
  const helperBox = spec.helper && h('div', { class: 'flow-helper' },
    h('p', { class: 'flow-section' }, 'Run this flow'),
    h('select', {
      class: 'flow-select', 'aria-label': 'Helper flow to run', 'data-testid': `helper-${card.id}`,
      onchange: (e) => {
        const v = (e.target as HTMLSelectElement).value;
        if (v === '+new') { const next = newFlow(state, 'helper', 'New_helper'); ui.flowOpen = next.okta.flows.at(-1)?.id; app.set(next); return; }
        ui.flowTest = undefined;
        app.set(setHelper(state, flow.id, card.id, v));
      },
    }, h('option', { value: '', selected: !card.helper }, 'Pick a helper flow…'),
    ...helpers.map((f) => h('option', { value: f.id, selected: card.helper === f.id }, f.name)),
    h('option', { value: '+new' }, '+ New helper')),
    card.kind !== 'call' && h('p', { class: 'flow-section' }, 'With the following values'),
    card.kind !== 'call' && h('div', { class: 'flow-input' }, h('span', { class: 'flow-label' }, 'User', typeIcon('person')),
      h('div', { class: 'flow-slot wired item' }, h('span', { class: 'flow-item' }, '→'), 'Item: each person in the list, one at a time')));
  const assignName = card.kind === 'assign' && h('div', { class: 'flow-input' }, h('span', { class: 'flow-label' }, 'Name it'),
    h('input', { class: 'flow-slot text', value: card.label ?? '', placeholder: 'e.g. Group', 'aria-label': 'Name for this value', autocomplete: 'off',
      onchange: (e) => app.set(setLabel(state, flow.id, card.id, (e.target as HTMLInputElement).value)) }));
  return h('article', { class: `flow-card ${groupClass(spec.group)}${step && firstError([step]) ? ' failed' : ''}`, 'data-card': card.id, 'data-testid': `card-${card.id}` },
    h('header', { class: 'flow-card-head' },
      h('span', { class: 'flow-card-group' }, spec.group),
      h('strong', {}, titleOf(flow, card)),
      index > 0 && h('button', { class: 'flow-x', 'aria-label': `Remove ${spec.title}`, 'data-testid': `remove-${card.id}`, onclick: () => { ui.flowTest = undefined; app.set(removeCard(state, flow.id, card.id)); } }, '×')),
    (spec.inputs.length > 0 || helperBox || assignName) && h('div', { class: 'flow-inputs' }, assignName, spec.helper && card.kind !== 'call' && h('p', { class: 'flow-section' }, 'For each item in this list'), ...spec.inputs.map(slot), helperBox),
    outputs.length > 0 && h('div', { class: 'flow-outputs' }, ...outputs),
    step && h('div', { class: 'flow-step' }, ...stepsView(app.state.okta.flows, flow, [step], true)));
}

/** A point inside the canvas, in its own layout (not the screen's): correct even on the tilted monitor. */
function within(el: HTMLElement, canvas: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (let at: HTMLElement | null = el; at && at !== canvas; at = at.offsetParent as HTMLElement | null) { x += at.offsetLeft; y += at.offsetTop; }
  return { x, y };
}

/** The wires: a curve from each output pill to every slot it feeds; from the closed person when a field's hidden. */
function drawWires(canvas: HTMLElement, svg: SVGSVGElement, flow: Flow): void {
  svg.setAttribute('width', String(canvas.scrollWidth));
  svg.setAttribute('height', String(canvas.scrollHeight));
  svg.replaceChildren();
  for (const card of flow.cards) {
    for (const [name, input] of Object.entries(card.inputs)) {
      if (!('wire' in input)) continue;
      const { card: c, field } = input.wire;
      const from = canvas.querySelector<HTMLElement>(`[data-out="${c}:${field}"]`) ?? canvas.querySelector<HTMLElement>(`[data-out="${c}:${field.split('.')[0] ?? ''}"]`);
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
  canvas.addEventListener('scroll', () => { ui.flowScrollX = canvas.scrollLeft; });
  requestAnimationFrame(() => {
    // Keep where you'd scrolled to; after adding a card, bring it (and the + after it) into view.
    const added = ui.flowScrollTo !== undefined ? row.children[ui.flowScrollTo * 2] as HTMLElement | undefined : undefined;
    canvas.scrollLeft = added ? added.offsetLeft + added.offsetWidth + 60 - canvas.clientWidth : ui.flowScrollX ?? 0;
    ui.flowScrollTo = undefined;
    // Measure once the cards are on the page.
    if (show) drawWires(canvas, svg, flow);
  });
  const runs = state.okta.runs.filter((r) => r.flow === flow.id && !r.test).slice(-5).reverse();
  const nameBox = h('input', {
    class: 'flow-title', value: flow.name, 'aria-label': 'Flow name', autocomplete: 'off',
    // Rename after the click that blurred the box has landed, so it doesn't swallow a click on Test.
    onchange: (e) => { const name = (e.target as HTMLInputElement).value; setTimeout(() => app.set(renameFlow(app.state, flow.id, name)), 150); },
  });
  const who = flow.trigger === 'schedule' ? 'Sam and Pat Sample' : 'Sam Sample';
  const helper = flow.trigger === 'helper';
  return h('div', { class: 'okta-page flow-editor', 'data-testid': 'flow-editor' },
    h('div', { class: 'flow-bar' },
      h('button', { class: 'okta-back', onclick: () => { ui.flowOpen = undefined; ui.flowPick = undefined; ui.flowTest = undefined; ui.flowSaid = undefined; ui.flowScrollX = 0; app.rerender(); } }, '← Flows'),
      nameBox,
      h('button', { class: 'okta-btn', 'data-testid': 'flow-test', onclick: () => { ui.flowTest = testFlow(state, flow).run; app.rerender(); } }, '▶ Test'),
      flow.trigger === 'schedule' && h('button', { class: 'okta-btn', 'data-testid': 'flow-run-now', onclick: () => { ui.flowTest = undefined; app.set(runNow(state, flow.id)); } }, 'Run now'),
      helper ? h('span', { class: 'meta' }, 'Runs when another flow calls it')
        : h('label', { class: 'flow-toggle' },
          h('input', { type: 'checkbox', checked: flow.on, 'data-testid': 'flow-on', onchange: () => app.set(switchFlow(state, flow.id, !flow.on)) }),
          flow.on ? 'Flow is ON' : 'Flow is OFF'),
      h('label', { class: 'flow-toggle' },
        h('input', { type: 'checkbox', checked: show, onchange: () => { ui.flowMappings = !show; app.rerender(); } }), 'Show mappings')),
    h('p', { class: `flow-hint${ui.flowSaid ? ' warn' : ''}`, role: 'status', 'data-testid': 'flow-hint' },
      ui.flowSaid ?? (ui.flowPick ? `Now click an input to wire ${ui.flowPick.field.split('.').at(-1) ?? ''} (${TYPE_WORDS[pickType(flow, ui.flowPick) ?? 'text']}) into it. Esc to cancel.`
        : test ? (firstError(test.steps) ? `Test on ${who}: it stopped at a card. Its error is in red.` : `Test on ${who}: every card ran. Check the values under each one. It\u2019s a rehearsal: nothing real was changed or posted.`)
          : 'Drag an output onto an input, or click one then the other. The icons say what each field holds: text, one person, or a list. Open a person (▸) for their fields.')),
    // Above the canvas, not in it: the canvas scrolls sideways and would cut the palette off.
    ui.flowAdd !== undefined && palette(app, flow, ui.flowAdd),
    canvas,
    h('section', { class: 'okta-card' },
      h('h2', {}, 'History'),
      runs.length === 0 ? h('p', { class: 'meta' }, helper ? 'Its runs show in the history of the flow that called it.' : 'It hasn’t run yet. Switched on, it runs first thing in the morning.')
        : h('ul', { class: 'flow-history' }, ...runs.map((r) => h('li', {}, h('details', {},
          h('summary', {}, h('strong', {}, `${stamp(r.at)}${r.subject ? `: ${r.subject}` : ''}`), `: ${outcome(r)}`),
          ...stepsView(state.okta.flows, flow, r.steps)))))));
}

const pickType = (flow: Flow, pick: { card: string; field: string }) => {
  const card = flow.cards.find((c) => c.id === pick.card);
  return card && outputType(card.kind, pick.field);
};

export function workflowsPage(app: App): HTMLElement {
  const flow = app.state.okta.flows.find((f) => f.id === app.ui.flowOpen);
  return flow ? editor(app, flow) : list(app);
}
