/**
 * Everyday posts on the Burrow Intranet: the birthdays, kudos, lost staplers and parking feuds that make it feel
 * like a real office. Days before 1 are from before you started, so the feed is already full on your first morning.
 */

export interface SocialPost {
  day: number;
  from: string;
  text: string;
  /** A small picture with the post, drawn as a scene of emoji. */
  scene?: string;
  likes: number;
  comments: [string, string][];
}

export const SOCIAL: SocialPost[] = [
  { day: -9, from: 'Otis', text: 'Reminder: the fire exit is not a storage cupboard. I have removed eleven boxes of A4 and a bicycle.', likes: 14, comments: [['Marlo', 'The bicycle is mine. Where is it?'], ['Otis', 'Fire exit. Outside. Where it belongs.']] },
  { day: -6, from: 'Biscuit', text: 'I made carrot cake for everyone!! It’s in the kitchen!! Please don’t tell Mr. Grisby there were three before there were two!!', scene: '\u{1F370}\u{1F370}\u{1F955}', likes: 31, comments: [['Dot', 'Best cake in the valley.'], ['Mr. Grisby', 'I know about the third cake.']] },
  { day: -4, from: 'Sam', text: 'Six years. One last thing: the server room key is in the drawer marked “definitely not the server room key”. Be good to the printer. — Sam', likes: 42, comments: [['Juniper', 'We’ll miss you Sam!!'], ['Otis', 'Thank you for everything. Hoo.']] },
  { day: -3, from: 'Juniper', text: 'Kudos to Wren for writing the whole spring campaign in a weekend. Three-day weekend. Still counts.', likes: 19, comments: [['Wren', 'It was four days. But thank you!']] },
  { day: -1, from: 'Dot', text: 'Finance month-end is DONE. The numbers add up. I checked twice. Then a third time. Then Otis checked.', scene: '\u{1F4CA}✅', likes: 23, comments: [['Otis', 'They add up. Hoo.']] },
  { day: 1, from: 'Marlo', text: 'Whoever keeps parking in the space marked MARLO: I know it’s a company car. I know it’s you, Mr. Grisby.', likes: 27, comments: [['Mr. Grisby', 'The sign is a suggestion.'], ['Pip', 'ribbit']] },
  { day: 1, from: 'Pip', text: 'Lost: one blue stapler. Answers to “stapler”. If found please return to Operations. No questions asked. Some questions asked.', likes: 9, comments: [['Biscuit', 'Is it the one in the kitchen??']] },
  { day: 2, from: 'Otis', text: 'Happy 12th work anniversary to Dot! Twelve years of keeping us solvent.', scene: '\u{1F389}12\u{1F389}', likes: 38, comments: [['Dot', 'Has it really been twelve?'], ['Juniper', 'Happy anniversary!!']] },
  { day: 3, from: 'Biscuit', text: 'It’s my birthday!! There is cake!! I made it myself, which explains the shape!!', scene: '\u{1F382}\u{1F388}', likes: 44, comments: [['Marlo', 'Happy birthday, Biscuit.'], ['Fern', 'Happy birthday!']] },
  { day: 4, from: 'Wren', text: 'Our spring campaign just hit 10,000 people. That’s more people than live in Burrow Hollow. Twice.', scene: '\u{1F4C8}\u{1F680}', likes: 29, comments: [['Mr. Grisby', 'Excellent. Do it again but bigger.']] },
  { day: 5, from: 'Dot', text: 'Thank you to our new IT intern for fixing the finance printer in four minutes. It’s been broken since March.', likes: 21, comments: [['Pip', 'they fixed mine too. ribbit']] },
  { day: 6, from: 'Basil', text: 'New office plant in Marketing. Her name is Gloria. Please do not water Gloria. I water Gloria.', scene: '\u{1FAB4}', likes: 17, comments: [['Biscuit', 'I may have watered Gloria.']] },
  { day: 7, from: 'Fern', text: 'First day! Everyone has been so lovely. And I can already log in to everything. Is that normal here?', likes: 33, comments: [['Juniper', 'It is now!'], ['Marlo', 'It is not.']] },
  { day: 8, from: 'Marlo', text: 'Welcome to Sales, Basil. Your desk is the one with the good chair. You’re welcome.', likes: 15, comments: [['Basil', 'It squeaks.']] },
  { day: 9, from: 'Juniper', text: 'Wren’s leaving card is in the kitchen. Also her mug. Also she took our good mug. Wren, we know.', scene: '\u{1F48C}☕', likes: 26, comments: [['Otis', 'The mug was company property. Hoo.']] },
  { day: 10, from: 'Pip', text: 'Found: blue stapler. It was in my drawer. It was always in my drawer. ribbit.', likes: 24, comments: [['Otis', 'Case closed.']] },
];

/** Everyday posts up to today, newest first. */
export const socialFor = (day: number): SocialPost[] => SOCIAL.filter((p) => p.day <= day).reverse();

/** Burrow & Co. through the years. */
export const HISTORY: [string, string][] = [
  ['1987', 'Mr. Grisby starts selling stationery and string from a shed in Burrow Hollow.'],
  ['1994', 'First real office, above the bakery. The smell of bread is still in the carpets.'],
  ['2003', 'We buy our first computer. It is beige. Sam would later keep it alive for years.'],
  ['2009', 'The runbook is started. Most of it is still in use. Some of it is still right.'],
  ['2020', 'Sam joins and builds most of our IT out of spare parts.'],
  ['2026', 'New investment. Proper sign-on (Oktopus) for everyone, starting with Marketing.'],
];
