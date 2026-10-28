import type { Ticket } from './types.ts';

/**
 * What Clover, Moss, Tansy and Hector bring to the Service Desk, and a few from the old hands, so every morning has
 * something in the tray from 9:05 on. All everyday problems, low or normal priority, and calm callers: nobody in
 * here is an emergency. The ids carry on after each day's own (t211 is day 2's eleventh slot, t2411 is day 24's).
 * Moss is out in the van from a quarter to ten, so most of his turn up first thing, while he's at his desk.
 */
export const NEW_STAFF_TICKETS: Ticket[] = [
  // Day 1: the tutorial. One simple extra, after ten.
  {
    id: 't111', day: 1, at: '11:05', who: 'clover', via: 'tray', priority: 'normal', issue: 'paper-jam', mood: 0,
    title: 'Label printer has stopped',
    message: 'One: the label printer in the stockroom has stopped. Two: forty parcels are waiting for labels. Three: I have counted them. Counted.',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 1', ask: 'screen' },
      { label: 'Tray 1', text: 'A sheet of labels has curled up on the roller.', ask: 'tray' },
    ],
    workaround: 'Write the first few addresses by hand',
  },
  // Day 2
  {
    id: 't211', day: 2, at: '9:05', who: 'moss', via: 'tray', priority: 'low', issue: 'airplane-mode', mood: 0,
    title: 'Van laptop’s gone offline',
    message: 'Morning, chief. Hm hm hmmm. My laptop won’t get the day’s manifest. No internet. I did nothing. Well, I did nothing on purpose.',
    details: [
      { label: 'Moss’s laptop', text: 'Airplane mode: ON (since the tunnel on Friday)', ask: 'settings' },
      { label: 'Dispatch', text: 'Everyone else at the dispatch desk is online.', ask: 'others' },
    ],
    workaround: 'Print the manifest from Clover’s PC',
  },
  {
    id: 't212', day: 2, at: '9:45', who: 'clover', via: 'tray', priority: 'normal', issue: 'cable-unplugged', mood: 1,
    title: 'Stockroom PC has no network',
    message: 'One: the stockroom PC says no network. Two: I have not touched it. Three: the forklift has. Counted.',
    details: [
      { label: 'PC screen', text: 'Network cable unplugged.', ask: 'screen' },
      { label: 'Under the desk', text: 'The cable is lying on the floor with a tyre mark across it.', ask: 'under' },
      { label: 'Forklift log', text: 'One reversing incident, 8:20, logged by Clover.', ask: 'cleaners' },
    ],
    workaround: 'Use the hot-desk PC for dispatch',
  },
  {
    id: 't213', day: 2, at: '10:40', who: 'hector', via: 'tray', priority: 'normal', issue: 'caps-lock', mood: 1,
    title: 'Payroll login rejected',
    message: 'My password has been rejected three times (09:58, 10:01, 10:03). I did not change it. For the record. Payroll is Thursday.',
    details: [
      { label: 'His keyboard', text: 'The Caps Lock light is on. (Pip borrowed the desk yesterday.)', ask: 'keyboard' },
      { label: 'Login screen', text: 'Password incorrect. 1 try left before the account is locked.', ask: 'error' },
      { label: 'Changed?', text: 'No. Hector would have written it down.', ask: 'changed' },
    ],
    workaround: 'Let him use the hot-desk PC for the spreadsheet',
  },
  // Day 3
  {
    id: 't311', day: 3, at: '9:05', who: 'tansy', via: 'tray', priority: 'normal', issue: 'wrong-charger', mood: 0,
    title: 'Laptop stuck at 6%',
    message: 'Good morning! My laptop has been plugged in all night and it’s at 6%. I’ve got a client call at ten. Can we close this by then? Deal?',
    details: [
      { label: 'Charger on her desk', text: 'Her phone charger. 20W, glittery case.', ask: 'charger' },
      { label: 'Laptop sticker', text: 'Use a 65W or higher USB-C charger.', ask: 'sticker' },
    ],
    workaround: 'Lend her your own charger for the morning',
  },
  {
    id: 't312', day: 3, at: '9:50', who: 'clover', via: 'tray', priority: 'low', issue: 'mouse-battery', mood: 0,
    title: 'Stockroom mouse is dead',
    message: 'One: the mouse is dead. Two: I need it to print the pick lists. Three: IT may not update it. Counted.',
    details: [
      { label: 'Mouse', text: 'Wireless. The little light underneath is off.', ask: 'kind' },
      { label: 'Keyboard', text: 'Typing is fine.', ask: 'keyboard' },
      { label: 'Spares tin', text: 'A tin of AA batteries on the shelf, labelled in Clover’s handwriting.' },
    ],
    workaround: 'Lend her the spare wired mouse',
  },
  {
    id: 't313', day: 3, at: '11:15', who: 'hector', via: 'tray', priority: 'normal', issue: 'monitor-input', mood: 1,
    title: 'Second screen says no signal',
    message: 'My second screen went blank at 11:02 (11:02, precisely). I need two screens for payroll. I have a spreadsheet on each. Well, I had.',
    details: [
      { label: 'Monitor', text: 'No signal – HDMI 2', ask: 'screen' },
      { label: 'Back of the monitor', text: 'Cable plugged into: HDMI 1', ask: 'cable' },
      { label: 'Power light', text: 'On, steady blue.', ask: 'power' },
    ],
    workaround: 'Work from one screen and scroll a lot',
  },
  // Day 4
  {
    id: 't411', day: 4, at: '9:05', who: 'moss', via: 'tray', priority: 'low', issue: 'guest-wifi', mood: 0,
    title: 'Can’t see the shared drive',
    message: 'Chief. Hm hm. Internet’s fine at the depot but the shared drive’s gone missing. I’ve got the van to load and a manifest I can’t open.',
    details: [
      { label: 'Moss’s Wi-Fi', text: 'Connected to: Burrow-Guest', ask: 'network' },
      { label: 'Depot notice', text: 'Staff Wi-Fi password: on the fridge. (The depot has no fridge.)', ask: 'password' },
    ],
    workaround: 'Open the manifest from his phone',
  },
  {
    id: 't412', day: 4, at: '10:48', who: 'clover', via: 'tray', priority: 'normal', issue: 'slow-laptop', mood: 1,
    title: 'Stockroom laptop crawling',
    message: 'One: it is slow. Two: it has been slow since the last update. Three: I have not allowed another one. This is related. Counted.',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 52 days ago. 23 updates waiting. (Clover keeps clicking “Not now”.)', ask: 'uptime' },
      { label: 'Disk', text: '38% used. Mostly spreadsheets of boxes.', ask: 'disk' },
    ],
    workaround: 'Close the stock sheets she isn’t using',
  },
  {
    id: 't413', day: 4, at: '11:25', who: 'hector', via: 'tray', priority: 'normal', issue: 'password-expired', mood: 1,
    title: 'Email wants a new password on payroll Thursday',
    message: 'My email has asked me to change my password (11:21). It is payroll Thursday. I would like to do this correctly, and I would like to be told how.',
    details: [
      { label: 'Email app', text: 'Your password has expired. Change it to continue.', ask: 'error' },
      { label: 'Where', text: 'Just email. His laptop let him in fine at 8:45.', ask: 'where' },
    ],
    workaround: 'Let him read his email on the hot-desk PC',
  },
  // Day 5
  {
    id: 't511', day: 5, at: '9:48', who: 'tansy', via: 'tray', priority: 'normal', issue: 'caps-lock', mood: 1,
    title: 'Password “wrong” again',
    message: 'I typed my password four times and it says wrong. I typed it on my phone first, to check. It’s definitely right. Shake on it?',
    details: [
      { label: 'Her keyboard', text: 'The Caps Lock light is on. She had a post-it saying “FRIDAY” stuck to the key.', ask: 'keyboard' },
      { label: 'Login screen', text: 'Password incorrect. Account not locked.', ask: 'error' },
      { label: 'Changed?', text: 'Same one since she joined.', ask: 'changed' },
    ],
    workaround: 'Let her check email on her phone',
  },
  // Day 6
  {
    id: 't611', day: 6, at: '9:05', who: 'moss', via: 'tray', priority: 'low', issue: 'slow-laptop', mood: 0,
    title: 'Van laptop’s gone slow',
    message: 'Chief. Hm hm hmmm. The laptop’s slow as a Sunday. It lives in the van. It has opinions about the cold.',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 34 days ago. 14 updates waiting. (Slept in the van, mostly.)', ask: 'uptime' },
      { label: 'Disk', text: '27% used. Mostly map tiles.', ask: 'disk' },
    ],
    workaround: 'Use his phone for the route',
  },
  {
    id: 't612', day: 6, at: '9:55', who: 'tansy', via: 'tray', priority: 'low', issue: 'mouse-battery', mood: 0,
    title: 'Mouse gave up on me',
    message: 'My mouse died mid-proposal. Not a good look. Can you save me before my ten-thirty? Let’s close this.',
    details: [
      { label: 'Mouse', text: 'Wireless. Light underneath: off. Clicking: nothing.', ask: 'kind' },
      { label: 'Keyboard', text: 'Typing is fine.', ask: 'keyboard' },
    ],
    workaround: 'Lend her the spare wired mouse',
  },
  {
    id: 't613', day: 6, at: '10:53', who: 'clover', via: 'tray', priority: 'normal', issue: 'printer-driver', mood: 1,
    title: 'New label printer won’t install',
    message: 'One: we have a new label printer. Two: it came with a CD. Three: my laptop has nowhere to put a CD. Counted.',
    details: [
      { label: 'Laptop sticker', text: 'Ports: 2× USB-C. No disc drive.', ask: 'ports' },
      { label: 'In her hand', text: 'A CD labelled “Drivers”. Dated 2011.', ask: 'how' },
      { label: 'Printer', text: 'The grey one by the loading bay.', ask: 'printer' },
    ],
    workaround: 'Print the labels from the old printer for now',
  },
  {
    id: 't614', day: 6, at: '11:30', who: 'otis', via: 'tray', priority: 'normal', issue: 'cable-unplugged', mood: 0,
    title: 'No network at the window desk',
    message: 'My desk PC says there is no network. I have sat here eleven years. It has never said this before.',
    details: [
      { label: 'PC screen', text: 'Network cable unplugged.', ask: 'screen' },
      { label: 'Under the desk', text: 'The cable is curled beside a pair of shoes that aren’t his.', ask: 'under' },
    ],
    workaround: 'Let him use the hot-desk PC',
  },
  // Day 7
  {
    id: 't711', day: 7, at: '9:05', who: 'moss', via: 'tray', priority: 'low', issue: 'wrong-charger', mood: 0,
    title: 'Laptop won’t charge in the van',
    message: 'Chief. Hm hm hmmm. Laptop’s on 8% and the van charger’s been in all week. It says it’s charging. It’s fibbing.',
    details: [
      { label: 'Van charger', text: 'Cigarette-lighter USB. 12W. Sold as “fast”.', ask: 'charger' },
      { label: 'Laptop sticker', text: 'Use a 65W or higher USB-C charger.', ask: 'sticker' },
    ],
    workaround: 'Lend him your charger for the round',
  },
  {
    id: 't712', day: 7, at: '9:54', who: 'hector', via: 'tray', priority: 'normal', issue: 'slow-laptop', mood: 1,
    title: 'Payroll spreadsheet takes a minute to open',
    message: 'The payroll spreadsheet now takes 61 seconds to open (09:41, timed). It took 12 last month. Something has changed. I would like to know what.',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 29 days ago. 9 updates waiting. (He never shuts down: “in case it doesn’t come back”.)', ask: 'uptime' },
      { label: 'Disk', text: '44% used.', ask: 'disk' },
    ],
    workaround: 'Open the file before his tea and let it think',
  },
  {
    id: 't713', day: 7, at: '11:08', who: 'clover', via: 'tray', priority: 'normal', issue: 'default-printer', mood: 1,
    title: 'Labels come out in the office',
    message: 'One: the labels are printing on the big printer in the office. Two: the label printer is eleven feet from me. Three: I want to know why. Counted.',
    details: [
      { label: 'Print settings', text: 'Default printer: OFFICE-LaserJet', ask: 'settings' },
      { label: 'Label printer', text: 'Sitting there, ready. Not one label.', ask: 'near' },
      { label: 'Stockroom', text: 'Moss prints his manifest fine. Pip prints his cookbook fine.', ask: 'others' },
    ],
    workaround: 'Walk to the office and collect the labels',
  },
  // Day 8
  {
    id: 't811', day: 8, at: '9:05', who: 'tansy', via: 'tray', priority: 'normal', issue: 'slow-laptop', mood: 1,
    title: 'Laptop’s slower than Marlo’s emails',
    message: 'My laptop takes ages to open the CRM and I have a pipeline to look after. A slow laptop is a lost sale. Fix it by lunch? Deal?',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 38 days ago. 16 updates waiting.', ask: 'uptime' },
      { label: 'Disk', text: '52% used. Mostly photos of contracts being signed.', ask: 'disk' },
    ],
    workaround: 'Close the 30 browser tabs she “needs”',
  },
  {
    id: 't812', day: 8, at: '10:09', who: 'biscuit', via: 'tray', priority: 'normal', issue: 'printer-driver', mood: 0,
    title: 'New printer for the kitchen!!',
    message: 'We have a new printer for the kitchen!! For the menu!! My laptop doesn’t want to talk to it!! I have the CD!!',
    details: [
      { label: 'Laptop sticker', text: 'Ports: 2× USB-C. No disc drive.', ask: 'ports' },
      { label: 'In her hand', text: 'A CD with a sticker that says “happy”.', ask: 'how' },
    ],
    workaround: 'Handwrite the menu',
  },
  {
    id: 't813', day: 8, at: '11:19', who: 'clover', via: 'tray', priority: 'normal', issue: 'guest-wifi', mood: 1,
    title: 'Stock sheet not found',
    message: 'One: the shared stock sheet says “not found”. Two: the internet works. Three: Moss connected my laptop on Friday and hummed. Counted.',
    details: [
      { label: 'Clover’s Wi-Fi', text: 'Connected to: Burrow-Guest', ask: 'network' },
      { label: 'Sticky note', text: 'Staff Wi-Fi password is on the other sticky note. Under the loading bay phone.', ask: 'password' },
    ],
    workaround: 'Copy the stock sheet from Pip’s USB stick',
  },
  // Day 9
  {
    id: 't911', day: 9, at: '9:48', who: 'hector', via: 'tray', priority: 'normal', issue: 'password-expired', mood: 2,
    title: 'Email wants a new password. Today.',
    message: 'It is payroll Thursday and my email says my password has expired (09:46). I have every payslip to check. I cannot be locked out today. For the record.',
    details: [
      { label: 'Email app', text: 'Your password has expired. Change it to continue.', ask: 'error' },
      { label: 'Where', text: 'Just email. His laptop let him in fine at 8:45.', ask: 'where' },
    ],
    workaround: 'Let him read his email on the hot-desk PC',
  },
  {
    id: 't912', day: 9, at: '10:43', who: 'pip', via: 'tray', priority: 'low', issue: 'mouse-battery', mood: 0,
    title: 'Mouse has gone stiff',
    message: 'My mouse stopped. I tapped it twice. Nothing. It’s a good mouse. I like it.',
    details: [
      { label: 'Mouse', text: 'Wireless. The light underneath is off.', ask: 'kind' },
      { label: 'Keyboard', text: 'Typing is fine.', ask: 'keyboard' },
    ],
    workaround: 'Lend him the spare wired mouse',
  },
  {
    id: 't913', day: 9, at: '11:20', who: 'dot', via: 'tray', priority: 'normal', issue: 'slow-laptop', mood: 1,
    title: 'Laptop dragging in front of the auditors',
    message: 'My laptop is slow. The auditors are watching me wait for it. It is the worst thing that has happened to me this year.',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 18 days ago. 7 updates waiting.', ask: 'uptime' },
      { label: 'Disk', text: '33% used.', ask: 'disk' },
    ],
    workaround: 'Hand the auditors the paper copies',
  },
  // Day 10
  {
    id: 't1011', day: 10, at: '9:44', who: 'tansy', via: 'tray', priority: 'normal', issue: 'guest-wifi', mood: 1,
    title: 'Can’t reach the shared drive at a client',
    message: 'I’m at a client’s with my laptop. I’m on their Wi-Fi, and our shared drive says not found. I’m about to present. Help me close this?',
    details: [
      { label: 'Tansy’s Wi-Fi', text: 'Connected to: Burrow-Guest. (She came in this morning on the way to the client, and never switched.)', ask: 'network' },
      { label: 'Sticky note', text: 'Staff Wi-Fi password: in her other bag.', ask: 'password' },
    ],
    workaround: 'Email the deck to herself and open it that way',
  },
  {
    id: 't1012', day: 10, at: '10:23', who: 'pip', via: 'tray', priority: 'normal', issue: 'wrong-charger', mood: 0,
    title: 'My laptop is hungry',
    message: 'My laptop charges at the speed of a snail. It’s on a charger that fits. Is it not hungry?',
    details: [
      { label: 'Charger', text: 'USB-C, 18W. Says “phone” on it.', ask: 'charger' },
      { label: 'Laptop sticker', text: 'Use a 65W or higher USB-C charger.', ask: 'sticker' },
    ],
    workaround: 'Lend him your own charger',
  },
  // Day 11
  {
    id: 't1111', day: 11, at: '9:05', who: 'moss', via: 'tray', priority: 'low', issue: 'mouse-battery', mood: 0,
    title: 'Dispatch mouse conked out',
    message: 'Chief. Hm hm hmmm. The mouse at the dispatch desk’s given up. I’ve got fourteen drops to print.',
    details: [
      { label: 'Mouse', text: 'Wireless. No light underneath.', ask: 'kind' },
      { label: 'Keyboard', text: 'Typing works.', ask: 'keyboard' },
    ],
    workaround: 'Use the trackpad and complain',
  },
  {
    id: 't1112', day: 11, at: '10:15', who: 'tansy', via: 'tray', priority: 'normal', issue: 'monitor-input', mood: 1,
    title: 'Meeting-room screen is blank',
    message: 'I’ve got a client demo at 10:30 and the meeting-room screen just says no signal. I’d like to look good. Let’s make it happen? Deal?',
    details: [
      { label: 'Big screen', text: 'No signal – HDMI 1', ask: 'screen' },
      { label: 'Wall plate', text: 'Her cable is in the socket marked HDMI 3.', ask: 'cable' },
      { label: 'Power light', text: 'On, steady.', ask: 'power' },
    ],
    workaround: 'Present from her laptop screen, standing close',
  },
  {
    id: 't1113', day: 11, at: '11:19', who: 'juniper', via: 'tray', priority: 'low', issue: 'wrong-charger', mood: 0,
    title: 'Laptop battery!! Help!!',
    message: 'My laptop’s on 4% and I’m charging it with the charger from my desk lamp!! It looked right!!',
    details: [
      { label: 'Charger', text: 'USB-C, 20W. From a desk lamp.', ask: 'charger' },
      { label: 'Laptop sticker', text: 'Use a 65W or higher USB-C charger.', ask: 'sticker' },
    ],
    workaround: 'Lend her your own charger',
  },
  // Day 12
  {
    id: 't1211', day: 12, at: '9:05', who: 'moss', via: 'tray', priority: 'low', issue: 'monitor-input', mood: 0,
    title: 'Dispatch screen is blue',
    message: 'Chief. Hm hm. The dispatch screen’s gone blue and says no signal. I like blue, but not for the manifest.',
    details: [
      { label: 'Monitor', text: 'No signal – HDMI 2', ask: 'screen' },
      { label: 'Back of the monitor', text: 'Cable plugged into: HDMI 1', ask: 'cable' },
    ],
    workaround: 'Read the manifest off the laptop',
  },
  {
    id: 't1212', day: 12, at: '9:54', who: 'tansy', via: 'tray', priority: 'normal', issue: 'airplane-mode', mood: 1,
    title: 'No internet since the train',
    message: 'I switched my laptop to airplane mode on the train to stop it pinging, and now nothing loads. It’s a perfectly good laptop. Sold?',
    details: [
      { label: 'Tansy’s laptop', text: 'Airplane mode: ON (since the 7:42 train)', ask: 'settings' },
      { label: 'Around the Sales desks', text: 'Everyone else is online. Marlo is online loudly.', ask: 'others' },
    ],
    workaround: 'Tether her laptop to her phone',
  },
  {
    id: 't1213', day: 12, at: '11:19', who: 'hector', via: 'tray', priority: 'low', issue: 'mouse-battery', mood: 0,
    title: 'Mouse stopped at 11:12',
    message: 'My mouse stopped at 11:12 precisely. I was in the middle of a payslip. I’d rather not use the trackpad. It has opinions.',
    details: [
      { label: 'Mouse', text: 'Wireless. Light underneath: off.', ask: 'kind' },
      { label: 'Keyboard', text: 'Works. Typing is fine.', ask: 'keyboard' },
    ],
    workaround: 'Lend him the spare wired mouse',
  },
  // Day 13
  {
    id: 't1311', day: 13, at: '9:49', who: 'tansy', via: 'tray', priority: 'normal', issue: 'default-printer', mood: 1,
    title: 'My proposals have vanished',
    message: 'I printed three proposals. Not one came out at the Sales printer. Somebody’s getting my proposals. They’d better close the deal. Shake on it?',
    details: [
      { label: 'Print settings', text: 'Default printer: FINANCE-Floor2', ask: 'settings' },
      { label: 'Sales printer', text: 'Right there. Ready. Not one sheet.', ask: 'near' },
      { label: 'Around Sales', text: 'Marlo printed this morning with no trouble.', ask: 'others' },
    ],
    workaround: 'Ask Finance to bring her proposals down',
  },
  {
    id: 't1312', day: 13, at: '11:28', who: 'juniper', via: 'tray', priority: 'normal', issue: 'cable-unplugged', mood: 1,
    title: 'No internet at my desk!!',
    message: 'My desk PC lost the internet and I have a post to schedule!! It was fine at ten!! I did a little dance and then it wasn’t!!',
    details: [
      { label: 'PC screen', text: 'Network cable unplugged.', ask: 'screen' },
      { label: 'Under the desk', text: 'The cable is dangling. There is a chair castor on it.', ask: 'under' },
    ],
    workaround: 'Let her use the hot-desk PC',
  },
  // Day 14: Thursday, payroll day
  {
    id: 't1411', day: 14, at: '9:05', who: 'hector', via: 'tray', priority: 'normal', issue: 'locked-out', mood: 2,
    title: 'Locked out on payroll Thursday',
    message: 'My account is locked (08:58). It is payroll Thursday. I have every payslip to approve by noon. I have typed it correctly. I think.',
    details: [
      { label: 'Login screen', text: 'This account has been locked out. Contact your administrator.', ask: 'error' },
      { label: 'His phone', text: 'The email app has been trying his old password every five minutes since Monday.', ask: 'devices' },
    ],
    workaround: 'Let him use the hot-desk PC',
  },
  {
    id: 't1412', day: 14, at: '9:50', who: 'clover', via: 'tray', priority: 'normal', issue: 'admin-request', mood: 1,
    title: 'Label software wants admin',
    message: 'One: the label software wants “administrator” to install. Two: no. Three: I have not said no to everything, I have said no to that. Counted.',
    details: [
      { label: 'What', text: 'The label designer for the new printer. It says “administrator” and then a padlock.', ask: 'what' },
      { label: 'Company Portal', text: 'Label designer: available. One-click install, no admin needed.', ask: 'portal' },
    ],
    workaround: 'Write the labels in a spreadsheet',
  },
  {
    id: 't1413', day: 14, at: '11:19', who: 'marlo', via: 'tray', priority: 'normal', issue: 'wrong-charger', mood: 1,
    title: 'My laptop is on a diet',
    message: 'My laptop will not charge. It’s a premium laptop. It deserves premium electricity. I used the charger from my car.',
    details: [
      { label: 'Charger', text: 'A 12W car charger. “Premium” on the box.', ask: 'charger' },
      { label: 'Laptop sticker', text: 'Use a 65W or higher USB-C charger.', ask: 'sticker' },
    ],
    workaround: 'Lend him your own charger for the afternoon',
  },
  // Day 15
  {
    id: 't1511', day: 15, at: '9:44', who: 'tansy', via: 'tray', priority: 'normal', issue: 'password-expired', mood: 1,
    title: 'Email’s asking for something',
    message: 'My email keeps telling me to do something with my password and I’m between calls. I can’t stop selling to stop. Quick fix, then we close?',
    details: [
      { label: 'Email app', text: 'Your password has expired. Change it to continue.', ask: 'error' },
      { label: 'Where', text: 'Just email. Her laptop signed in fine this morning.', ask: 'where' },
    ],
    workaround: 'Let her read email on her phone',
  },
  {
    id: 't1512', day: 15, at: '10:48', who: 'juniper', via: 'tray', priority: 'low', issue: 'mouse-battery', mood: 0,
    title: 'Mouse is playing dead!!',
    message: 'My mouse just stopped!! I shook it!! I said please!! It’s a Friday and I have ideas to click!!',
    details: [
      { label: 'Mouse', text: 'Wireless. The light underneath is off.', ask: 'kind' },
      { label: 'Keyboard', text: 'Typing works fine.', ask: 'keyboard' },
    ],
    workaround: 'Lend her the spare wired mouse',
  },
  {
    id: 't1513', day: 15, at: '11:25', who: 'hector', via: 'tray', priority: 'normal', issue: 'paper-jam', mood: 1,
    title: 'Printer swallowed a payslip',
    message: 'The printer has swallowed a payslip (11:19). It says paper jam. It is a payslip. I would like it back. For the record.',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 2', ask: 'screen' },
      { label: 'Tray 2', text: 'Half a payslip, curled like a prawn.', ask: 'tray' },
    ],
    workaround: 'Print it again on the upstairs printer',
  },
  // Day 17
  {
    id: 't1711', day: 17, at: '9:05', who: 'moss', via: 'tray', priority: 'low', issue: 'password-expired', mood: 0,
    title: 'Email wants a new password',
    message: 'Chief. Hm hm hmmm. My email says my password’s expired. I was in a lay-by when it said so. I don’t do passwords in lay-bys.',
    details: [
      { label: 'Email app', text: 'Your password has expired. Change it to continue.', ask: 'error' },
      { label: 'Where', text: 'Just email. The laptop signed in fine.', ask: 'where' },
    ],
    workaround: 'Let him read email on his phone',
  },
  // Day 18
  {
    id: 't1811', day: 18, at: '9:05', who: 'moss', via: 'tray', priority: 'normal', issue: 'locked-out', mood: 0,
    title: 'Locked out. Hm.',
    message: 'Chief. Hm. My account’s locked. I changed my password at the weekend, in the van, to something clever. I’m the only one who knows what. Hm.',
    details: [
      { label: 'Login screen', text: 'This account has been locked out. Contact your administrator.', ask: 'error' },
      { label: 'His phone', text: 'The email app has been trying his OLD password every five minutes since Saturday.', ask: 'devices' },
    ],
    workaround: 'Let him use the dispatch desk PC',
  },
  {
    id: 't1812', day: 18, at: '9:54', who: 'tansy', via: 'tray', priority: 'normal', issue: 'forgot-password', mood: 1,
    title: 'Can’t remember my password',
    message: 'I changed my password on Friday in the lift, to something punchy, and I’ve got nothing. I’ve got a call at ten-thirty. Help me close this?',
    details: [
      { label: 'Login screen', text: 'The user name or password is incorrect. (2 tries so far)', ask: 'error' },
      { label: 'Active Directory', text: 'Account: tansy. Not locked out.' },
    ],
    workaround: 'Let her use the hot-desk PC',
  },
  {
    id: 't1813', day: 18, at: '11:09', who: 'dot', via: 'tray', priority: 'normal', issue: 'default-printer', mood: 1,
    title: 'My reports aren’t coming out',
    message: 'I printed the month-end report four times. It has not come out. Not once. I need to see paper. Paper is evidence.',
    details: [
      { label: 'Print settings', text: 'Default printer: OPERATIONS-Cupboard', ask: 'settings' },
      { label: 'Finance printer', text: 'Right there. Ready. Not a sheet.', ask: 'near' },
      { label: 'Around Finance', text: 'Otis printed fine a minute ago.', ask: 'others' },
    ],
    workaround: 'Ask Operations to bring her prints over',
  },
  // Day 19: Thursday, payroll day
  {
    id: 't1911', day: 19, at: '9:05', who: 'hector', via: 'tray', priority: 'normal', issue: 'forgot-password', mood: 2,
    title: 'I have forgotten my password',
    message: 'I have forgotten my password (08:51). I changed it last week as security advised. It is payroll Thursday. I have never forgotten a password. For the record.',
    details: [
      { label: 'Login screen', text: 'The user name or password is incorrect. (3 tries so far)', ask: 'error' },
      { label: 'Active Directory', text: 'Account: hector. Not locked out.' },
    ],
    workaround: 'Let him use the hot-desk PC',
  },
  {
    id: 't1912', day: 19, at: '9:55', who: 'clover', via: 'tray', priority: 'normal', issue: 'airplane-mode', mood: 1,
    title: 'Stockroom laptop is offline',
    message: 'One: the laptop is offline. Two: the label printer is fine. Three: the laptop and I have not been introduced since the fire alarm. Counted.',
    details: [
      { label: 'Clover’s laptop', text: 'Airplane mode: ON (since the fire alarm, “to stop it buzzing”)', ask: 'settings' },
      { label: 'Stockroom', text: 'Everyone else’s PCs are online.', ask: 'others' },
    ],
    workaround: 'Use the stockroom PC next to hers',
  },
  // Day 20
  {
    id: 't2011', day: 20, at: '9:44', who: 'tansy', via: 'tray', priority: 'normal', issue: 'wrong-charger', mood: 1,
    title: 'Laptop dying mid-pitch',
    message: 'My laptop’s at 5% and I’ve got a pitch at ten-thirty. I used my charger from the client’s waiting room. It’s very nice. It’s not helping. Deal?',
    details: [
      { label: 'Charger', text: 'A small USB-C one from the client’s waiting room. 18W.', ask: 'charger' },
      { label: 'Laptop sticker', text: 'Use a 65W or higher USB-C charger.', ask: 'sticker' },
    ],
    workaround: 'Lend her your own charger and pretend you didn’t',
  },
  {
    id: 't2012', day: 20, at: '10:48', who: 'hector', via: 'tray', priority: 'normal', issue: 'default-printer', mood: 1,
    title: 'Payslips printing to Sales',
    message: 'I printed the payslips and they did not come out here (10:41). Somewhere, someone has Dot’s payslip. For the record, this is not acceptable.',
    details: [
      { label: 'Print settings', text: 'Default printer: SALES-Floor1', ask: 'settings' },
      { label: 'Finance printer', text: 'Sitting there, ready. Nothing came out.', ask: 'near' },
      { label: 'Around Finance', text: 'Dot printed a minute ago and it came out here.', ask: 'others' },
    ],
    workaround: 'Walk to Sales and collect them yourself, quickly',
  },
  {
    id: 't2013', day: 20, at: '11:25', who: 'dot', via: 'tray', priority: 'normal', issue: 'caps-lock', mood: 1,
    title: 'My password is incorrect, apparently',
    message: 'The computer says my password is incorrect. It is not. It has been the same for twelve years. I have a witness. Otis.',
    details: [
      { label: 'Her keyboard', text: 'The Caps Lock light is on.', ask: 'keyboard' },
      { label: 'Login screen', text: 'Password incorrect. Account not locked.', ask: 'error' },
      { label: 'Changed?', text: 'Not in twelve years.', ask: 'changed' },
    ],
    workaround: 'Let her use the hot-desk PC',
  },
  // Day 21: the new floor
  {
    id: 't2111', day: 21, at: '9:05', who: 'moss', via: 'tray', priority: 'normal', issue: 'dhcp-full', mood: 1,
    title: 'Dispatch has no internet upstairs',
    message: 'Chief. Hm. Dispatch moved up with everyone and the laptop says no internet. The van has Wi-Fi and the van is the better office. Hm.',
    details: [
      { label: 'Connection', text: 'No internet. Address: 169.254.9.22', ask: 'address' },
      { label: 'Others', text: 'The first few up the stairs are fine. After that, nothing.', ask: 'others' },
      { label: 'Started', text: 'This morning, when everyone moved up.', ask: 'when' },
    ],
    workaround: 'Work from the van’s Wi-Fi',
  },
  {
    id: 't2112', day: 21, at: '9:55', who: 'tansy', via: 'tray', priority: 'normal', issue: 'slow-laptop', mood: 1,
    title: 'Laptop crawling on the new floor',
    message: 'My laptop is slow and I have a view and a pipeline. I can’t enjoy one without the other. Fix by lunch? Pleasure doing business.',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 21 days ago. 11 updates waiting.', ask: 'uptime' },
      { label: 'Disk', text: '47% used.', ask: 'disk' },
    ],
    workaround: 'Close the 40 tabs she “needs”',
  },
  {
    id: 't2113', day: 21, at: '10:49', who: 'hector', via: 'tray', priority: 'normal', issue: 'cable-unplugged', mood: 1,
    title: 'My PC has no network since the move',
    message: 'My PC lost its network at the move (10:12). I have checked it twice. It says cable. The cable is not in the wall. I did not move it.',
    details: [
      { label: 'PC screen', text: 'Network cable unplugged.', ask: 'screen' },
      { label: 'Under the desk', text: 'The cable is coiled on the carpet beside a removal box labelled “MISC”.', ask: 'under' },
    ],
    workaround: 'Let him use the hot-desk PC',
  },
  // Day 22
  {
    id: 't2211', day: 22, at: '9:05', who: 'moss', via: 'tray', priority: 'normal', issue: 'switch-port', mood: 1,
    title: 'Dispatch socket is dead',
    message: 'Chief. Hm. The network socket at the dispatch desk upstairs is dead. I’ve tried the cable at Clover’s desk and it works. Hm. So it’s not me.',
    details: [
      { label: 'Socket', text: 'No lights next to the cable. Not even a flicker.', ask: 'lights' },
      { label: 'Same cable', text: 'Works fine at Clover’s desk, three metres away.', ask: 'other' },
      { label: 'Network icon', text: 'Network cable unplugged. But it isn’t.', ask: 'icon' },
    ],
    workaround: 'Use the spare desk by the window',
  },
  {
    id: 't2212', day: 22, at: '9:54', who: 'hector', via: 'tray', priority: 'normal', issue: 'dns', mood: 1,
    title: 'Can’t find the intranet',
    message: 'The intranet is not there. Websites outside are there. The payroll guide is on the intranet. I have 14 questions. I have the time of each (09:41).',
    details: [
      { label: 'Browser', text: 'Can’t reach this page. intranet.burrow.local’s address couldn’t be found.', ask: 'error' },
      { label: 'Outside sites', text: 'All fine. He checked three. For the record.', ask: 'outside' },
      { label: 'Changed', text: 'Marlo “sped up the internet” for him on Friday (16:42). He has the email.', ask: 'changed' },
    ],
    workaround: 'Use a paper copy of last year’s payroll guide',
  },
  {
    id: 't2213', day: 22, at: '10:58', who: 'pip', via: 'tray', priority: 'normal', issue: 'slow-laptop', mood: 1,
    title: 'Laptop slow as a snail',
    message: 'My laptop is so slow it’s almost relaxing. But I can’t count staplers with it.',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 24 days ago. 10 updates waiting.', ask: 'uptime' },
      { label: 'Disk', text: '35% used. Mostly photos of staplers.', ask: 'disk' },
    ],
    workaround: 'Close everything he isn’t using',
  },
  // Day 23
  {
    id: 't2311', day: 23, at: '9:05', who: 'moss', via: 'tray', priority: 'normal', issue: 'wifi-deadspot', mood: 1,
    title: 'No Wi-Fi by the loading lift',
    message: 'Chief. Hm hm. The Wi-Fi at the dispatch end is all gone by the loading lift. One bar and then none. Hm hm. I’m not humming. That’s bad.',
    details: [
      { label: 'Bars', text: 'One, sometimes none.', ask: 'bars' },
      { label: 'Where', text: 'The far end of the new floor, by the loading lift.', ask: 'where' },
      { label: 'Others', text: 'Everyone at the dispatch end. Fine by the lifts.', ask: 'others' },
    ],
    workaround: 'Move dispatch next to the main lifts for the day',
  },
  {
    id: 't2312', day: 23, at: '10:05', who: 'tansy', via: 'tray', priority: 'normal', issue: 'guest-network', mood: 1,
    title: 'A client is early, no Wi-Fi',
    message: 'One of my clients is here early (not the investors, mine). He’s in the meeting room with a laptop and no internet. He’s looking at me. Let’s close this?',
    details: [
      { label: 'Who', text: 'A client from Brightfield Stationers. Visiting for the morning.', ask: 'who' },
      { label: 'Need', text: 'The internet and his slides, from his own laptop. Nothing of ours.', ask: 'need' },
      { label: 'Now', text: 'Not connected to anything yet. Looking at Tansy.', ask: 'now' },
    ],
    workaround: 'Give him a cup of tea while you sort it',
  },
  {
    id: 't2313', day: 23, at: '11:08', who: 'clover', via: 'tray', priority: 'normal', issue: 'ip-conflict', mood: 1,
    title: 'Label printer keeps dropping out',
    message: 'One: the label printer keeps dropping out. Two: it works for ten minutes, then not. Three: Moss typed something into it last week and hummed. Counted.',
    details: [
      { label: 'Printer screen', text: 'IP address conflict detected.', ask: 'message' },
      { label: 'When', text: 'Randomly. It works, then it doesn’t, then it does.', ask: 'when' },
      { label: 'Set up', text: 'Someone typed an address in by hand. It’s on a sticky note on the printer: “Moss, for speed”.', ask: 'set' },
    ],
    workaround: 'Print the labels from the old printer',
  },
  // Day 24: Thursday, payroll day
  {
    id: 't2411', day: 24, at: '9:05', who: 'hector', via: 'tray', priority: 'normal', issue: 'paper-jam', mood: 2,
    title: 'Payslip printer jammed on payroll Thursday',
    message: 'The printer jammed at 08:57. It is payroll Thursday. Every payslip is in that machine. I am not dramatic. I have timed this.',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 1', ask: 'screen' },
      { label: 'Tray 1', text: 'A payslip folded into the roller like a paper boat.', ask: 'tray' },
      { label: 'Around Finance', text: 'Nobody else has printed yet. It’s early.', ask: 'others' },
    ],
    workaround: 'Print the payslips upstairs and carry them down',
  },
  {
    id: 't2412', day: 24, at: '9:55', who: 'clover', via: 'tray', priority: 'normal', issue: 'dns', mood: 1,
    title: 'Delivery tracker can’t be found',
    message: 'One: the delivery tracker site says its address can’t be found. Two: every other site works. Three: Moss “sped up the stockroom PC” and hummed. Counted.',
    details: [
      { label: 'Browser', text: 'Can’t reach this page. tracker.burrow.local’s address couldn’t be found.', ask: 'error' },
      { label: 'Outside sites', text: 'All fine.', ask: 'outside' },
      { label: 'Changed', text: 'Moss set the stockroom PC to a public name server “for speed”. Clover has the sticky note.', ask: 'changed' },
    ],
    workaround: 'Phone the drivers instead of using the tracker',
  },
  {
    id: 't2413', day: 24, at: '11:10', who: 'pip', via: 'tray', priority: 'low', issue: 'monitor-input', mood: 0,
    title: 'Stationery screen is blue',
    message: 'The screen by the stationery cupboard says no signal. It’s an excellent blue. But I can’t read the delivery list.',
    details: [
      { label: 'Screen', text: 'No signal – HDMI 1', ask: 'screen' },
      { label: 'Cable', text: 'Plugged into HDMI 2. (A delivery driver bumped it, humming.)', ask: 'cable' },
    ],
    workaround: 'Print the delivery list',
  },
  // Day 25
  {
    id: 't2511', day: 25, at: '9:49', who: 'clover', via: 'tray', priority: 'low', issue: 'paper-jam', mood: 0,
    title: 'Party labels jammed',
    message: 'One: the party labels have jammed the label printer. Two: they say “Party”. Three: I do not approve of a party label. Counted.',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 1', ask: 'screen' },
      { label: 'Tray 1', text: 'A sheet of “PARTY!” labels, stuck halfway through the roller.', ask: 'tray' },
    ],
    workaround: 'Write the party labels by hand',
  },
  {
    id: 't2512', day: 25, at: '10:58', who: 'hector', via: 'tray', priority: 'low', issue: 'airplane-mode', mood: 0,
    title: 'No internet. I have done nothing.',
    message: 'My laptop has no internet (10:44). Payroll is done. I would like to look at the numbers one last time, for comfort. I have done nothing wrong.',
    details: [
      { label: 'Hector’s laptop', text: 'Airplane mode: ON (since the call with the bank, to stop it buzzing)', ask: 'settings' },
      { label: 'Finance corner', text: 'Everyone else is online.', ask: 'others' },
    ],
    workaround: 'Let him read the numbers on Dot’s screen',
  },
];
