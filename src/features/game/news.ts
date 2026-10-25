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
  {
    day: 11, title: 'One sign-in for everyone', from: 'Mr. Grisby', scene: '\u{1F419}\u{1F465}', tone: '#1d4ed8',
    shows: 'A long row of identical office keys hanging on hooks, all on one big key ring in the middle, under a desk lamp',
    moves: 'Static camera. The key ring sways very slightly and the lamp flickers.',
    body: 'From today, everyone at Burrow signs in once, with Oktopus, and gets their team\u2019s apps. The intern is doing all of it today. Please be patient. Please be in the HR file.',
  },
  {
    day: 12, title: 'Expenses go digital', from: 'Dot', scene: '\u2708\u{1F9FE}', tone: '#0f766e',
    shows: 'A tidy stack of paper receipts on a finance desk, slowly being tucked into a small leather travel wallet, an old calculator beside them',
    moves: 'Static camera. The top receipt lifts in the air-conditioning and settles again.',
    body: 'Finance will use Voyago for travel and expenses from today. Paper receipts will be accepted until Friday, and resented forever.',
  },
  {
    day: 13, title: 'Welcome, Hazel!', from: 'Dot', scene: '\u{1F33F}\u{1F9EE}', tone: '#4d7c0f',
    shows: 'A neat new desk in a finance office with a brand-new calculator, a pot plant and a fresh notebook, a nameplate with no name on it yet',
    moves: 'Static camera. The plant’s leaves move slightly; a pen rolls a little and stops.',
    body: 'Please welcome Hazel, our new Accounts Assistant. She likes spreadsheets, quiet and tea with no sugar. We are going to get on very well.',
  },
  {
    day: 14, title: 'Pip joins Finance', from: 'Otis', scene: '\u{1F4CA}\u{1F438}', tone: '#065f46',
    shows: 'A cardboard box of desk things being carried from a cluttered supply cupboard towards a tidy finance office, a stapler on top',
    moves: 'Static camera. The supply cupboard door swings gently shut.',
    body: 'Pip moves from Operations to Finance today. Operations will miss Pip\u2019s encyclopaedic knowledge of cables. Finance will gain it. Hoo.',
  },
  {
    day: 15, title: 'A short goodbye', from: 'Dot', scene: '\u{1F44B}\u{1F9EE}', tone: '#7c2d12',
    shows: 'An empty finance desk with a single calculator-shaped gap in the dust, a thank-you card propped against the monitor',
    moves: 'Static camera. The card tips over very slowly and lies flat.',
    body: 'Hazel has decided Finance isn\u2019t for her. She was with us two days, and she was lovely. If you have seen a calculator, please return it to Finance.',
  },
  {
    day: 16, title: 'The auditors\u2019 findings', from: 'Otis', scene: '\u{1F50E}\u{1F4CB}', tone: '#334155',
    shows: 'A thick report on a meeting room table with coloured flags sticking out of it, a red pen beside it, blinds half drawn',
    moves: 'Static camera. The report\u2019s flags flutter slightly in the air-conditioning and the light through the blinds shifts.',
    body: 'The auditors\u2019 report is in. Three findings: leavers who can still sign in, passwords on their own, and a shared login at reception. IT is on it. IT is one intern. Hoo.',
  },
  {
    day: 17, title: 'Sign in with your phone', from: 'Mr. Grisby', scene: '\u{1F4F1}\u{1F510}', tone: '#1e3a8a',
    shows: 'An old desk phone and a small modern mobile phone side by side on a desk, a padlock between them, lit by a monitor',
    moves: 'Static camera. The mobile phone\u2019s screen lights up softly, then dims.',
    body: 'From today Oktopus will ask for your phone as well as your password. This is called MFA, apparently. If you don\u2019t have a phone, Biscuit has a drawer of them.',
  },
  {
    day: 18, title: 'Please stop plugging things in', from: 'IT', scene: '\u{1F50C}\u{1F6AB}', tone: '#7f1d1d',
    shows: 'A single USB stick lying on wet tarmac in an empty car park at night under a street lamp, with a handwritten label',
    moves: 'Static camera. Rain falls lightly through the lamp light and the puddles ripple.',
    body: 'If you find a USB stick, do not plug it in to see whose it is. Bring it to IT. If you find one labelled \u201CSalaries\u201D, especially do not plug it in. Thank you, Pip.',
  },
  {
    day: 19, title: 'I would never ask quietly', from: 'Mr. Grisby', scene: '\u{1F4B7}\u{1F92B}', tone: '#78350f',
    shows: 'A finance desk with a payment form left unsigned, a pen set down beside it, and an old telephone off its hook as if someone is calling to check',
    moves: 'Static camera. The pen rolls a little and stops against the form.',
    body: 'Someone pretending to be me asked Finance to pay a stranger, quietly. I have never done anything quietly in my life. If I ask for money, I will ask loudly, in person, and probably twice.',
  },
  {
    day: 20, title: 'Goodbye, auditors', from: 'Otis', scene: '\u{1F44B}\u{1F4CB}', tone: '#3f6212',
    shows: 'An empty meeting room after a long stay, a neat stack of returned folders, a single half-eaten biscuit on a plate',
    moves: 'Static camera. The door slowly swings shut on its own.',
    body: 'The auditors leave us today. Two of three findings are closed, and the third is a shared login that Biscuit misses. They said we had \u201Cimproved markedly\u201D. I have framed it. Hoo.',
  },
  {
    day: 21, title: 'Welcome to the new floor!', from: 'Mr. Grisby', scene: '\u{1F3E2}\u2728', tone: '#0e7490',
    shows: 'A freshly fitted empty open-plan office floor with big windows over rolling hills, new desks still in plastic, cables coiled on the carpet',
    moves: 'Static camera. Plastic sheeting on a desk lifts gently in a draught and settles.',
    body: 'Thanks to our investors, Burrow & Co. now has a second floor. Sales, Marketing and Finance move up today. Please do not run on the new stairs. Please do not bring the old printer.',
  },
  {
    day: 22, title: 'Welcome, Rowan!', from: 'Marlo', scene: '\u{1F91D}\u{1F4C8}', tone: '#9a3412',
    shows: 'A sales desk by a big window with a brand-new laptop, a fresh notebook and a tidy stack of business cards, the evening sky outside',
    moves: 'Static camera. The top business card slides off the stack, slowly.',
    body: 'Please welcome Rowan, our new Sales Executive! Rowan sold me a pen in the interview. I already had a pen. Now I have two.',
  },
  {
    day: 23, title: 'The investors visit', from: 'Mr. Grisby', scene: '\u{1F4BC}\u{1F4CA}', tone: '#1e40af',
    shows: 'A smart new meeting room with a long table, three empty leather chairs and a projector beam lighting an empty screen',
    moves: 'Static camera. The projector beam flickers and dust drifts through it.',
    body: 'Our investors are visiting the new floor today. Please look busy. Please also be busy. If they ask about the coffee machine, it is “on a journey”.',
  },
  {
    day: 24, title: 'Wi-Fi by the window', from: 'Juniper', scene: '\u{1F4F6}\u{1FA9F}', tone: '#047857',
    shows: 'A new office access point fixed to the ceiling at the far end of a floor near tall windows, its small light glowing green',
    moves: 'Static camera. The small light on the access point blinks steadily.',
    body: 'Marketing\u2019s window desks now have Wi-Fi! IT put up a new access point. We can see the hills AND the internet. Best floor ever.',
  },
  {
    day: 25, title: 'Party on the new floor', from: 'Biscuit', scene: '\u{1F389}\u{1F370}', tone: '#be185d',
    shows: 'A new office floor decorated for a small party, bunting across the ceiling, a table with cakes and paper cups, the windows dark blue at dusk',
    moves: 'Static camera. The bunting sways gently and a balloon drifts across the ceiling.',
    body: 'Party at five on the new floor!! There is cake!! There is ANOTHER cake!! Everyone welcome, even Otis, ESPECIALLY Otis!!',
  },
];

/** Every post up to today, newest first. */
export const newsFor = (day: number): NewsPost[] => NEWS.filter((p) => p.day <= day).reverse();
