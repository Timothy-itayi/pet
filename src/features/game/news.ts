/** Company news on the Burrow Intranet. A new post most mornings; Friday's sets up next week's work. */

export interface NewsPost {
  day: number;
  title: string;
  from: string;
  body: string;
  /** The story's picture: a little scene, on a background colour. */
  scene: string;
  tone: string;
}

export const NEWS: NewsPost[] = [
  {
    day: 1, title: 'Welcome our new IT intern!', from: 'Mr. Grisby', scene: '\u{1F9D1}\u200D\u{1F4BB}\u{1F389}', tone: '#3a6ea5',
    body: 'Please welcome our new IT intern, who joins us after Sam’s sudden departure. They’re unpaid, keen, and sitting at Sam’s old desk. Be nice. Log tickets.',
  },
  {
    day: 1, title: 'Farewell, Sam', from: 'Otis', scene: '\u{1F4E6}\u{1F44B}\u{1F5A5}', tone: '#7a5a3a',
    body: 'After six years keeping our computers alive (and building most of them out of spare parts), Sam has left us. The card is in the kitchen. Please sign it. Hoo.',
  },
  {
    day: 2, title: 'Budget freeze', from: 'Mr. Grisby', scene: '\u{1F9CA}\u{1F4B7}', tone: '#4f7d9c',
    body: 'Until further notice: no new hardware, no new software, no new anything. If it’s broken, the intern will fix it. That’s what interns are for.',
  },
  {
    day: 3, title: 'Password reminder from IT', from: 'IT', scene: '\u{1F510}\u{1F4DD}', tone: '#5a4a7a',
    body: 'Your password expires every 90 days. If you’re locked out, log a ticket. Do not share your password with anyone, including IT. Especially not the sticky note under your keyboard.',
  },
  {
    day: 4, title: 'Marketing smashes it', from: 'Juniper', scene: '\u{1F4C8}\u{1F389}', tone: '#2f8a6b',
    body: 'Our spring campaign just had its best month ever! Thanks to the whole team. We’re hiring two more people for Marketing. They’ll need laptops. And logins. And everything.',
  },
  {
    day: 5, title: 'Big news: we’re growing!', from: 'Mr. Grisby', scene: '\u{1F680}\u{1F4BC}\u{1F30D}', tone: '#1d3f6e',
    body: 'Burrow & Co. has secured new investment! First on the list: proper modern sign-on for our staff. Marketing goes first next week with Oktopus, so everyone signs in once and gets all their apps. The intern will set it up. No pressure. Some pressure.',
  },
  {
    day: 6, title: 'Oktopus is here!', from: 'Mr. Grisby', scene: '\u{1F419}\u2728', tone: '#1662dd',
    body: 'One sign-in for everything. Marketing go first: once IT sets it up, they\u2019ll sign in to Oktopus and find Hootsweet waiting for them. Everyone else: soon. Probably next month.',
  },
  {
    day: 7, title: 'Welcome, Fern!', from: 'Juniper', scene: '\u{1F33F}\u{1F44B}', tone: '#3f8a4a',
    body: 'Please welcome Fern, our new Social Media Assistant! She starts today and she already knows more about Hootsweet than all of us. Say hi in #general.',
  },
  {
    day: 8, title: 'Basil joins Sales', from: 'Marlo', scene: '\u{1F91D}\u{1F4CA}', tone: '#8a5a2a',
    body: 'Big welcome to Basil, who moves from Marketing to Sales today as our Sales Designer. He\u2019s bringing his good taste and his fancy pens.',
  },
  {
    day: 9, title: 'Goodbye, Wren', from: 'Juniper', scene: '\u{1F48C}\u{1F338}', tone: '#9a4a6a',
    body: 'Yesterday was Wren\u2019s last day. Thank you for three years of excellent words. Cake was had. Also: the auditors are in all day. Be normal.',
  },
  {
    day: 10, title: 'Oktopus: what\u2019s next', from: 'Mr. Grisby', scene: '\u{1F419}\u{1F5FA}', tone: '#2b3a55',
    body: 'Marketing love Oktopus. The auditors love Oktopus. Next month: everyone gets it, and Finance get Voyago for travel. IT will be busy. IT is one intern. Hmm.',
  },
];

/** Every post up to today, newest first. */
export const newsFor = (day: number): NewsPost[] => NEWS.filter((p) => p.day <= day).reverse();
