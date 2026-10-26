import { MINUTES_A_DAY } from './directory.ts';
import { NEWS } from './news.ts';
import { hrOn } from './oktopus.ts';
import { clockTime } from './rules.ts';

/**
 * What the office says in Burrow Chat. People talk in their department's channel, a few minutes apart, about the
 * week's work. Everything is scripted by day and clock time, so nothing here is saved: which posts you can see is
 * worked out from the day and the clock. #service-desk is the ticket bot and isn't scripted here.
 */

export const CHANNELS = ['general', 'service-desk', 'finance', 'marketing', 'sales', 'operations', 'random'] as const;
export type Channel = (typeof CHANNELS)[number];
export type TalkChannel = Exclude<Channel, 'service-desk'>;

/** The line under a channel's name. */
export const CHANNEL_INFO: Record<Channel, string> = {
  general: 'Company news and announcements',
  'service-desk': 'New tickets, posted by the Service Desk bot',
  finance: 'Numbers, receipts and Dot checking them again',
  marketing: 'Campaigns, sticky notes and exclamation marks',
  sales: 'Deals, targets and the car park',
  operations: 'Cables, deliveries and staplers',
  random: 'Kitchen, cake, parking and other urgent matters',
};

export interface ChannelPost {
  /** Days before 1 are from before you started, so the channels aren't empty on the first morning. */
  day: number;
  /** Office clock, 24 hours, like tickets: '9:05'. */
  at: string;
  channel: TalkChannel;
  /** A person's login, as in people.ts. */
  from: string;
  text: string;
  /** Company news has a headline; chat doesn't. */
  title?: string;
}

/** The days' chat, as [time, channel, who, what]. Replies come a few minutes after what they answer. */
type Row = [string, TalkChannel, string, string];
const talk = (day: number, ...rows: Row[]): ChannelPost[] => rows.map(([at, channel, from, text]) => ({ day, at, channel, from, text }));

export const CHANNEL_POSTS: ChannelPost[] = [
  ...talk(0,
    ['8:50', 'random', 'biscuit', 'Sam’s card is in the kitchen!! Please sign it!! Not in biro on the cake!!'],
    ['9:05', 'random', 'basil', 'The card pen is a Basil pen. It is not for lending. Sign quickly. Return it.'],
    ['10:20', 'operations', 'pip', 'Sam’s desk has a cactus, a nest of cables and a drawer marked “definitely not the server room key”. Taking inventory. Ribbit.'],
    ['11:45', 'finance', 'otis', 'Hoo. A new IT intern starts tomorrow. Sam left a runbook. It has pages missing. I have minuted this.'],
    ['14:20', 'marketing', 'juniper', 'New intern tomorrow!! Should we make a banner?? A small banner??'],
    ['14:24', 'marketing', 'wren', 'No banner.'],
    ['15:40', 'sales', 'marlo', 'New intern tomorrow. Anyone who asks them about the Wi-Fi in the first hour answers to me.']),
  ...talk(1,
    ['8:55', 'random', 'biscuit', 'Welcome coffee for the new intern at 9:30!! There is no coffee!! There is tea!! And a biscuit!! Not me!! A biscuit!!'],
    ['9:20', 'random', 'marlo', 'Whoever keeps parking in the space marked MARLO: I know it’s a company car. I know it’s you, Mr. Grisby.'],
    ['9:23', 'random', 'grisby', 'The sign is a suggestion.'],
    ['9:24', 'random', 'pip', 'ribbit'],
    ['13:10', 'finance', 'dot', 'Sam’s old desk has a cactus on it. Is the cactus staff?'],
    ['13:14', 'finance', 'otis', 'Hoo. The cactus predates the intern. I have not seen its contract.'],
    ['14:30', 'operations', 'biscuit', 'Pip!! Did you lose a STAPLER??'],
    ['14:33', 'operations', 'pip', 'Blue. I said so on the feed. Ribbit.']),
  ...talk(2,
    ['8:50', 'finance', 'dot', 'The 10:00 budget meeting is cancelled. There is no budget. I checked. Twice.'],
    ['11:05', 'general', 'otis', 'Happy 12th work anniversary to Dot! Twelve years of keeping us solvent.'],
    ['11:07', 'general', 'dot', 'Has it really been twelve?'],
    ['11:09', 'general', 'juniper', 'Happy anniversary!!'],
    ['13:40', 'sales', 'marlo', 'Does the budget freeze cover the company car?'],
    ['13:43', 'sales', 'grisby', 'Which car.'],
    ['15:50', 'random', 'biscuit', 'Fire drill at four?? Probably?? I have made cake for the muster point!!']),
  ...talk(3,
    ['9:40', 'random', 'otis', 'Hoo. Happy birthday, Biscuit. I see there are candles. Hoo.'],
    ['10:55', 'finance', 'dot', 'IT says do not keep your password under the keyboard. Mine is not under the keyboard. It is in my head. Twelve years.'],
    ['12:50', 'random', 'marlo', 'The cake has a flavour I cannot name. It is not a bad flavour. I have had three slices to be sure.'],
    ['14:15', 'marketing', 'juniper', 'Who has a sticky note that says “password”? Asking for no reason. WREN.'],
    ['14:17', 'marketing', 'wren', 'It says “not password”. Different.'],
    ['15:30', 'operations', 'pip', 'Someone has put cake on the cable shelf. I have moved it. Crumbs in the cables. Ribbit.']),
  ...talk(4,
    ['8:50', 'marketing', 'juniper', 'CLIENT VISIT AT 10:30!! Everyone wear the nice lanyard!! Wren, that includes you!!'],
    ['8:53', 'marketing', 'wren', 'I am wearing it. Under my jumper.'],
    ['9:40', 'marketing', 'wren', 'Our spring campaign just hit 10,000 people. That’s more people than live in Burrow Hollow. Twice.'],
    ['9:44', 'marketing', 'grisby', 'Excellent. Do it again but bigger.'],
    ['13:30', 'sales', 'marlo', 'Client visit went well. I told them the car park was a feature.'],
    ['14:10', 'operations', 'biscuit', 'Printer appreciation hour at two!! Bring a card!! The printer cannot read it but it’s the thought!!'],
    ['15:20', 'finance', 'dot', 'Marketing are hiring two more. I asked Otis where they will sit. He said “hoo”.']),
  ...talk(5,
    ['9:10', 'random', 'biscuit', 'Drinks at five!! Soft ones!! And one hard one for Marlo!!'],
    ['9:14', 'random', 'marlo', 'It is a sparkling water and you know it.'],
    ['11:40', 'operations', 'pip', 'All-hands in twenty minutes. Everyone. In one room. Breathing. Ribbit.'],
    ['12:50', 'general', 'juniper', '“Proper modern sign-on”!!! I don’t know what that means but I have never been more excited!!'],
    ['13:05', 'finance', 'otis', 'Hoo. Investment. Dot, the numbers are about to go up. Be afraid.'],
    ['13:07', 'finance', 'dot', 'They will go up. I will check them.'],
    ['15:30', 'sales', 'marlo', 'Friday, sunshine, an investor. Sales is ready. Sales is also at the pub from five.']),
  ...talk(6,
    ['8:55', 'marketing', 'basil', 'New office plant in Marketing. Her name is Gloria. Please do not water Gloria. I water Gloria.'],
    ['8:58', 'marketing', 'biscuit', 'I may have watered Gloria.'],
    ['11:10', 'marketing', 'juniper', 'OKTOPUS DAY!! We’re first!! The investors picked MARKETING!! I have made a banner!!'],
    ['11:12', 'marketing', 'wren', 'You made a banner.'],
    ['11:13', 'marketing', 'juniper', 'A small banner.'],
    ['14:20', 'operations', 'pip', 'Oktopus has a lot of cables. Digital ones. Nothing to count. Disappointing. Ribbit.'],
    ['15:45', 'sales', 'marlo', 'Marketing get Oktopus. Sales get a memo. I will read the memo in my car.']),
  ...talk(7,
    ['8:45', 'marketing', 'juniper', 'Fern starts today!!! Desk by the window!! She has a laptop and a lanyard and a LOT of followers!!'],
    ['9:35', 'marketing', 'fern', 'Hi everyone! First day! Is the beige a choice?'],
    ['9:38', 'marketing', 'basil', 'It is a choice. The wrong one. Welcome.'],
    ['9:41', 'marketing', 'wren', 'Welcome. Mind the chair. It leans.'],
    ['12:35', 'random', 'biscuit', 'Welcome lunch for Fern!! I made a lasagne!! And a different lasagne!!'],
    ['15:15', 'operations', 'pip', 'Fern asked where the moodiest stairwell is. I took her. It is the best one. Ribbit.']),
  ...talk(8,
    ['8:50', 'sales', 'marlo', 'Welcome to Sales, Basil. Your desk is the one with the good chair. You’re welcome.'],
    ['8:56', 'sales', 'basil', 'It squeaks.'],
    ['9:20', 'marketing', 'juniper', 'Basil has gone to Sales. I’m fine. I’m FINE. Gloria is staying with us. That was negotiated.'],
    ['9:24', 'marketing', 'basil', 'Gloria is on loan. I have a key.'],
    ['11:30', 'marketing', 'wren', 'Last day. Packing. Nothing in the bag. Do not look in the bag.'],
    ['11:34', 'marketing', 'juniper', 'WE WILL NOT LOOK IN THE BAG (we will look in the bag)'],
    ['16:05', 'random', 'biscuit', 'Cake for Wren in the kitchen at four!! Sad cake!! Happy cake!! Both!!']),
  ...talk(9,
    ['8:45', 'finance', 'dot', 'The auditors are in the meeting room. Everything is labelled. Everything is dusted. I have not slept.'],
    ['8:48', 'finance', 'otis', 'Hoo. I love an auditor. I brought them the good chairs.'],
    ['10:30', 'sales', 'marlo', 'The auditors want to see my expenses. My expenses are art. They are not that kind of auditor.'],
    ['11:50', 'operations', 'pip', 'The auditors want to know where every cable goes. Finally, someone who cares. Ribbit!'],
    ['13:15', 'marketing', 'juniper', 'Wren’s desk is so quiet. Even the sticky notes look sad.'],
    ['13:20', 'marketing', 'fern', 'I’ll keep her seat warm. (Is that weird? That’s weird.)'],
    ['15:40', 'random', 'biscuit', 'The auditors do not want tea!! They want “water, still”!! Who orders still water!!']),
  ...talk(10,
    ['8:55', 'marketing', 'juniper', 'Oktopus is my favourite thing. I sign in ONCE and there is a tile for everything. I have cried at a tile.'],
    ['10:20', 'finance', 'dot', 'Voyago for Finance next month. I will believe it when the receipts stop stacking.'],
    ['11:15', 'sales', 'marlo', 'The auditors survived my expenses. I would like it noted that my expenses survived with dignity.'],
    ['14:30', 'operations', 'biscuit', 'Pip found the STAPLER!! It was in his drawer!! It was ALWAYS in his drawer!!'],
    ['14:33', 'operations', 'pip', 'It was a different drawer. Ribbit.'],
    ['16:00', 'random', 'otis', 'Hoo. Friday. I leave at five. Not five past. Do not ask me to drinks.']),
  ...talk(11,
    ['8:50', 'finance', 'otis', 'Hoo. Monday. Rain. A new sign-on system. A good morning for procedure.'],
    ['9:40', 'general', 'juniper', 'Everyone is on Oktopus today!! Welcome to the future!! We got there first!!'],
    ['9:43', 'general', 'fern', 'Marketing was first, just saying. In case there’s a plaque.'],
    ['11:10', 'finance', 'dot', 'I have signed in with the new thing. It let me in. I do not trust it.'],
    ['13:50', 'operations', 'pip', 'One sign-in for everything. I preferred the cupboard key. It had a feel. Ribbit.'],
    ['15:20', 'sales', 'marlo', 'One sign-in for everything. First time anyone has made my life simpler on purpose. Suspicious.']),
  ...talk(12,
    ['8:55', 'finance', 'dot', 'Voyago from today. Paper receipts accepted until Friday. Resented forever.'],
    ['10:25', 'finance', 'otis', 'Hoo. A travel app. We have never travelled. We once went to the bank.'],
    ['13:20', 'sales', 'marlo', 'Finance got a travel app. Sales got told “no”. The space marked MARLO remains unaffected.'],
    ['13:22', 'sales', 'dot', 'Expenses are for business travel.'],
    ['13:25', 'sales', 'marlo', 'Every journey is a business journey.'],
    ['15:10', 'random', 'biscuit', 'The kitchen does toasties on Tuesdays now!! I asked nicely!! I asked eight times!!']),
  ...talk(13,
    ['8:40', 'finance', 'dot', 'Hazel starts today. Tea, no sugar. Put the kettle on, Otis.'],
    ['9:05', 'finance', 'hazel', 'Good morning, everyone. Thank you for having me. Sorry if I’m in anyone’s way.'],
    ['9:07', 'finance', 'otis', 'Hoo. You are not in the way. The way is over there. Welcome.'],
    ['11:50', 'sales', 'basil', 'We have Canvass. Gloria and I are very happy. Please do not make posters in Comic Sans.'],
    ['11:55', 'sales', 'juniper', 'Too late.'],
    ['13:40', 'operations', 'biscuit', 'Welcome sandwiches for Hazel were a triumph!! Fourteen sandwiches!! Three left!! Otis was involved!!'],
    ['15:30', 'finance', 'hazel', 'Is there a form for moving a desk lamp? I don’t want to be any bother.'],
    ['15:33', 'finance', 'dot', 'There is a form for everything. I have all of them.']),
  ...talk(14,
    ['8:45', 'finance', 'dot', 'Pip arrives today with a box. I have cleared a drawer. Pip, the drawer is yours.'],
    ['9:50', 'finance', 'pip', 'Ribbit. Box delivered. The drawer is small. I like it.'],
    ['11:20', 'finance', 'hazel', 'Sorry to ask, but is it always this busy on the second day?'],
    ['11:23', 'finance', 'dot', 'It is a quiet day. This is us being quiet.'],
    ['13:55', 'finance', 'otis', 'Hoo. Pip has counted Finance’s staplers. Twice. In ascending order of size.'],
    ['16:10', 'operations', 'biscuit', 'It’s so quiet in Operations without Pip!! Nobody has said “ribbit” for hours!! I did it myself!! It wasn’t the same!!'],
    ['16:30', 'finance', 'pip', 'Finance has no cupboard. I asked for one. Dot said “no”, in a nice way. Ribbit.']),
  ...talk(15,
    ['8:50', 'finance', 'otis', 'Hoo. Hazel’s desk is empty. The notebook is still on it. Still blank.'],
    ['9:15', 'random', 'juniper', 'Hazel’s leaving card is in the kitchen. She was only here two days but she was SO nice. Also: who has the calculator?'],
    ['9:20', 'random', 'biscuit', 'I signed it twice!!'],
    ['12:40', 'finance', 'pip', 'Hazel left a pencil. I am keeping it safe. In a drawer. Ribbit.'],
    ['14:45', 'sales', 'marlo', 'Friday. Sun. I can see the weekend from here. Auditors on Monday. Hold that thought for me.'],
    ['16:15', 'general', 'grisby', 'Auditors on Monday. Please tidy your desks. Marlo, that includes the car. Honk.']),
  ...talk(16,
    ['9:40', 'random', 'biscuit', 'The auditors don’t eat biscuits!! I asked three times!! Who doesn’t eat biscuits!!'],
    ['9:43', 'random', 'otis', 'Auditors. Hoo.'],
    ['9:46', 'random', 'dot', 'I respect them more now.'],
    ['11:20', 'sales', 'marlo', 'Six phones. Six. Sales is not on the list. I would like it noted that I own a phone. Mine. Personal.'],
    ['13:30', 'finance', 'otis', 'Hoo. Finding one: leavers who can still sign in. We have a procedure for that now. It is written down. By me.'],
    ['14:15', 'finance', 'pip', 'The auditors asked about our cables. I gave them the cable list. They asked for a shorter list. Ribbit.'],
    ['15:40', 'marketing', 'juniper', 'The auditors asked what a “campaign” is. Wren would have had an answer. A very short one.']),
  ...talk(17,
    ['8:50', 'finance', 'dot', 'Phone sign-in for Finance first. I have a company phone. It has one button. It terrifies me.'],
    ['9:55', 'finance', 'otis', 'Hoo. I am the Company Secretary. I do not have a phone. I have a telephone. It has a cord. The cord is lovely.'],
    ['11:00', 'marketing', 'juniper', 'My phone just said “Is this you?” and I said “yes!!” I have never felt so seen!!'],
    ['11:03', 'marketing', 'fern', 'Phone sign-in is so aesthetic. One tap. Zero passwords.'],
    ['13:35', 'sales', 'marlo', 'The phone asked if it was me. I said no, once. It has now asked six times. More patience than Sales.'],
    ['15:15', 'random', 'pip', 'The fog is perfect. Nobody can see the car park. Nobody can see me. Ribbit.']),
  ...talk(18,
    ['9:30', 'general', 'pip', 'Found a USB stick in the car park. Did not plug it in. Am being praised. This is new. Ribbit.'],
    ['9:33', 'general', 'juniper', 'Pip is a hero!!'],
    ['9:36', 'general', 'otis', 'Hoo. Thank you, Pip.'],
    ['11:25', 'sales', 'marlo', 'A USB stick labelled “Salaries”. I did not touch it. I wanted to. It was the hardest thing I have done all week.'],
    ['13:40', 'marketing', 'fern', 'The security talk was so good. “Don’t plug that in” is my new bio.'],
    ['14:10', 'random', 'biscuit', 'Fire drill!! A real one!! I took the cake!! It is in my arms!! I am outside!!'],
    ['14:13', 'random', 'pip', 'I know where to stand. I painted the spot. Ribbit.']),
  ...talk(19,
    ['10:40', 'finance', 'otis', 'Hoo. Urgent and secret is how a scam sounds. I have written it on the whiteboard in red.'],
    ['11:15', 'finance', 'pip', 'Walked to Mr. Grisby’s office to double-check a payment. He was loud. Confirmed. Ribbit.'],
    ['13:50', 'random', 'grisby', 'Someone is pretending to be me. I have asked them to stop. Loudly. In writing. In capitals.'],
    ['14:35', 'sales', 'marlo', 'They say the fake Mr. Grisby was convincing. The real one is louder, and parks worse.'],
    ['15:50', 'marketing', 'juniper', 'A free screensaver link is going round. I did NOT click it. I want that on record. Fern, I want that on record.'],
    ['15:53', 'marketing', 'fern', 'On record.']),
  ...talk(20,
    ['9:20', 'general', 'juniper', 'A “win a voucher” survey is going round pretending to be HR. The logo is wrong. The font is wrong. It’s a lie.'],
    ['9:23', 'general', 'basil', 'The font was wrong. I knew before Juniper.'],
    ['13:10', 'finance', 'dot', 'The auditors leave today. Two findings closed, one to go. I will miss them like a toothache.'],
    ['13:30', 'operations', 'biscuit', 'The shared login at reception is going!! I will miss it!! It had a sticky note and a heart!!'],
    ['14:50', 'random', 'otis', 'Hoo. The auditors’ farewell drinks are at four. I will stand near the door.'],
    ['16:10', 'random', 'biscuit', 'They asked for STILL water, so we have given them sparkling!! It’s a farewell!! Let them live a little!!'],
    ['16:15', 'random', 'marlo', 'Auditors’ drinks. I have been asked not to mention expenses. I have mentioned nothing. I am a monument of restraint.']),
  ...talk(21,
    ['8:50', 'sales', 'marlo', 'The new floor has a car park view. I can see the space marked MARLO from my desk. Nobody is in it. Good.'],
    ['8:57', 'sales', 'grisby', 'I was in it this morning.'],
    ['8:59', 'sales', 'marlo', 'I know.'],
    ['9:40', 'marketing', 'juniper', 'NEW FLOOR!! Window desks!! You can see HILLS!! I might never go outside again!!'],
    ['12:10', 'random', 'biscuit', 'Tour of the new kitchen!! It has TWO kettles!! And a tap that does boiling water!!'],
    ['12:12', 'random', 'otis', 'Hoo. Boiling water. On tap. Unsupervised. I am writing a risk assessment.'],
    ['15:25', 'finance', 'dot', 'We were told not to bring the old printer upstairs. We did not bring the old printer. It is following us anyway.']),
  ...talk(22,
    ['8:55', 'sales', 'marlo', 'Rowan starts today. Desk by the window. Be warned: Rowan sells.'],
    ['9:30', 'sales', 'rowan', 'Morning all! Great view. First question: which parking space is Marlo’s? Asking for me.'],
    ['9:32', 'sales', 'marlo', 'The one with MARLO written on it.'],
    ['9:34', 'sales', 'rowan', 'Great. Noted. Moving on.'],
    ['15:10', 'random', 'rowan', 'Find-the-toilets challenge: I have found two. One is a cupboard. Who is winning?'],
    ['15:12', 'random', 'biscuit', 'Operations is winning!! We have a map!!'],
    ['16:30', 'finance', 'pip', 'Still using the old floor’s printer. It is the only one that likes me. Ribbit.']),
  ...talk(23,
    ['9:05', 'sales', 'marlo', 'Investors at 10:30. I have a smile ready. It has taken me since Friday.'],
    ['10:15', 'operations', 'biscuit', 'The investors want coffee!! We have no coffee!! I told them it’s “on a journey”!!'],
    ['14:05', 'marketing', 'juniper', 'Filmed the new floor with a DRONE for the investors. The drone has met the ceiling. They are not friends.'],
    ['14:09', 'marketing', 'basil', 'The ceiling had it coming.'],
    ['14:12', 'marketing', 'otis', 'Hoo.'],
    ['15:20', 'finance', 'dot', 'Every ledger on this floor is closed, labelled and dusted. The investors may open nothing.'],
    ['16:05', 'random', 'pip', 'The investors loved the view. I stayed in the stairwell. Ribbit.']),
  ...talk(24,
    ['8:50', 'finance', 'dot', 'Frozen again. I have put the stapler money in a separate envelope. It is a very small envelope.'],
    ['11:00', 'marketing', 'fern', 'Wi-Fi by the window works. Live from the window. It’s giving cottage.'],
    ['13:25', 'sales', 'marlo', 'Frozen budget. Wonderful. Rowan, you can have my spare pen. I have three now.'],
    ['13:45', 'operations', 'biscuit', 'The budget is frozen!! The cake budget is not frozen!! The cake budget is mine!!'],
    ['15:55', 'finance', 'pip', 'Ribbit. Something blue is on a bare desk at the far end of this floor. I am going to look.'],
    ['16:03', 'finance', 'dot', 'Pip has been gone nine minutes. Is it the stapler?'],
    ['16:10', 'finance', 'otis', 'Hoo. Do not tell me. I will read it on the feed.']),
  ...talk(25,
    ['9:05', 'random', 'otis', 'Hoo. I have been told I am “especially welcome” at the party. I am suspicious.'],
    ['10:30', 'marketing', 'juniper', 'Bunting is up!! Blue and pink!! I have been told the bunting is “a lot”!! I am up a ladder!! I am fine!!'],
    ['12:20', 'sales', 'marlo', 'Friday, sun, party. Rowan is bringing dips. Basil is bringing opinions about the dips.'],
    ['13:10', 'finance', 'dot', 'The numbers are in. They are good. I do not say that. I have said that.'],
    ['14:40', 'finance', 'pip', 'Party at five. The sun is too bright. I am bringing sunglasses and the stapler. Ribbit.'],
    ['15:30', 'general', 'grisby', 'The Conversation is at four. Upstairs. The intern knows. Everyone else, please look away. Honk.']),
];

/** The chat on a day, company news included (it goes up at half past eight, before the office opens). */
const postsOn = (day: number): ChannelPost[] => [
  ...NEWS.filter((n) => n.day === day).map((n): ChannelPost => ({ day, at: '8:30', channel: 'general', from: n.from, text: n.body, title: n.title })),
  ...CHANNEL_POSTS.filter((p) => p.day === day),
];

/** A moment in the game as one number, so posts and "last looked" times compare across days. */
export const stampOf = (day: number, clock: number) => day * MINUTES_A_DAY + clock;
const postStamp = (p: ChannelPost) => stampOf(p.day, clockTime(p.at));

/** What a channel shows: yesterday's posts and today's up to the clock, oldest first (new ones go at the bottom). */
export function visiblePosts(day: number, clock: number, channel: Channel): ChannelPost[] {
  return [day - 1, day].flatMap(postsOn)
    .filter((p) => p.channel === channel && postStamp(p) <= stampOf(day, clock))
    .sort((a, b) => postStamp(a) - postStamp(b));
}

/** Chat that went up after `from` and by `to` on the same day: the ones to tell you about as the clock moves. */
export const newPosts = (day: number, from: number, to: number): ChannelPost[] =>
  CHANNEL_POSTS.filter((p) => p.day === day && clockTime(p.at) > from && clockTime(p.at) <= to).sort((a, b) => clockTime(a.at) - clockTime(b.at));

/** How many posts in a channel went up since you last looked (the start of today if you haven't yet). */
export const unreadCount = (day: number, clock: number, channel: Channel, since = stampOf(day, 0)): number =>
  visiblePosts(day, clock, channel).filter((p) => postStamp(p) > since).length;

/** A person's name as people see it: from the HR file, where everyone who ever worked here is. */
export const personName = (login: string): string => hrOn(Number.MAX_SAFE_INTEGER).find((r) => r.login === login)?.name ?? login;
