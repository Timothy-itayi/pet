/** Company news on the Burrow Intranet. A new post most mornings; Friday's sets up next week's work. */

export interface NewsPost {
  day: number;
  title: string;
  from: string;
  body: string;
}

export const NEWS: NewsPost[] = [
  {
    day: 1, title: 'Welcome our new IT intern!', from: 'Mr. Grisby',
    body: 'Please welcome our new IT intern, who joins us after Sam’s sudden departure. They’re unpaid, keen, and sitting at Sam’s old desk. Be nice. Log tickets.',
  },
  {
    day: 1, title: 'Farewell, Sam', from: 'Otis',
    body: 'After six years keeping our computers alive (and building most of them out of spare parts), Sam has left us. The card is in the kitchen. Please sign it. Hoo.',
  },
  {
    day: 2, title: 'Budget freeze', from: 'Mr. Grisby',
    body: 'Until further notice: no new hardware, no new software, no new anything. If it’s broken, the intern will fix it. That’s what interns are for.',
  },
  {
    day: 3, title: 'Password reminder from IT', from: 'IT',
    body: 'Your password expires every 90 days. If you’re locked out, log a ticket. Do not share your password with anyone, including IT. Especially not the sticky note under your keyboard.',
  },
  {
    day: 4, title: 'Marketing smashes it', from: 'Juniper',
    body: 'Our spring campaign just had its best month ever! Thanks to the whole team. We’re hiring two more people for Marketing. They’ll need laptops. And logins. And everything.',
  },
  {
    day: 5, title: 'Big news: we’re growing!', from: 'Mr. Grisby',
    body: 'Burrow & Co. has secured new investment! First on the list: proper modern sign-on for our staff. Marketing goes first next week with Oktopus, so everyone signs in once and gets all their apps. The intern will set it up. No pressure. Some pressure.',
  },
];

/** Every post up to today, newest first. */
export const newsFor = (day: number): NewsPost[] => NEWS.filter((p) => p.day <= day).reverse();
