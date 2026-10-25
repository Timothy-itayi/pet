/** Company news on the Burrow Intranet. A new post most mornings; Friday's sets up next week's work. */

export interface NewsPost {
  day: number;
  title: string;
  from: string;
  body: string;
  /** The story's picture: a little scene, on a background colour. */
  scene: string;
  tone: string;
  /** What its generated picture shows, and how it moves when it's the lead story. See art.ts. */
  shows: string;
  moves: string;
}

export const NEWS: NewsPost[] = [
  {
    day: 1, title: 'Welcome our new IT intern!', from: 'Mr. Grisby', scene: '\u{1F9D1}\u200D\u{1F4BB}\u{1F389}', tone: '#3a6ea5',
    shows: 'An empty desk with an old beige computer, a single party balloon tied to the office chair, a mug and sticky notes stuck to the monitor',
    moves: 'Static camera. The balloon sways gently on its string and the monitor flickers.',
    body: 'Please welcome our new IT intern, who joins us after Sam’s sudden departure. They’re unpaid, keen, and sitting at Sam’s old desk. Be nice. Log tickets.',
  },
  {
    day: 1, title: 'Farewell, Sam', from: 'Otis', scene: '\u{1F4E6}\u{1F44B}\u{1F5A5}', tone: '#7a5a3a',
    shows: 'A cardboard box of desk belongings on an empty desk: a small cactus, tangled cables, a framed photo lying face down, an old computer beside it',
    moves: 'Static camera. The desk lamp flickers and dust drifts through its light.',
    body: 'After six years keeping our computers alive (and building most of them out of spare parts), Sam has left us. The card is in the kitchen. Please sign it. Hoo.',
  },
  {
    day: 2, title: 'Budget freeze', from: 'Mr. Grisby', scene: '\u{1F9CA}\u{1F4B7}', tone: '#4f7d9c',
    shows: 'An office supplies cupboard frosted over with ice, icicles hanging from its shelves, a padlock on the open door, one lonely computer mouse inside',
    moves: 'Static camera. Frost slowly creeps across the shelves and a few snowflakes drift down.',
    body: 'Until further notice: no new hardware, no new software, no new anything. If it’s broken, the intern will fix it. That’s what interns are for.',
  },
  {
    day: 3, title: 'Password reminder from IT', from: 'IT', scene: '\u{1F510}\u{1F4DD}', tone: '#5a4a7a',
    shows: 'A keyboard on a dark desk with a sticky note half hidden underneath it, a small padlock beside it, lit by the glow of a monitor',
    moves: 'Static camera. The sticky note flutters slightly and the monitor glow pulses softly.',
    body: 'Your password expires every 90 days. If you’re locked out, log a ticket. Do not share your password with anyone, including IT. Especially not the sticky note under your keyboard.',
  },
  {
    day: 4, title: 'Marketing smashes it', from: 'Juniper', scene: '\u{1F4C8}\u{1F389}', tone: '#2f8a6b',
    shows: 'A meeting table covered in confetti and spent party poppers, a whiteboard behind it with a hand-drawn chart line climbing upwards',
    moves: 'Static camera. Confetti drifts slowly down onto the table.',
    body: 'Our spring campaign just had its best month ever! Thanks to the whole team. We’re hiring two more people for Marketing. They’ll need laptops. And logins. And everything.',
  },
  {
    day: 5, title: 'Big news: we’re growing!', from: 'Mr. Grisby', scene: '\u{1F680}\u{1F4BC}\u{1F30D}', tone: '#1d3f6e',
    shows: 'A small paper rocket standing on top of a filing cabinet next to a desk globe and a leather briefcase, evening light through window blinds',
    moves: 'Static camera. The globe turns slowly and the light through the blinds shifts.',
    body: 'Burrow & Co. has secured new investment! First on the list: proper modern sign-on for our staff. Marketing goes first next week with Oktopus, so everyone signs in once and gets all their apps. The intern will set it up. No pressure. Some pressure.',
  },
  {
    day: 6, title: 'Oktopus is here!', from: 'Mr. Grisby', scene: '\u{1F419}\u2728', tone: '#1662dd',
    shows: 'A friendly purple octopus plush toy sitting on top of a small server cabinet, its tentacles wrapped around network cables, rows of tiny green status lights',
    moves: 'Static camera. The tentacles curl slowly and the server lights blink.',
    body: 'One sign-in for everything. Marketing go first: once IT sets it up, they\u2019ll sign in to Oktopus and find Hootsweet waiting for them. Everyone else: soon. Probably next month.',
  },
  {
    day: 7, title: 'Welcome, Fern!', from: 'Juniper', scene: '\u{1F33F}\u{1F44B}', tone: '#3f8a4a',
    shows: 'A fresh new desk with a fern in a pot, a brand-new laptop still in its plastic wrap and a blank welcome card propped against it',
    moves: 'Static camera. The fern leaves sway gently in the air-conditioning.',
    body: 'Please welcome Fern, our new Social Media Assistant! She starts today and she already knows more about Hootsweet than all of us. Say hi in #general.',
  },
  {
    day: 8, title: 'Basil joins Sales', from: 'Marlo', scene: '\u{1F91D}\u{1F4CA}', tone: '#8a5a2a',
    shows: 'A moving box on an empty designer desk, filled with fancy pens in a jar, rolled-up sketches and a desk lamp',
    moves: 'Static camera. The rolled sketches unfurl a little and the lamp flickers.',
    body: 'Big welcome to Basil, who moves from Marketing to Sales today as our Sales Designer. He\u2019s bringing his good taste and his fancy pens.',
  },
  {
    day: 9, title: 'Goodbye, Wren', from: 'Juniper', scene: '\u{1F48C}\u{1F338}', tone: '#9a4a6a',
    shows: 'An empty writer\u2019s desk with a vase of pink flowers, a leaving card and a ring-shaped stain where a mug used to be',
    moves: 'Static camera. Petals slowly fall from the flowers onto the desk.',
    body: 'Yesterday was Wren\u2019s last day. Thank you for three years of excellent words. Cake was had. Also: the auditors are in all day. Be normal.',
  },
  {
    day: 10, title: 'Oktopus: what\u2019s next', from: 'Mr. Grisby', scene: '\u{1F419}\u{1F5FA}', tone: '#2b3a55',
    shows: 'A big paper map pinned on a corkboard with red string connecting pins across it, a small octopus figurine at the centre',
    moves: 'Static camera. The strings sway slightly and the desk lamp flickers.',
    body: 'Marketing love Oktopus. The auditors love Oktopus. Next month: everyone gets it, and Finance get Voyago for travel. IT will be busy. IT is one intern. Hmm.',
  },
];

/** Every post up to today, newest first. */
export const newsFor = (day: number): NewsPost[] => NEWS.filter((p) => p.day <= day).reverse();
