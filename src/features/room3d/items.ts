/**
 * What clicking something in the room does: sit at it, press it, tap it, look at it (a line of text),
 * pick it up and turn it over, or a little action of its own.
 */
export type ItemKind = 'computer' | 'power' | 'mouse' | 'wall' | 'look' | 'pickup' | 'spin' | 'sway' | 'lamp' | 'sip' | 'drawer';

export interface RoomItem {
  id: string;
  label: string;
  kind: ItemKind;
  says: (day: number) => string;
}

export const SAM_NOTE = [
  'Hi. I’m Sam. I kept this place running for six years. I quit. Sorry.',
  'Password is “password”. Nobody ever changed it.',
  'The runbook is mostly wrong. Fix it as you go.',
  'Why people liked me: I never guessed. Three things, every time. 1. Gather context. 2. Isolate & divide. 3. Test the simplest fix. Talk it through with the duck.',
  'Send people updates, or they will come and find you.',
  'Grisby will say you’ll get paid. Get it in writing.',
  'Be nice to Dot. Good luck.',
];

export const ROOM_ITEMS: RoomItem[] = [
  { id: 'computer', label: 'The computer', kind: 'computer', says: () => 'Sam’s old computer. It hums like it’s thinking about it.' },
  { id: 'monitor-note', label: 'Sam’s note on the monitor', kind: 'pickup', says: () => `${SAM_NOTE.join(' ')} P.S. Power button\u2019s on the case, bottom right. It takes AGES to boot. \u2013 S` },
  { id: 'power', label: 'Power button', kind: 'power', says: () => 'A chunky power button on the beige case, under the monitor.' },
  { id: 'mouse', label: 'The mouse', kind: 'mouse', says: () => 'A beige two-button ball mouse. The ball needs cleaning. It always needs cleaning.' },
  { id: 'lamp', label: 'Desk lamp', kind: 'lamp', says: () => 'Sam’s brass desk lamp.' },
  { id: 'wall', label: 'The wall', kind: 'wall', says: () => 'Pegboard, shelves, a calendar and Sam’s sticky notes.' },
  { id: 'runbook', label: 'The old runbook', kind: 'pickup', says: () => 'The IT runbook. Fat with pages, tabbed by topic. Half of them are wrong. Some are missing. One is just a coffee stain. Sam wrote \u201Cmostly wrong\u201D on the cover.' },
  { id: 'notes', label: 'Sam’s wall of notes', kind: 'look', says: () => 'Six years of forms and sticky notes. \u201CDON\u2019T reboot srv on Tues.\u201D \u201Cpw: password \u2013 never\u201D. Noted.' },
  { id: 'calendar', label: 'Calendar', kind: 'look', says: () => 'Sam crossed off every day this month. The last one is circled in red: \u201CFREEDOM\u201D.' },
  { id: 'mug', label: 'Sam’s mug', kind: 'sip', says: () => 'WELL, SHIT.' },
  { id: 'tray', label: 'Ticket tray', kind: 'look', says: () => 'The ticket tray. Empty for now. It won’t stay that way.' },
  { id: 'plant', label: 'Plant', kind: 'sway', says: () => 'The leaves bob about. Mostly alive. Sam watered it on Fridays.' },
  { id: 'phone', label: 'Where the phone was', kind: 'look', says: (day) => (day >= 16 ? 'A clean rectangle in the dust where a phone used to be. The new ones are in the top drawer.' : 'A clean rectangle in the dust where a phone used to be. Budget cuts.') },
  { id: 'binders', label: 'Sam’s old binders', kind: 'look', says: () => 'Sam’s binders: \u201CPrinters 2016\u201D, \u201CPrinters 2017\u201D, \u201CPrinters (other)\u201D.' },
  { id: 'drawer', label: 'Top drawer', kind: 'drawer', says: (day) => (day >= 16 ? 'The box of company phones, in their cardboard tray. Pick one up.' : 'Sam\u2019s drawer: a takeaway menu and some rubber bands. Not much else.') },
  { id: 'chair', label: 'Sam’s chair', kind: 'spin', says: () => 'It squeaks round. It still leans slightly to the left.' },
];

/** Things on the wall, which you click once you've walked up to it. */
export const ON_THE_WALL = ['notes', 'calendar', 'binders'];

/** What Sam's coffee tastes like, sip by sip, until it's gone. */
export const SIPS = [
  'You sip Sam\u2019s coffee. It\u2019s stone cold.',
  'Another sip. You try not to think about how old it is.',
  'Still cold. Still coffee. Probably.',
  'Last of it. WELL, SHIT. says the mug.',
];
