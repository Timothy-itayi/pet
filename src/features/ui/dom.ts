type Child = Node | string | number | false | null | undefined;
type Props = Record<string, string | number | boolean | ((e: Event) => void) | undefined>;

/** Tiny element builder: h('button', { class: 'x', onclick: fn }, 'Label'). */
export function h(tag: string, props: Props = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v !== undefined) el.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== false && c !== null && c !== undefined) el.append(c instanceof Node ? c : String(c));
  return el;
}

/** Minutes since midnight -> '9:05am'. */
export function clockText(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
}

export const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n)}`;
