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
  { day: 1, from: 'Marlo', text: 'Whoever keeps parking in the space marked MARLO: I know it’s a company car. I know it’s you, Mr. Grisby.', likes: 27, comments: [['Mr. Grisby', 'The sign is a suggestion.'], ['Pip', 'ribbit']] },
  { day: 1, from: 'Pip', text: 'Lost: one blue stapler. Answers to “stapler”. If found please return to Operations. No questions asked. Some questions asked.', likes: 9, comments: [['Biscuit', 'Is it the one in the kitchen??']] },
  { day: 2, from: 'Otis', text: 'Happy 12th work anniversary to Dot! Twelve years of keeping us solvent.', scene: '\u{1F389}12\u{1F389}', shows: 'A finance desk decorated with paper bunting, a cupcake with a single candle and a balloon shaped like the number twelve', likes: 38, comments: [['Dot', 'Has it really been twelve?'], ['Juniper', 'Happy anniversary!!']] },
  { day: 3, from: 'Biscuit', text: 'It’s my birthday!! There is cake!! I made it myself, which explains the shape!!', scene: '\u{1F382}\u{1F388}', shows: 'A lopsided homemade birthday cake on the office kitchen table, balloons tied to a chair', likes: 44, comments: [['Marlo', 'Happy birthday, Biscuit.'], ['Fern', 'Happy birthday!']] },
  { day: 4, from: 'Wren', text: 'Our spring campaign just hit 10,000 people. That’s more people than live in Burrow Hollow. Twice.', scene: '\u{1F4C8}\u{1F680}', shows: 'A corkboard of marketing posters with a little paper rocket pinned through them and a chart line climbing off the edge', likes: 29, comments: [['Mr. Grisby', 'Excellent. Do it again but bigger.']] },
  { day: 5, from: 'Dot', text: 'Thank you to our new IT intern for fixing the finance printer in four minutes. It’s been broken since March.', likes: 21, comments: [['Pip', 'they fixed mine too. ribbit']] },
  { day: 6, from: 'Basil', text: 'New office plant in Marketing. Her name is Gloria. Please do not water Gloria. I water Gloria.', scene: '\u{1FAB4}', shows: 'A glossy office plant in a pot on a marketing desk with a small watering can beside it and a stern little sign', likes: 17, comments: [['Biscuit', 'I may have watered Gloria.']] },
  { day: 7, from: 'Fern', text: 'First day! Everyone has been so lovely. And I can already log in to everything. Is that normal here?', likes: 33, comments: [['Juniper', 'It is now!'], ['Marlo', 'It is not.']] },
  { day: 8, from: 'Marlo', text: 'Welcome to Sales, Basil. Your desk is the one with the good chair. You’re welcome.', likes: 15, comments: [['Basil', 'It squeaks.']] },
  { day: 9, from: 'Juniper', text: 'Wren’s leaving card is in the kitchen. Also her mug. Also she took our good mug. Wren, we know.', scene: '\u{1F48C}☕', shows: 'An office kitchen counter with a leaving card, and a row of mug hooks with one hook empty', likes: 26, comments: [['Otis', 'The mug was company property. Hoo.']] },
  { day: 10, from: 'Pip', text: 'Found: blue stapler. It was in my drawer. It was always in my drawer. ribbit.', likes: 24, comments: [['Otis', 'Case closed.']] },
  { day: 11, from: 'Biscuit', text: 'Oktopus day!! I have ONE password now!! I wrote it down!! (Joke!! Don’t tell IT!!)', likes: 33, comments: [['IT', 'We know.'], ['Otis', 'Hoo.']] },
  { day: 12, from: 'Marlo', text: 'Finance got a travel app. Sales got told “no”. The space marked MARLO remains unaffected.', scene: '\u2708\u{1F6AB}', shows: 'A sign on a car park space reading only a stern arrow, a single shiny car parked neatly in it at dusk', likes: 21, comments: [['Dot', 'Expenses are for business travel.'], ['Marlo', 'Every journey is a business journey.']] },
  { day: 13, from: 'Basil', text: 'We have Canvass. Gloria and I are very happy. Please do not make posters in Comic Sans.', likes: 27, comments: [['Juniper', 'Too late.']] },
  { day: 14, from: 'Pip', text: 'First day in Finance. Counted the staplers. Finance has nine. The blue one is not among them. Ribbit.', scene: '\u{1F4CE}\u{1F50D}', shows: 'Nine staplers lined up neatly on a finance desk in a row, with a gap at the end where a tenth should be', likes: 19, comments: [['Dot', 'There are ten. Check again.'], ['Pip', 'Ribbit.']] },
  { day: 15, from: 'Juniper', text: 'Hazel’s leaving card is in the kitchen. She was only here three days but she was SO nice. Also: who has the calculator?', likes: 24, comments: [['Biscuit', 'I signed it twice!!']] },
  { day: 16, from: 'Biscuit', text: 'The auditors don\u2019t eat biscuits!! I asked three times!! Who doesn\u2019t eat biscuits!!', likes: 29, comments: [['Otis', 'Auditors. Hoo.'], ['Dot', 'I respect them more now.']] },
  { day: 17, from: 'Mr. Grisby', text: 'Signed in with my phone today. Four times. To check. Very secure. I am a very secure man.', likes: 41, comments: [['IT', 'You only need to do it once.'], ['Mr. Grisby', 'Five times, then.']] },
  { day: 18, from: 'Pip', text: 'Found a USB stick in the car park. Did not plug it in. Am being praised. This is new. Ribbit.', scene: '\u{1F50C}\u2B50', shows: 'A small gold paper star stuck to the side of a computer monitor on a cluttered finance desk, a USB stick in a sealed plastic bag beside it', likes: 36, comments: [['IT', 'Thank you, Pip.'], ['Juniper', 'Pip is a hero!!']] },
  { day: 19, from: 'Dot', text: 'Today I did not pay £9,400 to a stranger pretending to be Mr. Grisby. I am taking the afternoon off. I am not, but I\u2019d like to.', likes: 52, comments: [['Mr. Grisby', 'Thank you, Dot.'], ['Otis', 'Exemplary. Hoo.']] },
  { day: 20, from: 'Fern', text: 'Ended the week by spotting a fake HR survey!! Security is a vibe now.', scene: '\u{1F575}\u2728', shows: 'A laptop on a marketing desk showing a blank survey page, a magnifying glass resting on the keyboard, fairy lights in the background', likes: 31, comments: [['Juniper', 'So proud!!'], ['Basil', 'The survey font was awful anyway.']] },
  { day: 21, from: 'Marlo', text: 'The new floor has a car park view. I can see the space marked MARLO from my desk. Nobody is in it. Good.', likes: 22, comments: [['Mr. Grisby', 'I was in it this morning.'], ['Marlo', 'I know.']] },
  { day: 22, from: 'Rowan', text: 'Day one at Burrow! Signed in once, got my apps, got asked for my phone. Smoothest first day I\u2019ve had. Who do I thank?', likes: 34, comments: [['Juniper', 'The intern!!'], ['IT', 'You\u2019re welcome.']] },
  { day: 23, from: 'Juniper', text: 'Filmed the new floor with a DRONE for the investors. The drone has met the ceiling. They are not friends.', scene: '\u{1F681}\u{1F3A5}', shows: 'A small toy-like drone resting upside down on a new office carpet under a ceiling tile that is slightly askew, a camera bag nearby', likes: 39, comments: [['Basil', 'The ceiling had it coming.'], ['Otis', 'Hoo.']] },
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
