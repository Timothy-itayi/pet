import type { Tool } from './types.ts';

/** The loot pool. On drop day, one of your friends leaves theirs; with no friends, you find Sam's. */
export const TOOLS: Tool[] = [
  {
    id: 'tweezers', from: 'dot', name: 'Dot’s long tweezers', issue: 'paper-jam',
    gift: 'A pair of long tweezers in your ticket tray, and a note: “For the printer. You’re the first one who listened. – Dot”',
    fixLabel: 'Fish the jam out with Dot’s tweezers',
    notes: [
      { text: 'Dot’s tweezers reach paper jammed deep in a tray. No need to open up the printer.', right: true },
      { text: 'Use the tweezers to clean the ink cartridge.' },
      { text: 'Tweezers fix printer drivers.' },
    ],
  },
  {
    id: 'wifi-card', from: 'otis', name: 'Otis’s staff Wi-Fi card', issue: 'guest-wifi',
    gift: 'A laminated card with a QR code: “Burrow-Staff. Point a camera at it. No password to forget. Hoo. – Otis”',
    fixLabel: 'Scan the staff Wi-Fi QR card with their laptop',
    notes: [
      { text: 'Staff Wi-Fi QR card: scan it to join Burrow-Staff. Staff only, never for visitors.', right: true },
      { text: 'Hand the staff Wi-Fi card to visitors too.' },
      { text: 'The QR card speeds up the guest network.' },
    ],
  },
  {
    id: 'hdmi-labels', from: 'juniper', name: 'Juniper’s labelled cables', issue: 'monitor-input',
    gift: 'Two HDMI cables, each with a little rabbit label: “1” and “2”. “So nobody panics like I did. – Juniper”',
    fixLabel: 'Match the labelled cable to the screen’s input',
    notes: [
      { text: 'Label both ends of every cable with its input number. “No signal” becomes a five-second fix.', right: true },
      { text: 'HDMI 1 is always the right input.' },
      { text: 'Labelled cables are faster cables.' },
    ],
  },
  {
    id: 'cable-tester', from: 'pip', name: 'Pip’s pocket cable tester', issue: 'cable-unplugged',
    gift: 'A little yellow box with blinking lights. “Found it in my car. You need it more. Ribbit. – Pip”',
    fixLabel: 'Check the line with the cable tester, then plug it back in',
    notes: [
      { text: 'Cable tester: its lights show whether a network cable works end to end. Test before blaming the PC.', right: true },
      { text: 'The cable tester charges laptops.' },
      { text: 'Only use the cable tester on the router.' },
    ],
  },
  {
    id: 'restart-stickers', from: 'marlo', name: 'Marlo’s restart stickers', issue: 'slow-laptop',
    gift: 'A roll of stickers: “HAVE YOU RESTARTED THIS WEEK?” and a note: “Fine. You were right. – Marlo”',
    fixLabel: 'Restart it, install updates, and stick a reminder on the lid',
    notes: [
      { text: 'Slow laptop: check the last restart first. Restart and update; a sticker reminds them to do it weekly.', right: true },
      { text: 'Stickers make laptops faster.' },
      { text: 'Order a new laptop and put a sticker on it.' },
    ],
  },
  {
    id: 'batteries', from: 'biscuit', name: 'Biscuit’s battery jar', issue: 'mouse-battery',
    gift: 'A jar of AA batteries with a bow on it. “For emergencies!! – Biscuit”',
    fixLabel: 'Swap in batteries from Biscuit’s jar',
    notes: [
      { text: 'Battery jar on the desk: dead wireless mouse or keyboard means fresh batteries first.', right: true },
      { text: 'AA batteries fix printers.' },
      { text: 'Charge AA batteries by plugging the mouse into a laptop.' },
    ],
  },
  {
    id: 'cheat-sheet', from: 'sam', name: 'Sam’s password cheat sheet', issue: 'password-expired',
    gift: 'In the bottom drawer of the filing cabinet: a folded sheet in Sam’s handwriting. “How to walk people through changing their own password. The runbook has this backwards. – Sam”',
    fixLabel: 'Follow Sam’s cheat sheet while they change it themselves',
    notes: [
      { text: 'Expired password: the owner changes it themselves, following Sam’s step-by-step sheet. IT never learns it.', right: true },
      { text: 'Read the new password out to them from the sheet.' },
      { text: 'Write everyone’s passwords on the cheat sheet.' },
    ],
  },
];
