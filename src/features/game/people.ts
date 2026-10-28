/**
 * Everyone at Burrow as a person, not just a ticket: who they are, where they are at any time of day, how the day's
 * weather and events leave them feeling, and what they've got to say about it. Worked out from the day and the
 * clock, so nothing here is saved.
 */
import { hrOn } from './oktopus.ts';
import { dayTags, TAG_WORDS, type DayTag } from './office.ts';

/** What someone is up to. Meeting, lunch and out mean they're away from their desk and slow to reply. */
export type Doing = 'home' | 'arriving' | 'desk' | 'coffee' | 'meeting' | 'lunch' | 'out' | 'leaving';
export type DayMood = 'bright' | 'usual' | 'low';

export interface Person {
  about: string;
  /** Their working day, earliest first. Before the first entry they're at home; the last is them heading off. */
  routine: { at: string; doing: Doing; where: string }[];
  likes: DayTag[];
  dislikes: DayTag[];
  /** What they say: lines for what they're doing, and lines for how the day has left them. */
  says: Partial<Record<Doing, string[]>> & Record<DayMood, string[]>;
}

export const AWAY: readonly Doing[] = ['meeting', 'lunch', 'out'];

export const PEOPLE: Record<string, Person> = {
  grisby: {
    about: 'Founded Burrow & Co. in a garden shed in 1987 and has been managing it, loudly, ever since. Believes in growth, investors and unpaid internships, in that order. Harrumphs when stressed. Has a meeting about The Conversation most weeks.',
    routine: [
      { at: '9:40', doing: 'arriving', where: 'Car park (his space)' },
      { at: '9:50', doing: 'desk', where: 'His office' },
      { at: '11:00', doing: 'meeting', where: 'His office, door shut' },
      { at: '12:00', doing: 'out', where: 'Lunch with an investor' },
      { at: '13:30', doing: 'desk', where: 'His office' },
      { at: '15:30', doing: 'coffee', where: 'Kitchen' },
      { at: '15:45', doing: 'desk', where: 'His office' },
      { at: '16:40', doing: 'leaving', where: 'Car park' },
    ],
    likes: ['sun', 'friday', 'all-hands', 'client-visit', 'oktopus', 'conversation'],
    dislikes: ['rain', 'auditors', 'fire-drill', 'leaving-do'],
    says: {
      arriving: ['Morning, morning. Somebody has parked in my space again. I know it was Marlo. Spiritually, it was Marlo.', 'Ah, the intern. Still here. Good. Excellent. Unpaid, but excellent.'],
      desk: ['Door’s open. Metaphorically. Physically it’s shut, the draught is terrible.', 'Doing the numbers. The numbers are doing me, frankly.', 'If anyone asks, I’m in a strategy session. With myself.'],
      coffee: ['There is no coffee budget. This is tea I brought from home. Do not tell Finance.'],
      meeting: ['Do not disturb. Unless it’s the investors. Or lunch.', 'In a meeting about the meeting about The Conversation.'],
      out: ['Lunching with an investor. It’s work. The pudding is work.', 'Out of office. Back when the bill arrives.'],
      leaving: ['Early start tomorrow. For me, 9:40 is an early start.', 'Off to the golf club. Networking. With a putter.'],
      bright: ['What a day to be Managing Director! Of something!', 'Splendid. The share price is up and so is morale. Mine, anyway.', 'Ha! That was a happy harrumph.', 'I feel a pay rise coming on. Not for you. Generally.'],
      usual: ['Keep those tickets moving, intern. Like sharks. Sharks with tickets.', 'Steady as she goes. She being the company. Going being… steady.', 'Remember: there’s no I in team. There is an I in intern, though. Make of that what you will.', 'Five tickets a day keeps the board away.'],
      low: ['Harrumph. That was not a happy harrumph.', 'Don’t talk to me about budgets. Or rain. Or auditors. Or anything.', 'Some days I wish I’d stayed in the shed.', 'If one more thing breaks I am cancelling Christmas. Pre-emptively.'],
    },
  },
  dot: {
    about: 'Twelve years in Finance and has never once let a number get away from her. Checks everything three times, then has Otis check it. Warm underneath, but you have to be invited underneath. Keeps a jar of sweets for people who log their tickets properly.',
    routine: [
      { at: '8:45', doing: 'arriving', where: 'Front door, first in as always' },
      { at: '8:55', doing: 'desk', where: 'Finance corner' },
      { at: '10:30', doing: 'coffee', where: 'Kitchen' },
      { at: '10:45', doing: 'desk', where: 'Finance corner' },
      { at: '12:00', doing: 'lunch', where: 'Her desk, sandwiches, lid on' },
      { at: '12:40', doing: 'desk', where: 'Finance corner' },
      { at: '15:00', doing: 'meeting', where: 'Meeting room, with Otis' },
      { at: '15:45', doing: 'desk', where: 'Finance corner' },
      { at: '17:00', doing: 'leaving', where: 'Front door, on the dot' },
    ],
    likes: ['auditors', 'monday', 'birthday'],
    dislikes: ['fire-drill', 'drinks', 'reshuffle', 'rain'],
    says: {
      arriving: ['First in. Kettle’s on. The kettle is mine, by the way.', 'Morning. I’ve already done the post.'],
      desk: ['Reconciling. Please speak in whole numbers.', 'If it’s not on a ticket, it didn’t happen. I believe you’re familiar with that rule.', 'The ledger balances. I balance. We are all balanced.'],
      coffee: ['Two minutes. It’s a timed break. I time it.'],
      meeting: ['In with Otis, going through the accounts. Line by line. It’s lovely.', 'Month-end review. Do not knock unless the building is on fire. Even then, knock quietly.'],
      lunch: ['Lunch. Lid on the sandwich box means do not disturb.', 'Egg and cress. Don’t judge me.'],
      leaving: ['Five o’clock. Not five past. Five.', 'Off home. The numbers will still be here tomorrow, which is a comfort.'],
      bright: ['Everything adds up today. Everything.', 'Have a sweet. You’ve earned it. Probably.', 'Twelve years and I still love a clean spreadsheet.', 'Lovely morning. I found a penny in the petty cash that I’d been looking for since March.'],
      usual: ['Steady day. That’s how I like them.', 'Remember to log it properly. I’ll know if you don’t.', 'Columns, rows, a cup of tea. What more is there?', 'Mr. Grisby wants a forecast. I’ve forecast disappointment.'],
      low: ['Not now. I’m out by four pence and it’s personal.', 'The fire drill moved my files. Someone will answer for it.', 'Wet coat, wet shoes, wet receipts. Wonderful.', 'I am being very patient. You can tell by the way I’m typing.'],
    },
  },
  otis: {
    about: 'Company Secretary, keeper of the rules, the minutes and the fire exits. Speaks slowly, in full sentences, with pauses you are not to fill. Remembers every meeting since 1994. Unexpectedly kind to anyone who reads a policy before asking about it.',
    routine: [
      { at: '9:00', doing: 'arriving', where: 'Front door' },
      { at: '9:05', doing: 'desk', where: 'Finance corner, by the window' },
      { at: '11:00', doing: 'out', where: 'Checking the fire exits' },
      { at: '11:30', doing: 'desk', where: 'Finance corner' },
      { at: '13:00', doing: 'lunch', where: 'The bench outside' },
      { at: '13:45', doing: 'desk', where: 'Finance corner' },
      { at: '15:00', doing: 'meeting', where: 'Meeting room, with Dot' },
      { at: '15:45', doing: 'desk', where: 'Finance corner' },
      { at: '17:15', doing: 'leaving', where: 'Front door, checking it’s locked' },
    ],
    likes: ['rain', 'auditors', 'fire-drill', 'monday'],
    dislikes: ['drinks', 'birthday', 'all-hands', 'friday'],
    says: {
      arriving: ['Good morning.', 'The front door was unlocked overnight. I have made a note.'],
      desk: ['Taking the minutes. Of nothing in particular. Practice.', 'Policy 4, subsection B. Very good subsection.', 'Reading. Quietly. As one should.'],
      out: ['Checking the fire exits. Someone has put a bicycle in one. Again.', 'On my rounds.'],
      lunch: ['On the bench outside. Rain or shine. Mostly rain.', 'Lunch. A plain biscuit. Not Biscuit. A biscuit.'],
      meeting: ['Going through the accounts with Dot. Line by line.', 'In session. Please wait outside. There is a chair.'],
      leaving: ['Locking up the filing cabinets. All of them. Twice.', 'Goodnight.'],
      bright: ['A splendid day for procedure.', 'The auditors and I understand each other.', 'Rain on the windows, a policy in hand. Perfect.', 'Everything is in order. I checked.'],
      usual: ['Carry on.', 'Read the policy. Then ask me. In that order.', 'Every rule is there because someone, once, did something.', 'Measure twice, minute once.'],
      low: ['Too much noise in this office today.', 'Cake in the kitchen again. The crumbs. The crumbs.', 'Friday. Everyone in a hurry. Nobody reads anything on a Friday.', 'Not now.'],
    },
  },
  juniper: {
    about: 'Runs Marketing on enthusiasm and oat lattes. Has a campaign idea every eleven minutes and writes them all on sticky notes. Fiercely loyal to her team. Will absolutely cry at a leaving card, and then post about it.',
    routine: [
      { at: '8:55', doing: 'arriving', where: 'Front door, two coffees in hand' },
      { at: '9:00', doing: 'desk', where: 'Marketing' },
      { at: '11:00', doing: 'meeting', where: 'Meeting room, Marketing stand-up' },
      { at: '11:30', doing: 'desk', where: 'Marketing' },
      { at: '12:30', doing: 'lunch', where: 'The café across the road' },
      { at: '13:15', doing: 'desk', where: 'Marketing' },
      { at: '15:30', doing: 'coffee', where: 'Kitchen' },
      { at: '15:45', doing: 'desk', where: 'Marketing' },
      { at: '17:20', doing: 'leaving', where: 'Front door, still on the phone' },
    ],
    likes: ['sun', 'client-visit', 'new-starter', 'oktopus', 'friday', 'drinks'],
    dislikes: ['rain', 'reshuffle', 'leaving-do', 'auditors'],
    says: {
      arriving: ['Morning!! I brought two coffees. Both mine. Sorry.', 'Okay okay okay, big day. Every day is a big day.'],
      desk: ['Brainstorming. Do you think hedgehogs could be a brand?', 'Seven tabs, three campaigns, one me.', 'Sticky notes are a system. Trust the system.'],
      coffee: ['Oat latte number three. It’s a marketing expense.'],
      meeting: ['Stand-up! We stand. Mostly. Basil leans.', 'Marketing stand-up. If it overruns it’s a sit-down.'],
      lunch: ['At the café. Thinking about content. And soup.', 'Lunch! Posting the lunch. Then eating the lunch.'],
      leaving: ['Heading home. Well, heading to yoga, then thinking about work.', 'Bye!! Big things tomorrow!!'],
      bright: ['Sunshine and good news. Content writes itself today.', 'We’re growing!! I can feel it in my sticky notes.', 'Best. Team. Ever.', 'I have so many ideas I’ve run out of wall.'],
      usual: ['Busy busy. Good busy.', 'If you see Wren, tell her the headline’s perfect.', 'Have you tried turning the campaign off and on again?', 'Marketing never sleeps. It naps, aggressively.'],
      low: ['Not crying. It’s the rain. On my face. Indoors.', 'I don’t want to talk about the reshuffle. I’ll post about it later.', 'Everyone keeps leaving. Is it me? It’s not me. Is it?', 'Today is a decaf day. Emotionally.'],
    },
  },
  wren: {
    about: 'Writes every word Burrow publishes and most of the ones it shouldn’t. Quiet, dry and fond of rain. Notices everything and says about a tenth of it. Took the good mug when she left. Everyone knows.',
    routine: [
      { at: '9:10', doing: 'arriving', where: 'Side door, umbrella first' },
      { at: '9:15', doing: 'desk', where: 'Marketing, the quiet end' },
      { at: '11:00', doing: 'meeting', where: 'Marketing stand-up, at the back' },
      { at: '11:30', doing: 'desk', where: 'Marketing, the quiet end' },
      { at: '13:00', doing: 'lunch', where: 'A bench, with a book' },
      { at: '13:45', doing: 'desk', where: 'Marketing, the quiet end' },
      { at: '16:50', doing: 'leaving', where: 'Side door' },
    ],
    likes: ['rain', 'monday'],
    dislikes: ['all-hands', 'client-visit', 'drinks', 'sun', 'reshuffle'],
    says: {
      arriving: ['Morning.', 'It’s raining. Good.'],
      desk: ['Writing. Do not read over my shoulder.', 'Three hundred words on staplers. Art takes many forms.', 'Editing Juniper’s exclamation marks. All forty.'],
      meeting: ['At stand-up. Standing at the back where nobody asks me anything.'],
      lunch: ['Reading. On a bench. Leave a message with the pigeons.'],
      leaving: ['Done for the day. The words will keep.'],
      bright: ['Rain on the window, a blank page. Lovely.', 'Wrote something good. Don’t tell anyone.', 'Quiet day. My favourite kind.', 'I liked your runbook notes. Clear. Rare.'],
      usual: ['Mm.', 'Busy. Words.', 'If it’s urgent, write it down. I read faster than I listen.', 'Fine, thanks.'],
      low: ['Too much sun. Too many people. Too many exclamation marks.', 'Please don’t make me present anything.', 'I’ll be at my desk. With my headphones. Which are a sign.', 'Not today.'],
    },
  },
  basil: {
    about: 'Designer with opinions about fonts, chairs and other people’s fonts. Keeps a jar of very expensive pens and a plant called Gloria that only he may water. Moves to Sales in week two and insists it was his idea.',
    routine: [
      { at: '9:25', doing: 'arriving', where: 'Front door, fashionably' },
      { at: '9:30', doing: 'desk', where: 'His desk, by Gloria' },
      { at: '11:00', doing: 'meeting', where: 'Meeting room' },
      { at: '11:30', doing: 'desk', where: 'His desk, by Gloria' },
      { at: '13:00', doing: 'lunch', where: 'The good sandwich place' },
      { at: '14:00', doing: 'desk', where: 'His desk, by Gloria' },
      { at: '16:00', doing: 'coffee', where: 'Kitchen, watering Gloria' },
      { at: '16:15', doing: 'desk', where: 'His desk' },
      { at: '17:00', doing: 'leaving', where: 'Front door' },
    ],
    likes: ['sun', 'friday', 'reshuffle', 'client-visit'],
    dislikes: ['monday', 'rain', 'fire-drill', 'auditors'],
    says: {
      arriving: ['I’m not late. The day started early.', 'Morning. Has anyone touched Gloria?'],
      desk: ['Kerning. It’s a sensitive process.', 'Do not borrow my pens. Any of them. I have counted.', 'Designing. Please stand somewhere less beige.'],
      coffee: ['Watering Gloria. Nobody else waters Gloria.'],
      meeting: ['In a meeting. Sketching the people in the meeting.'],
      lunch: ['At the good sandwich place. Not the other one. Never the other one.'],
      leaving: ['Off. Gloria, look after the place.'],
      bright: ['The light in here today. Gorgeous. Even the carpet looks intentional.', 'Gloria has a new leaf. I’m very proud.', 'I designed something perfect. You may look. Briefly.', 'Sales is going to be fabulous. I’ve already picked a new chair.'],
      usual: ['Fine. Busy. Creative.', 'Everything is a design problem if you squint.', 'Have you thought about a nicer font for the Service Desk? No? Clearly.', 'Pens accounted for. Day proceeding.'],
      low: ['Monday. Rain. Beige. My three enemies.', 'Someone watered Gloria. I can tell.', 'The fire drill made me leave my good pen. It’s gone. It’s in the wind.', 'Don’t. Just don’t.'],
    },
  },
  marlo: {
    about: 'Leads Sales, mostly from the car park. Writes strongly worded memos and rarely sends them. Fiercely competitive about everything from targets to the parking space marked MARLO, which is not, technically, his.',
    routine: [
      { at: '9:20', doing: 'arriving', where: 'Car park, the space marked MARLO' },
      { at: '9:25', doing: 'desk', where: 'Sales' },
      { at: '10:30', doing: 'out', where: 'Client calls, in the car' },
      { at: '11:15', doing: 'desk', where: 'Sales' },
      { at: '12:15', doing: 'lunch', where: 'The pub, “client lunch”' },
      { at: '13:15', doing: 'desk', where: 'Sales' },
      { at: '15:15', doing: 'coffee', where: 'Kitchen' },
      { at: '15:30', doing: 'desk', where: 'Sales' },
      { at: '17:10', doing: 'leaving', where: 'Car park' },
    ],
    likes: ['client-visit', 'friday', 'reshuffle', 'drinks', 'sun'],
    dislikes: ['monday', 'auditors', 'rain', 'all-hands'],
    says: {
      arriving: ['Got the space. Got it. Mine.', 'Morning. Targets don’t hit themselves.'],
      desk: ['Closing a deal. Possibly two. Don’t breathe on it.', 'Writing a memo. It’s strongly worded. It will not be sent.', 'Sales is a mindset. My mindset is: more.'],
      coffee: ['Black. Like my sales pipeline. That came out wrong.'],
      out: ['On client calls in the car. Best office in the building.', 'Out selling. Leave a message. I’ll sell you something.'],
      lunch: ['Client lunch. The client is a ploughman’s.'],
      leaving: ['Done. Nobody touch the space overnight.'],
      bright: ['Big day. I can smell a deal.', 'Basil in Sales! We’re going to be unstoppable. And well dressed.', 'Friday, sunshine, target in sight. Life is good.', 'I’d high-five you but I don’t know where your hands have been. IT, you know.'],
      usual: ['Busy. Selling.', 'Tell Mr. Grisby the space is a suggestion.', 'Numbers up, chin up.', 'Every no is just a yes that hasn’t been asked properly.'],
      low: ['Monday. I hate a Monday. Nobody buys on a Monday.', 'Auditors. Asking about my expenses. My expenses are art.', 'Someone parked in my space. Grisby. It was Grisby.', 'Not now. I’m drafting a memo.'],
    },
  },
  biscuit: {
    about: 'Office Assistant, morale officer and unofficial baker. Knows everyone’s birthday and everyone’s tea order. Cheerful to a degree that worries Otis. Has a soft spot for the intern and keeps leaving cake on the IT desk.',
    routine: [
      { at: '8:50', doing: 'arriving', where: 'Front door, carrying a tin' },
      { at: '9:00', doing: 'desk', where: 'Reception' },
      { at: '10:30', doing: 'out', where: 'Post office run' },
      { at: '11:10', doing: 'desk', where: 'Reception' },
      { at: '12:30', doing: 'lunch', where: 'Kitchen, with whoever’s there' },
      { at: '13:15', doing: 'desk', where: 'Reception' },
      { at: '15:00', doing: 'coffee', where: 'Kitchen, tea round' },
      { at: '15:30', doing: 'desk', where: 'Reception' },
      { at: '17:00', doing: 'leaving', where: 'Front door' },
    ],
    likes: ['birthday', 'drinks', 'new-starter', 'sun', 'friday', 'all-hands'],
    dislikes: ['leaving-do', 'rain', 'fire-drill', 'auditors'],
    says: {
      arriving: ['MORNING!! I made scones!! They’re a bit flat!!', 'Hi hi hi! Good morning! Is it a good morning? It is now!'],
      desk: ['Answering the phone!! Burrow and Co., how can I help!!', 'Sorting the post! There’s a parcel for you! It’s a mouse. A computer one.', 'Doing the rota! You’re on biscuits Thursday!'],
      coffee: ['Tea round!! What do you take? I already know. I just like asking.'],
      out: ['Post office run! Want anything? Stamps? A stamp? A friend?'],
      lunch: ['Lunch in the kitchen! Come and sit! There’s room! I’ll make room!'],
      leaving: ['Bye bye!! See you tomorrow!! I’ll bring something!!'],
      bright: ['IT’S CAKE DAY!! Every day is cake day but today REALLY is!!', 'Sunshine!! Everyone’s smiling!! Even Otis, a bit!!', 'I love it here!! I love everyone!! Mostly!!', 'You’re doing SO well. I can tell. I can always tell.'],
      usual: ['Hi!! Busy busy!!', 'There’s carrot cake in the kitchen! Don’t tell Mr. Grisby there was more!', 'Need anything? Tea? Plaster? Hug?', 'Every day’s a good day if you try!! Mostly!!'],
      low: ['Someone’s leaving and I’m fine. I’m FINE. Who took my tissues.', 'The rain flattened my scones. Flatter.', 'The fire drill alarm scared the cake.', 'I’m okay! I’m smiling! It’s a brave smile!'],
    },
  },
  pip: {
    about: 'Operations Assistant. Knows where every cable, box and stapler in the building is, and will tell you, at length. Loves rain, hates bright light, Still looking for the blue stapler.',
    routine: [
      { at: '9:00', doing: 'arriving', where: 'Back door, by the bins' },
      { at: '9:05', doing: 'desk', where: 'Operations, the cupboard-adjacent bit' },
      { at: '11:30', doing: 'out', where: 'Stock check, supply cupboard' },
      { at: '12:00', doing: 'desk', where: 'Operations' },
      { at: '13:00', doing: 'lunch', where: 'The pond in the park' },
      { at: '13:45', doing: 'desk', where: 'Operations' },
      { at: '16:30', doing: 'out', where: 'Checking the stationery delivery' },
      { at: '17:00', doing: 'leaving', where: 'Back door' },
    ],
    likes: ['rain', 'fire-drill', 'oktopus', 'auditors'],
    dislikes: ['sun', 'all-hands', 'drinks', 'friday'],
    says: {
      arriving: ['Morning.', 'Came in the back. The front is too bright.'],
      desk: ['Counting staplers. One is missing. It’s always the blue one.', 'Logistics.', 'If you need a cable, I have a cable. I have every cable.'],
      out: ['In the supply cupboard. It’s nice in here. Dark.', 'Checking the delivery. Twelve boxes of A4. Thirteen expected. Suspicious.'],
      lunch: ['In the park. Don’t ask.', 'Lunch. Outside. Somewhere shady.'],
      leaving: ['Off home. It might rain later. Fingers crossed.'],
      bright: ['RAIN. Finally.', 'Fire drill! I know exactly where to stand. I painted the spot.', 'Found three cables I didn’t know about. Wonderful day.', 'Want to see something cool? It’s a box. Inside the box is another box.'],
      usual: ['Morning.', 'Have you seen a blue stapler? Asking for me.', 'Everything is where it should be. Except the stapler.', 'Fine. Damp. Content.'],
      low: ['Too sunny. Squinting.', 'All-hands. Everyone in one room. Breathing. Ugh.', 'Someone reorganised the cupboard “helpfully”.', 'Not a good day.'],
    },
  },
  fern: {
    about: 'Joins Marketing in week two as Social Media Assistant and already knows more about Hootsweet than anyone. Keen, quick and slightly terrifying with a hashtag. Thinks the 1990s office décor is “a vibe”.',
    routine: [
      { at: '8:55', doing: 'arriving', where: 'Front door, filming it' },
      { at: '9:00', doing: 'desk', where: 'Marketing, the new desk' },
      { at: '11:00', doing: 'meeting', where: 'Marketing stand-up' },
      { at: '11:30', doing: 'desk', where: 'Marketing' },
      { at: '12:30', doing: 'lunch', where: 'Kitchen, posting it' },
      { at: '13:15', doing: 'desk', where: 'Marketing' },
      { at: '15:00', doing: 'out', where: 'Taking photos for socials' },
      { at: '15:30', doing: 'desk', where: 'Marketing' },
      { at: '17:15', doing: 'leaving', where: 'Front door' },
    ],
    likes: ['new-starter', 'oktopus', 'sun', 'friday', 'drinks'],
    dislikes: ['monday', 'rain', 'auditors', 'conversation'],
    says: {
      arriving: ['Morning! Day in the life of a Burrow employee, take one.', 'Hi! I made a reel of the lift. It’s doing numbers.'],
      desk: ['Scheduling posts. Hootsweet and I are basically best friends now.', 'This beige is so retro it’s cool again.', 'Drafting a caption. Is “supplies, sundries and slay” too much?'],
      meeting: ['At stand-up. Live-tweeting it. Internally.'],
      lunch: ['Lunch in the kitchen! Biscuit gave me cake! Posting the cake.'],
      out: ['Taking photos for socials. The stairwell is very moody.'],
      leaving: ['Bye! Scheduling tomorrow’s posts on the bus.'],
      bright: ['Everything is so aesthetic today!', 'First week and I already have a favourite printer.', 'Hootsweet loves me and I love it back.', 'Sunshine + good wifi = perfect day.'],
      usual: ['Busy! Good busy!', 'Thanks for setting my accounts up, by the way. Seamless.', 'Is it weird I like the old computers? They’re so chunky.', 'Content, content, content.'],
      low: ['Monday and raining. Not a vibe.', 'The auditors asked what a hashtag is. Twice.', 'Can’t post today, the light is terrible.', 'I’m fine! Just… recalibrating.'],
    },
  },
  hazel: {
    about: 'Joins Finance in week three as Accounts Assistant: quiet, precise, unfailingly polite and very fond of a spreadsheet. Brings her own calculator. Leaves after two days, just as politely, with the calculator.',
    routine: [
      { at: '8:50', doing: 'arriving', where: 'Front door, a little early' },
      { at: '9:00', doing: 'desk', where: 'Finance corner, the new desk' },
      { at: '10:45', doing: 'coffee', where: 'Kitchen, tea with no sugar' },
      { at: '11:00', doing: 'desk', where: 'Finance corner' },
      { at: '12:30', doing: 'lunch', where: 'Kitchen, with Dot' },
      { at: '13:15', doing: 'desk', where: 'Finance corner' },
      { at: '15:00', doing: 'meeting', where: 'Meeting room, learning the ledgers' },
      { at: '15:45', doing: 'desk', where: 'Finance corner' },
      { at: '17:00', doing: 'leaving', where: 'Front door, on time' },
    ],
    likes: ['new-starter', 'monday', 'rain'],
    dislikes: ['drinks', 'reshuffle', 'conversation'],
    says: {
      arriving: ['Good morning. I’m a little early. I hope that’s all right.', 'Morning. I brought my own calculator, just in case.'],
      desk: ['Reconciling. It’s very calming.', 'Dot showed me the ledgers. They’re beautiful.', 'Sorry, could you say that again? I was in a column.'],
      coffee: ['Tea, no sugar. Thank you for asking. Nobody asked.'],
      meeting: ['Learning the ledgers with Dot. Line by line.'],
      lunch: ['Lunch with Dot. She has opinions about egg.'],
      leaving: ['Five o’clock. Goodnight. Thank you for today.'],
      bright: ['Everyone’s been so welcoming. Thank you.', 'A whole new spreadsheet. Lovely.', 'I think I’m going to like it here. I think.', 'The rain’s nice. Quiet.'],
      usual: ['Fine, thank you. And you?', 'Just getting my bearings.', 'Is there a form for that? There’s usually a form.', 'Sorry to bother you.'],
      low: ['I’m not sure Finance is for me. Sorry. Don’t tell Dot.', 'Everyone keeps moving desks. It’s a lot.', 'I’ll be fine. I’m always fine.', 'Is it always this loud?'],
    },
  },
  rowan: {
    about: 'Joins Sales in week five as Sales Executive. Confident, quick, and already on first-name terms with the coffee machine. Asked about the parking before the password. Gets on with Marlo far too well.',
    routine: [
      { at: '8:45', doing: 'arriving', where: 'Car park, eyeing the space marked MARLO' },
      { at: '8:55', doing: 'desk', where: 'Sales, the new floor, by the window' },
      { at: '10:30', doing: 'out', where: 'Client calls, in the stairwell' },
      { at: '11:15', doing: 'desk', where: 'Sales, by the window' },
      { at: '12:30', doing: 'lunch', where: 'The pub, with Marlo' },
      { at: '13:30', doing: 'desk', where: 'Sales, by the window' },
      { at: '15:30', doing: 'coffee', where: 'The new kitchen' },
      { at: '15:45', doing: 'desk', where: 'Sales' },
      { at: '17:30', doing: 'leaving', where: 'Car park' },
    ],
    likes: ['new-starter', 'client-visit', 'friday', 'drinks', 'sun'],
    dislikes: ['rain', 'monday', 'auditors'],
    says: {
      arriving: ['Morning! Is the space marked MARLO actually Marlo’s? Asking for me.', 'First in. Well, second. Dot’s always first.'],
      desk: ['Closing. Always closing.', 'This window. This view. This is where deals happen.', 'Marlo says I’m a natural. Marlo says that to the coffee machine too.'],
      coffee: ['The new kitchen has two kettles. Two. We’ve made it.'],
      out: ['On a call in the stairwell. Best signal in the building, apparently.'],
      lunch: ['At the pub with Marlo. It’s a “client lunch”. The client is Marlo.'],
      leaving: ['Off! Tomorrow, more selling.'],
      bright: ['Great day. I can feel a deal coming.', 'New floor, new desk, new everything.', 'Everyone here is lovely. Even Otis. Especially Otis.', 'Sun’s out. Deals are out.'],
      usual: ['Busy. Good busy.', 'Still learning where everything is. Mostly the toilets.', 'Got my sign-in, my apps and a phone thing. Very smooth.', 'Ask me anything. I’ll find out.'],
      low: ['Rain and a Monday. Nobody buys anything in the rain.', 'Wi-Fi by the window keeps dropping. My calls keep dropping. My smile hasn’t. Yet.', 'Still can’t find the toilets.', 'Bit of a slow one.'],
    },
  },
  clover: {
    about: 'Warehouse Supervisor. Runs the stockroom and dispatch with a clipboard and a great deal of tallying, and has never once been surprised by a stock level. Counts everything, twice, and says “Counted.” when she’s done. Suspicious of anything IT “updates”: the last update moved her label printer.',
    routine: [
      { at: '8:40', doing: 'arriving', where: 'Loading bay door, keys first' },
      { at: '8:50', doing: 'desk', where: 'Stockroom office, clipboard in hand' },
      { at: '10:00', doing: 'out', where: 'Stock count, aisle by aisle' },
      { at: '10:50', doing: 'desk', where: 'Stockroom office' },
      { at: '12:15', doing: 'lunch', where: 'Loading bay, standing up' },
      { at: '12:50', doing: 'desk', where: 'Stockroom office' },
      { at: '14:30', doing: 'out', where: 'Dispatch, loading the afternoon vans' },
      { at: '15:15', doing: 'desk', where: 'Stockroom office' },
      { at: '16:45', doing: 'leaving', where: 'Locking the stockroom, counting the keys' },
    ],
    likes: ['fire-drill', 'monday', 'auditors'],
    dislikes: ['oktopus', 'reshuffle', 'drinks'],
    says: {
      arriving: ['Keys: three. Doors: four. Counted.', 'In early. Somebody has moved a pallet by two inches. I can feel it.'],
      desk: ['Reconciling the stock. The stock and I disagree by one stapler.', 'One: it’s not on the list. Two: it’s not on the shelf. Counted.', 'If IT “updates” my label printer again, I’m counting that as an incident.'],
      out: ['Stock count. Do not move anything. I have a system. The system is me.', 'In the aisles. Forty-one boxes of paper clips. Forty-one. Counted.'],
      lunch: ['Lunch. Standing up. Sitting down loses count of the vans.', 'Sandwich. One. Counted.'],
      leaving: ['Locking up. Keys: three. Counted.', 'Off home. The stockroom will still be there. I counted.'],
      bright: ['Everything matched the sheet today. Counted. I’m not smiling, it’s the light.', 'A perfect delivery. Not one box short. Savour it.', 'Fire drill! Finally, a headcount. Counted. Everyone, plus Pip, who was already outside.', 'Good day. Tally: all of it.'],
      usual: ['Busy. Counted.', 'One: the vans are loaded. Two: the vans are late. Three: not my fault.', 'If it’s not on the clipboard, it didn’t happen.', 'Nothing’s missing. That’s suspicious.'],
      low: ['Somebody “tidied” the stockroom. It will take me a week to un-tidy it.', 'Oktopus. One more thing to sign in to. Tally: too many.', 'Drinks after work. Which means no one’s counting anything. Terrible.', 'A box is missing. I don’t want to talk about it.'],
    },
  },
  moss: {
    about: 'Delivery Driver. Out on rounds most of the day in the Burrow van, with the radio on or, more often, with himself humming. At his desk first thing and last thing, collecting and handing in the paperwork. Calls everyone “chief”, including Mr. Grisby, who has stopped noticing.',
    routine: [
      { at: '8:30', doing: 'arriving', where: 'Van park, humming' },
      { at: '8:40', doing: 'desk', where: 'Dispatch desk, collecting the manifest' },
      { at: '9:45', doing: 'out', where: 'On rounds in the van' },
      { at: '12:30', doing: 'lunch', where: 'A lay-by, with a flask' },
      { at: '13:15', doing: 'out', where: 'Afternoon drops, in the van' },
      { at: '16:15', doing: 'desk', where: 'Dispatch desk, handing in the paperwork' },
      { at: '17:00', doing: 'leaving', where: 'Van park, humming' },
    ],
    likes: ['sun', 'friday', 'drinks', 'client-visit'],
    dislikes: ['rain', 'monday', 'auditors'],
    says: {
      arriving: ['Morning, chief. Hm hm hmmm.', 'Van’s running. I’m running. Hm-hm.'],
      desk: ['Manifest, chief. Fourteen drops. Hm hm hmmm.', 'Just doing the paperwork, chief. Then back on the road.', 'Anyone seen the pen that works? Hm.'],
      out: ['On the road, chief. Back when the traffic lets me.', 'Mid-drop. Leave a message. I’ll hum back.'],
      lunch: ['Flask, lay-by, a sandwich. Hm hm hmmm. Best office in the county.', 'Lunch in the van, chief. Window down.'],
      leaving: ['Van’s back, chief. Hm hm hmmm.', 'Home time. Radio on.'],
      bright: ['Sun on the windscreen and a song on the radio. Hm hm hmmm.', 'Every drop on time, chief. Nobody believes me.', 'Friday, chief. Windows down and the long way round.', 'Lovely day for a delivery. They’re all lovely days for a delivery.'],
      usual: ['All good, chief. Hm hm.', 'Fourteen drops and a flat tyre. Standard.', 'Just keeping the wheels turning, chief.', 'Hm hm hmmm. Nothing to report.'],
      low: ['Rain, chief. The wipers are humming a different tune.', 'Roadworks everywhere. Everywhere, chief. I’ve counted.', 'Not humming today. That’s how you know.', 'Late for every drop and it’s the traffic’s fault, chief. It always is.'],
    },
  },
  tansy: {
    about: 'Account Manager and Burrow’s top seller, a fact she mentions the way other people mention the weather. Friendly rival to Marlo; the two of them have a leaderboard, a wager and a standing disagreement about the good chair. Always on her phone. Ends every message with a sales flourish.',
    routine: [
      { at: '8:50', doing: 'arriving', where: 'Front door, already on a call' },
      { at: '9:00', doing: 'desk', where: 'Sales, phone to her ear' },
      { at: '10:30', doing: 'out', where: 'Client meeting, across town' },
      { at: '11:45', doing: 'desk', where: 'Sales' },
      { at: '12:30', doing: 'lunch', where: 'The café, still on a call' },
      { at: '13:30', doing: 'desk', where: 'Sales' },
      { at: '15:15', doing: 'out', where: 'Pitching a client, in person' },
      { at: '16:15', doing: 'desk', where: 'Sales' },
      { at: '17:30', doing: 'leaving', where: 'Car park, on the phone' },
    ],
    likes: ['client-visit', 'friday', 'drinks', 'oktopus'],
    dislikes: ['monday', 'fire-drill', 'auditors'],
    says: {
      arriving: ['Morning! Quick call first. Deal?', 'In early and already ahead of Marlo. Shake on it?'],
      desk: ['Closing two today. Marlo’s closing one. Deal?', 'Leaderboard update: me, then a gap, then Marlo. Pleasure doing business.', 'Can’t talk, got a prospect on the line. Let’s close this later.'],
      out: ['At a client. Back with a signature. Deal?', 'Pitching. Leave a message. I’ll sell you something.'],
      lunch: ['Lunch on a call. Selling soup. Shake on it?', 'Café. Still dialling. Pleasure doing business.'],
      leaving: ['Done. Highest number on the board. Deal?', 'Home time. Phone stays on. Always closing.'],
      bright: ['Big day! Closed three before lunch. Let’s call that a win. Deal?', 'Sunshine and a signature. Pleasure doing business.', 'The leaderboard looks lovely. Don’t tell Marlo. Shake on it?', 'Friday and a full pipeline. Can’t lose. Deal?'],
      usual: ['Busy! Always busy. Let’s close this.', 'Another day, another prospect. Deal?', 'Pipeline’s healthy, phone’s charged. Pleasure doing business.', 'Ahead of target. Not by much. Shake on it?'],
      low: ['Monday. Nobody signs on a Monday. Deal? No? Fine.', 'The fire drill cut off a call. A call! I had them at “hello”.', 'Marlo is ahead by one. One. I’m not thinking about it. Deal?', 'Auditors. Asking about my mileage. My mileage is art. Let’s not.'],
    },
  },
  hector: {
    about: 'Payroll Officer, Finance. Precise, a little anxious, and always right to the minute, which he’ll tell you. Dreads payroll Thursday more than anyone dreads anything, and has a spreadsheet to prove it. Prickly when stressed, but the first to hold a door open. Means well, always, in writing.',
    routine: [
      { at: '8:40', doing: 'arriving', where: 'Front door, exactly on time' },
      { at: '8:45', doing: 'desk', where: 'Finance corner, the payroll desk' },
      { at: '10:30', doing: 'coffee', where: 'Kitchen, stirring exactly twice' },
      { at: '10:45', doing: 'desk', where: 'Finance corner' },
      { at: '12:30', doing: 'lunch', where: 'Kitchen, same chair as always' },
      { at: '13:10', doing: 'desk', where: 'Finance corner' },
      { at: '15:00', doing: 'meeting', where: 'Meeting room, on the phone to the bank' },
      { at: '15:45', doing: 'desk', where: 'Finance corner' },
      { at: '17:05', doing: 'leaving', where: 'Front door, after checking the payroll file twice' },
    ],
    likes: ['monday', 'auditors', 'rain'],
    dislikes: ['conversation', 'drinks', 'reshuffle', 'fire-drill'],
    says: {
      arriving: ['Good morning. 8:40. Precisely. For the record.', 'In on time. The kettle isn’t. I’ve made a note.'],
      desk: ['Payroll. Please do not speak to me in round numbers.', 'For the record, that was 9:14, not 9:15. I checked.', 'If anything goes wrong on a Thursday, it will have been wrong since Tuesday.'],
      coffee: ['Two stirs. Exactly. Not three. Three is a different coffee.'],
      meeting: ['On the phone to the bank. Do not wave. I can see you waving.', 'The bank wants a form. I have the form. I have six forms.'],
      lunch: ['Lunch. Same chair. Please do not take the chair.', 'Cheese sandwich. One. Cut into four, for the record.'],
      leaving: ['Payroll file checked. Twice. Home.', 'Off. 17:05. For the record.'],
      bright: ['Everything balanced on the first pass. I’m suspicious, but pleased.', 'A quiet day. No queries. I am allowed to enjoy this. Briefly.', 'Rain on the window and a clean ledger. Perfect.', 'Not a single payslip query. I’ve written it down.'],
      usual: ['Fine. Busy. Slightly dreading Thursday.', 'It’s Tuesday. Thursday is coming. It is always coming.', 'For the record, I’m not worried. I’m planning.', 'Please log it properly. I will know if you don’t.'],
      low: ['The Conversation. Pay. In the air. I can’t breathe in here.', 'Someone’s moved my chair. I will find them. Politely.', 'Fire drill, and I was mid-calculation. Every payslip, gone from my head.', 'It’s nothing. It’s nearly nothing. It’s a bit something.'],
    },
  },
  sam: {
    about: 'Kept Burrow’s IT running for six years, mostly out of spare parts, sticky notes and spite. Left suddenly, leaving behind a runbook, a wall of notes and an account nobody switched off. You are sitting in their chair.',
    routine: [],
    likes: [],
    dislikes: [],
    says: {
      home: ['Out of office: I no longer work at Burrow & Co. For IT, please contact the intern. Good luck to them.', 'Auto-reply: Gone. Please check the runbook. Please don’t trust the runbook.', 'This mailbox is no longer monitored. It was never really monitored.'],
      bright: ['Auto-reply: Gone. Happier. Sleeping.'],
      usual: ['Auto-reply: The printer is not my problem any more.'],
      low: ['Auto-reply: If the server is making that noise again, I’m sorry.'],
    },
  },
};

const minutes = (hm: string) => { const [h = 0, m = 0] = hm.split(':').map(Number); return h * 60 + m; };
const ampm = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')}${m < 720 ? 'am' : 'pm'}`;

/** Whether someone works at Burrow on a given day, by HR. */
export const atBurrow = (login: string, day: number) => hrOn(day).some((r) => r.login === login && r.status === 'active');

/** How someone feels about today: what they like about it, minus what they don't. */
export function dayMood(login: string, day: number): { mood: DayMood; why: DayTag[] } {
  const p = PEOPLE[login];
  if (!p) return { mood: 'usual', why: [] };
  const tags = dayTags(day);
  const up = tags.filter((t) => p.likes.includes(t));
  const down = tags.filter((t) => p.dislikes.includes(t));
  const score = up.length - down.length;
  return { mood: score > 0 ? 'bright' : score < 0 ? 'low' : 'usual', why: score > 0 ? up : score < 0 ? down : [] };
}

/** Today's mood in words, with why: "Low: Rain. Monday." */
export function moodWords(login: string, day: number): string {
  const { mood, why } = dayMood(login, day);
  const name = mood === 'bright' ? 'In good spirits' : mood === 'low' ? 'Having a rough day' : 'Their usual self';
  return why.length ? `${name}: ${why.map((t) => TAG_WORDS[t]).join('. ')}.` : `${name}.`;
}

export interface Whereabouts { doing: Doing; where: string; until?: number; slot: number }

/** Where someone is at a time on a day: their routine, or home if they're not in yet, gone, or not at Burrow. */
export function whereIs(login: string, day: number, clock: number): Whereabouts {
  const p = PEOPLE[login];
  if (!p || !atBurrow(login, day)) return { doing: 'home', where: 'Not at Burrow & Co.', slot: -1 };
  const at = p.routine.findLastIndex((r) => minutes(r.at) <= clock);
  const now = p.routine[at];
  const next = p.routine[at + 1];
  if (!now) return { doing: 'home', where: 'Not in yet', until: p.routine[0] && minutes(p.routine[0].at), slot: -1 };
  // Half an hour after they head off, they're home.
  if (!next && clock >= minutes(now.at) + 30) return { doing: 'home', where: 'Gone home', slot: at + 1 };
  return { doing: now.doing, where: now.where, until: next && minutes(next.at), slot: at };
}

/** When someone you're waiting on is back at their desk, if they're away right now. */
export function backAt(login: string, day: number, clock: number): { until: number; where: string; doing: Doing } | undefined {
  const w = whereIs(login, day, clock);
  return AWAY.includes(w.doing) && w.until !== undefined ? { until: w.until, where: w.where, doing: w.doing } : undefined;
}

const AWAY_SAYS: Partial<Record<Doing, string>> = { meeting: 'In a meeting', lunch: 'At lunch', out: 'Away from my desk' };
/** What they say when you message them while they're away. */
export const awayLine = (b: { until: number; doing: Doing }) => `${AWAY_SAYS[b.doing] ?? 'Away'} till ${ampm(b.until)}. I’ll look then.`;

/** "At lunch · Kitchen", for a status line. */
export function statusText(login: string, day: number, clock: number): string {
  const w = whereIs(login, day, clock);
  const label: Record<Doing, string> = { home: 'Not in', arriving: 'Just arrived', desk: 'At desk', coffee: 'On a break', meeting: 'In a meeting', lunch: 'At lunch', out: 'Out', leaving: 'Heading home' };
  if (w.where === 'Not at Burrow & Co.') return w.where;
  return w.doing === 'home' ? w.where : `${label[w.doing]} · ${w.where}`;
}

/**
 * Something they'd say right now: about what they're doing, or how the day's left them. It stays the same until
 * they move on to the next thing, so it doesn't change every time the screen redraws.
 */
export function sayNow(login: string, s: { day: number; clock: number; seed: number }): string {
  const p = PEOPLE[login];
  if (!p) return '';
  const w = whereIs(login, s.day, s.clock);
  const mood = dayMood(login, s.day).mood;
  const hash = [...`${login}${s.day}${w.slot}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, s.seed % 9973);
  const doingLines = p.says[w.doing] ?? [];
  const pool = doingLines.length && hash % 2 === 0 ? doingLines : p.says[mood];
  return pool[hash % pool.length] ?? '';
}
