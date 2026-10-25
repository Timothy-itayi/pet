/** What each day at Burrow is like, outside the tickets: the weather, what's on, the canteen and the share price. */

/** Burrow & Co.'s share price at the end of each day. It jumps on the first Friday, when the investment is announced. */
export const BRRW = [4.12, 4.05, 3.98, 4.21, 5.37, 5.52, 5.61, 5.48, 5.44, 5.83];
export const WEATHER = ['Drizzle, 13°', 'Showers, 12°', 'Cloudy, 14°', 'Sunny spells, 16°', 'Sunny, 18°', 'Windy, 15°', 'Rain, 11°', 'Fog, 12°', 'Cloudy, 14°', 'Sunny, 19°'];
export const TODAY = [
  ['9:30 Welcome coffee for the new intern (there is no coffee)', '15:00 Sam’s leaving card, kitchen'],
  ['10:00 Budget meeting (cancelled: no budget)', '16:00 Fire drill (probably)'],
  ['11:00 Marketing stand-up', 'Biscuit’s birthday: cake in the kitchen'],
  ['10:30 Client visit, meeting room', '14:00 Printer appreciation hour'],
  ['12:00 All-hands: an announcement', '17:00 Drinks?'],
  ['9:00 Oktopus kick-off (it’s just you)', '15:00 Marketing try out Hootsweet'],
  ['9:30 Fern’s first day', '12:30 Welcome lunch, kitchen'],
  ['10:00 Basil’s first Sales meeting', '16:00 Hand-over: Marketing to Sales'],
  ['All day: auditors in the meeting room', '15:00 Wren’s leaving card (late)'],
  ['11:00 Juniper’s client workshop', '17:00 The Conversation'],
] as const;
export const CANTEEN = ['Soup of the day (yesterday’s)', 'Cheese toastie', 'Carrot cake (Biscuit made it)', 'Mystery stew', 'Fish & chips Friday'];

/** Things about a day that people have feelings about. */
export type DayTag = 'rain' | 'sun' | 'monday' | 'friday' | 'leaving-do' | 'fire-drill' | 'birthday' | 'client-visit' | 'all-hands'
  | 'drinks' | 'oktopus' | 'new-starter' | 'reshuffle' | 'auditors' | 'conversation';

/** How a day tag reads when someone explains their mood. */
export const TAG_WORDS: Record<DayTag, string> = {
  rain: 'Rain', sun: 'Sunshine', monday: 'Monday', friday: 'Friday', 'leaving-do': 'A leaving card', 'fire-drill': 'A fire drill',
  birthday: 'Biscuit’s birthday', 'client-visit': 'A client visit', 'all-hands': 'The all-hands', drinks: 'Drinks after work',
  oktopus: 'Oktopus', 'new-starter': 'A new starter', reshuffle: 'The team shuffle', auditors: 'The auditors', conversation: 'The Conversation',
};

/** Days 1 to 10: the weather, the weekday and what's on, in that order. */
const DAY_TAGS: DayTag[][] = [
  ['rain', 'monday', 'leaving-do'],
  ['rain', 'fire-drill'],
  ['birthday'],
  ['sun', 'client-visit'],
  ['sun', 'friday', 'all-hands', 'drinks'],
  ['monday', 'oktopus'],
  ['rain', 'new-starter'],
  ['reshuffle'],
  ['auditors', 'leaving-do'],
  ['sun', 'friday', 'conversation'],
];

export const dayTags = (day: number): DayTag[] => DAY_TAGS[Math.min(Math.max(day, 1), DAY_TAGS.length) - 1] ?? [];
