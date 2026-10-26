/**
 * Everyday posts on the Burrow Intranet: the birthdays, kudos and lost staplers that make it feel like a real office.
 * Only two or three a week; the day-to-day chatter is in Burrow Chat (channels.ts), as it is in real offices. Days
 * before 1 are from before you started, so the feed is already full on your first morning.
 */

export interface SocialPost {
  day: number;
  from: string;
  text: string;
  /** A small picture with the post, drawn as a scene of emoji. */
  scene?: string;
  /** What its generated picture shows, for posts with a picture. See art.ts. */
  shows?: string;
  likes: number;
  comments: [string, string][];
}

export const SOCIAL: SocialPost[] = [
  { day: -9, from: 'Otis', text: 'Reminder: the fire exit is not a storage cupboard. I have removed eleven boxes of A4 and a bicycle.', likes: 14, comments: [['Marlo', 'The bicycle is mine. Where is it?'], ['Otis', 'Fire exit. Outside. Where it belongs.']] },
  { day: -6, from: 'Biscuit', text: 'I made carrot cake for everyone!! It’s in the kitchen!! Please don’t tell Mr. Grisby there were three before there were two!!', scene: '\u{1F370}\u{1F370}\u{1F955}', shows: 'Two carrot cakes on an office kitchen counter beside an empty plate covered in crumbs where a third cake used to be', likes: 31, comments: [['Dot', 'Best cake in the valley.'], ['Mr. Grisby', 'I know about the third cake.']] },
  { day: -4, from: 'Sam', text: 'Six years. One last thing: the server room key is in the drawer marked “definitely not the server room key”. Be good to the printer. — Sam', likes: 42, comments: [['Juniper', 'We’ll miss you Sam!!'], ['Otis', 'Thank you for everything. Hoo.']] },
  { day: -3, from: 'Juniper', text: 'Kudos to Wren for writing the whole spring campaign in a weekend. Three-day weekend. Still counts.', likes: 19, comments: [['Wren', 'It was four days. But thank you!']] },
  { day: -1, from: 'Dot', text: 'Finance month-end is DONE. The numbers add up. I checked twice. Then a third time. Then Otis checked.', scene: '\u{1F4CA}✅', shows: 'A tidy stack of ledgers on a finance desk, an adding machine with a long paper tape curling onto the floor', likes: 23, comments: [['Otis', 'They add up. Hoo.']] },
  { day: 1, from: 'Pip', text: 'Lost: one blue stapler. Answers to “stapler”. If found please return to Operations. No questions asked. Some questions asked.', likes: 9, comments: [['Biscuit', 'Is it the one in the kitchen??']] },
  { day: 3, from: 'Biscuit', text: 'It’s my birthday!! There is cake!! I made it myself, which explains the shape!!', scene: '\u{1F382}\u{1F388}', shows: 'A lopsided homemade birthday cake on the office kitchen table, balloons tied to a chair', likes: 44, comments: [['Marlo', 'Happy birthday, Biscuit.'], ['Fern', 'Happy birthday!']] },
  { day: 5, from: 'Dot', text: 'Thank you to our new IT intern for fixing the finance printer in four minutes. It’s been broken since March.', likes: 21, comments: [['Pip', 'they fixed mine too. ribbit']] },
  { day: 7, from: 'Fern', text: 'First day! Everyone has been so lovely. And I can already log in to everything. Is that normal here?', likes: 33, comments: [['Juniper', 'It is now!'], ['Marlo', 'It is not.']] },
  { day: 9, from: 'Juniper', text: 'Wren’s leaving card is in the kitchen. Also her mug. Also she took our good mug. Wren, we know.', scene: '\u{1F48C}☕', shows: 'An office kitchen counter with a leaving card, and a row of mug hooks with one hook empty', likes: 26, comments: [['Otis', 'The mug was company property. Hoo.']] },
  { day: 10, from: 'Pip', text: 'Found: blue stapler. It was in my drawer. It was always in my drawer. ribbit.', likes: 24, comments: [['Otis', 'Case closed.']] },
  { day: 11, from: 'Biscuit', text: 'Oktopus day!! I have ONE password now!! I wrote it down!! (Joke!! Don’t tell IT!!)', likes: 33, comments: [['IT', 'We know.'], ['Otis', 'Hoo.']] },
  { day: 14, from: 'Pip', text: 'First day in Finance. Counted the staplers. Finance has nine. The blue one is not among them. Ribbit.', scene: '\u{1F4CE}\u{1F50D}', shows: 'Nine staplers lined up neatly on a finance desk in a row, with a gap at the end where a tenth should be', likes: 19, comments: [['Dot', 'There are ten. Check again.'], ['Pip', 'Ribbit.']] },
  { day: 17, from: 'Mr. Grisby', text: 'Signed in with my phone today. Four times. To check. Very secure. I am a very secure man.', likes: 41, comments: [['IT', 'You only need to do it once.'], ['Mr. Grisby', 'Five times, then.']] },
  { day: 19, from: 'Dot', text: 'Today I did not pay $9,400 to a stranger pretending to be Mr. Grisby. I am taking the afternoon off. I am not, but I\u2019d like to.', likes: 52, comments: [['Mr. Grisby', 'Thank you, Dot.'], ['Otis', 'Exemplary. Hoo.']] },
  { day: 20, from: 'Fern', text: 'Juniper spotted a fake HR survey and IT blocked it for everyone!! Security is a vibe now.', scene: '\u{1F575}\u2728', shows: 'A laptop on a marketing desk showing a blank survey page, a magnifying glass resting on the keyboard, fairy lights in the background', likes: 31, comments: [['Juniper', 'So proud!!'], ['Basil', 'The survey font was awful anyway.']] },
  { day: 22, from: 'Rowan', text: 'Day one at Burrow! Signed in once, got my apps, got asked for my phone. Smoothest first day I\u2019ve had. Who do I thank?', likes: 34, comments: [['Juniper', 'The intern!!'], ['IT', 'You\u2019re welcome.']] },
  { day: 24, from: 'Pip', text: 'FOUND THE BLUE STAPLER. It was on the new floor. Before anyone was on the new floor. Ribbit?', scene: '\u{1F4CE}\u{1F499}', shows: 'A single blue stapler sitting alone in the middle of a bare new office desk, lit by a sunbeam from a big window', likes: 61, comments: [['Dot', 'Finally.'], ['Biscuit', 'IT\u2019S A MIRACLE!!']] },
  { day: 25, from: 'Biscuit', text: 'Party tonight!! Bring your phones (for the sign-in) (and for photos)!!', likes: 45, comments: [['Fern', 'Content!!'], ['Mr. Grisby', 'Come to my office first. Everyone. No, just the intern.']] },
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
