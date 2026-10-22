/** Things in the room you can look at, and what each one says. */
export type ItemKind = 'computer' | 'power' | 'mouse' | 'wall' | 'inspect';

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
  'Send people updates, or they will come and find you.',
  'Grisby will say you’ll get paid. Get it in writing.',
  'Be nice to Dot. Good luck.',
];

export const ROOM_ITEMS: RoomItem[] = [
  { id: 'computer', label: 'The computer', kind: 'computer', says: () => 'Sam’s old computer. It hums like it’s thinking about it.' },
  { id: 'monitor-note', label: 'Note on the monitor', kind: 'inspect', says: () => '\u201CPower button\u2019s on the case, bottom right. It takes AGES to boot. Go make a tea. \u2013 S\u201D' },
  { id: 'power', label: 'Power button', kind: 'power', says: () => 'A chunky power button on the beige case, under the monitor.' },
  { id: 'mouse', label: 'The mouse', kind: 'mouse', says: () => 'A beige two-button ball mouse. The ball needs cleaning. It always needs cleaning.' },
  { id: 'wall', label: 'The wall', kind: 'wall', says: () => 'Pegboard, shelves, a calendar and Sam’s sticky notes.' },
  { id: 'runbook', label: 'The old runbook', kind: 'inspect', says: () => 'A blue binder, fat with pages. Half of them are wrong. Some are missing. One is just a coffee stain.' },
  { id: 'notes', label: 'Sam’s sticky notes', kind: 'inspect', says: (day) => (day === 1 ? SAM_NOTE.join(' ') : `Sam’s notes, now with coffee rings. ${SAM_NOTE[3]}`) },
  { id: 'calendar', label: 'Calendar', kind: 'inspect', says: () => 'Sam crossed off every day this month. The last one is circled in red: “FREEDOM”.' },
  { id: 'mug', label: 'Mug', kind: 'inspect', says: () => 'WORLD’S OKAYEST IT PERSON. Sam left it behind. It’s yours now.' },
  { id: 'tray', label: 'Ticket tray', kind: 'inspect', says: () => 'The ticket tray. Empty for now. It won’t stay that way.' },
  { id: 'plant', label: 'Plant', kind: 'inspect', says: () => 'A plant. Mostly alive. Sam watered it on Fridays.' },
  { id: 'phone', label: 'Where the phone was', kind: 'inspect', says: () => 'A clean rectangle in the dust where a phone used to be. Budget cuts.' },
  { id: 'binders', label: 'Sam’s old binders', kind: 'inspect', says: () => 'Sam’s binders: “Printers 2016”, “Printers 2017”, “Printers (other)”.' },
  { id: 'chair', label: 'Sam’s chair', kind: 'inspect', says: () => 'Sam’s chair. It squeaks, and it leans slightly to the left.' },
];
