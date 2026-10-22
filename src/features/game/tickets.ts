import type { Issue, Ticket } from './types.ts';

export const ISSUES: Issue[] = [
  {
    id: 'paper-jam',
    title: 'Printer not printing',
    skill: 'devices',
    page: { status: 'ok', text: 'Read the printer’s own screen first. If it says jam, clear the tray it names.' },
    fixes: [
      { id: 'jam', label: 'Clear the paper jam in the tray the printer names' },
      { id: 'ink', label: 'Order a new ink cartridge', fail: 'The new ink arrives. The printer is still jammed.' },
      { id: 'driver', label: 'Reinstall the printer driver', fail: 'Twenty minutes later... still jammed.' },
    ],
    correctFix: 'jam',
    notes: [
      { text: 'Printer screen said paper jam. Cleared the tray. Ink was fine.', right: true },
      { text: 'Printer out of ink. Ordered more.' },
      { text: 'Driver was broken. Reinstalled it.' },
    ],
    why: 'Believe the device before the description. The printer’s own screen said paper jam. People describe what they think is wrong, not what is wrong.',
  },
  {
    id: 'airplane-mode',
    title: 'Laptop has no internet',
    skill: 'networks',
    page: { status: 'missing', text: '(This page has been torn out.)' },
    fixes: [
      { id: 'airplane', label: 'Turn off airplane mode' },
      { id: 'router', label: 'Restart the office router', fail: 'You knocked everyone else offline. Their laptop is still offline.' },
      { id: 'isp', label: 'Contact the internet provider', fail: 'The provider says the internet is fine. It is.' },
    ],
    correctFix: 'airplane',
    notes: [
      { text: 'Only one laptop offline: airplane mode was on. Turned it off.', right: true },
      { text: 'Whole office internet down. Restarted the router.' },
      { text: 'Internet provider outage.' },
    ],
    why: 'Check the scope first: is it one person or everyone? If everyone else is fine, the problem is on that one device. Airplane mode turns off Wi-Fi completely.',
  },
  {
    id: 'slow-laptop',
    title: 'Laptop running slow',
    skill: 'devices',
    page: { status: 'outdated', text: 'Slow laptop? Request a new laptop from Purchasing. (Written 2009)' },
    fixes: [
      { id: 'restart', label: 'Restart it and install the waiting updates' },
      { id: 'new', label: 'Order a new laptop', fail: 'Budget freeze. Mr. Grisby honks at the order form.' },
      { id: 'delete', label: 'Delete files to free up space', fail: 'Their holiday photos are gone. Still slow.' },
    ],
    correctFix: 'restart',
    notes: [
      { text: 'Laptop hadn’t restarted in weeks. Restart plus updates fixed it. Don’t order new ones.', right: true },
      { text: 'Laptop too old. Needs replacing.' },
      { text: 'Disk full. Deleted files.' },
    ],
    why: 'A restart plus updates fixes most slow laptops. The old runbook said to buy a new one, but it was written in 2009, and there’s a budget freeze.',
  },
  {
    id: 'wrong-charger',
    title: 'Laptop won’t charge',
    skill: 'devices',
    page: { status: 'outdated', text: 'Laptop won’t charge? The battery is dead. Order a replacement.' },
    fixes: [
      { id: 'swap', label: 'Swap to a 65W laptop charger' },
      { id: 'battery', label: 'Order a new battery', fail: 'Budget freeze. And the battery was fine.' },
      { id: 'reset', label: 'Reset the laptop to factory settings', fail: 'All their files are gone. Battery: 3%.' },
    ],
    correctFix: 'swap',
    notes: [
      { text: 'Was using a small phone charger. Laptops need 65W or more.', right: true },
      { text: 'Battery dead. Ordered a new one.' },
      { text: 'Software fault. Reset the laptop.' },
    ],
    why: 'Laptops need more power than phones. A small phone charger can’t keep up, so the battery barely moves. Check the charger against the laptop’s sticker.',
  },
  {
    id: 'printer-driver',
    title: 'Adding a printer',
    skill: 'devices',
    page: { status: 'outdated', text: 'Install the printer driver from the CD in the top drawer.' },
    fixes: [
      { id: 'download', label: 'Download the current driver from the printer maker’s website' },
      { id: 'cd', label: 'Find a laptop with a CD drive', fail: 'The oldest laptop in the building has no CD drive either.' },
      { id: 'usb', label: 'Run a long USB cable to the printer', fail: 'Facilities has asked you to stop.' },
    ],
    correctFix: 'download',
    notes: [
      { text: 'New laptops have no CD drive. Get drivers from the maker’s website.', right: true },
      { text: 'Used the CD in the top drawer.' },
      { text: 'Printer broken. Needs replacing.' },
    ],
    why: 'Runbooks go out of date. Get drivers from the maker’s website so they’re current and safe.',
  },
  {
    id: 'guest-wifi',
    title: 'On Wi-Fi but can’t reach work files',
    skill: 'networks',
    page: { status: 'ok', text: 'Staff devices use Burrow-Staff. Burrow-Guest only reaches the internet, never the shared drive or printers.' },
    fixes: [
      { id: 'staff', label: 'Connect them to Burrow-Staff' },
      { id: 'router', label: 'Restart the router', fail: 'Everyone drops offline. They’re back on Burrow-Guest.' },
      { id: 'remap', label: 'Remove and re-add the shared drive', fail: 'Still “not found”. The guest network can’t see it.' },
    ],
    correctFix: 'staff',
    notes: [
      { text: 'Was on Burrow-Guest. Guest can’t see work files. Moved to Burrow-Staff.', right: true },
      { text: 'Shared drive was down.' },
      { text: 'Router needed a restart.' },
    ],
    why: 'Guest networks are kept apart from company files on purpose, so visitors can’t reach them. Staff need to be on the staff network.',
  },
  {
    id: 'monitor-input',
    title: 'Screen says “no signal”',
    skill: 'devices',
    page: { status: 'missing', text: '(Coffee stain. Unreadable.)' },
    fixes: [
      { id: 'input', label: 'Switch the screen’s input to the port the cable is in' },
      { id: 'replace', label: 'Swap in a different screen', fail: 'Budget freeze. There is no different screen.' },
      { id: 'driver', label: 'Update the graphics driver', fail: 'Updated. Still “No signal”.' },
    ],
    correctFix: 'input',
    notes: [
      { text: '“No signal” = screen looking at the wrong port. Switch input to match the cable.', right: true },
      { text: 'Monitor broken.' },
      { text: 'Graphics driver out of date.' },
    ],
    why: 'Screens and projectors with several ports only show one at a time. “No signal” often means it’s looking at the wrong port, not that it’s broken.',
  },
  {
    id: 'default-printer',
    title: 'Prints going to the wrong printer',
    skill: 'devices',
    page: { status: 'missing', text: '(Torn out. Someone wrote “sorry” in the margin.)' },
    fixes: [
      { id: 'default', label: 'Set their default printer to the one near their desk' },
      { id: 'restart', label: 'Restart the printer near their desk', fail: 'It restarts. Finance now has four more copies of the report.' },
      { id: 'toner', label: 'Replace the toner', fail: 'The toner was fine. The prints are upstairs.' },
    ],
    correctFix: 'default',
    notes: [
      { text: 'Prints vanishing = going to another printer. Check and set the default printer.', right: true },
      { text: 'Printer needed a restart.' },
      { text: 'Toner empty.' },
    ],
    why: 'Printing goes to whatever printer is set as the default. If prints vanish, check where they’re actually being sent.',
  },
  {
    id: 'admin-request',
    title: 'Someone asks for admin rights',
    skill: 'access',
    page: { status: 'outdated', text: 'Need software? Give the user admin rights so they can install it themselves.' },
    fixes: [
      { id: 'portal', label: 'Install the app for them from the Company Portal' },
      { id: 'admin', label: 'Give them full admin rights', fail: 'Against company rules. And they’ve now installed a game.' },
      { id: 'share', label: 'Lend them your login', fail: 'Never share logins. Now everything they do looks like you did it.' },
    ],
    correctFix: 'portal',
    notes: [
      { text: 'Apps in the Company Portal need no admin rights. Install from there. Least privilege.', right: true },
      { text: 'Gave admin rights.' },
      { text: 'Shared my login for a minute.' },
    ],
    why: 'Least privilege: give people only the access they need for the job. They needed one app, not control of the whole laptop. The old runbook page was dangerous.',
  },
  {
    id: 'cable-unplugged',
    title: 'Desk PC has no network',
    skill: 'networks',
    page: { status: 'ok', text: 'No network on a desk PC? Check the cable at both ends.' },
    fixes: [
      { id: 'plug', label: 'Plug the network cable back in' },
      { id: 'wifi', label: 'Buy a Wi-Fi card for the PC', fail: 'Budget freeze.' },
      { id: 'reinstall', label: 'Reinstall the operating system', fail: 'Four hours later: “Network cable unplugged.”' },
    ],
    correctFix: 'plug',
    notes: [
      { text: 'Cable knocked out (cleaners). Check the physical stuff first.', right: true },
      { text: 'Operating system broken.' },
      { text: 'Network card failed.' },
    ],
    why: 'Check the physical stuff first: is it plugged in, is it switched on? The PC told you exactly what was wrong.',
  },
  {
    id: 'password-expired',
    title: 'Can’t get into email',
    skill: 'access',
    page: { status: 'outdated', text: 'Password problems: IT sets a new password and tells the user what it is.' },
    fixes: [
      { id: 'walk', label: 'Walk them through changing their own password' },
      { id: 'expiry', label: 'Turn off password expiry just for them', fail: 'Security rules apply to everyone. The security team is not happy.' },
      { id: 'set', label: 'Set a new password for them and read it out', fail: 'Now you know their password. Never set someone else’s password for them.' },
    ],
    correctFix: 'walk',
    notes: [
      { text: 'Password expired. Owner changes it themselves; IT never learns it.', right: true },
      { text: 'Set a new password for them.' },
      { text: 'Email server down.' },
    ],
    why: 'Nothing was broken: the password had expired. People change their own passwords, so only they know them. The old runbook page had it backwards.',
  },
  {
    id: 'mouse-battery',
    title: 'Mouse stopped working',
    skill: 'devices',
    page: { status: 'missing', text: '(Nobody ever wrote this one down.)' },
    fixes: [
      { id: 'battery', label: 'Swap the mouse’s batteries' },
      { id: 'driver', label: 'Reinstall the mouse driver', fail: 'Driver reinstalled. The mouse is still dark.' },
      { id: 'new', label: 'Order a new mouse', fail: 'Budget freeze. Not even a mouse. It was in the memo.' },
    ],
    correctFix: 'battery',
    notes: [
      { text: 'Wireless mouse dead = flat battery. Spare AAs in the kitchen drawer.', right: true },
      { text: 'Mouse driver corrupted.' },
      { text: 'Mouse broken. Needs replacing.' },
    ],
    why: 'Wireless mice and keyboards run on batteries. If the light is off, try fresh batteries before anything else.',
  },
  {
    id: 'caps-lock',
    title: 'Password suddenly “wrong”',
    skill: 'access',
    page: { status: 'missing', text: '(Torn out.)' },
    fixes: [
      { id: 'caps', label: 'Turn off Caps Lock and try again' },
      { id: 'reset', label: 'Reset their password', fail: 'They now have a new password and still can’t type it. Caps Lock is on.' },
      { id: 'unlock', label: 'Unlock their account', fail: 'It wasn’t locked. Yet. One more try and it will be.' },
    ],
    correctFix: 'caps',
    notes: [
      { text: '“Password wrong”: check Caps Lock before resetting anything.', right: true },
      { text: 'Account locked. Unlocked it.' },
      { text: 'Forgot password. Reset it.' },
    ],
    why: 'Passwords care about capital letters. Check Caps Lock first: it saves a reset, and too many wrong tries can lock the account.',
  },
];

export const TICKETS: Ticket[] = [
  // Day 1
  {
    id: 't101', day: 1, at: '9:05', who: 'dot', via: 'walkup', where: 'Finance corner', priority: 'normal', issue: 'paper-jam', mood: 1,
    title: 'The printer is broken',
    message: 'The printer’s out of ink. I pressed print three times and nothing!',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 2. Ink: 70%' },
      { label: 'Print queue', text: '3 jobs waiting from Dot’s laptop' },
    ],
    workaround: 'Send it to the printer upstairs for now',
  },
  {
    id: 't102', day: 1, at: '9:50', who: 'juniper', via: 'tray', priority: 'high', issue: 'airplane-mode', mood: 2,
    title: 'The internet is down!!',
    message: 'Internet down for the WHOLE office. Please fix ASAP.',
    details: [
      { label: 'Around the office', text: 'Everyone else is happily online.' },
      { label: 'Juniper’s laptop', text: 'Airplane mode: ON' },
    ],
    workaround: 'Let her use the hot-desk PC for now',
  },
  {
    id: 'f101', day: 1, at: '11:30', who: 'biscuit', via: 'floor', where: 'Kitchen', priority: 'normal', issue: 'mouse-battery', mood: 0,
    title: 'Mouse stopped working',
    message: 'Oh! You’re here! Can you look at my mouse real quick? It just stopped.',
    details: [
      { label: 'Mouse', text: 'Wireless. The little light underneath is off.' },
      { label: 'Kitchen drawer', text: 'A pack of AA batteries, next to the tea bags.' },
    ],
    workaround: '',
  },
  // Day 2
  {
    id: 't201', day: 2, at: '9:10', who: 'marlo', via: 'walkup', where: 'Open office', priority: 'normal', issue: 'slow-laptop', mood: 1,
    title: 'My laptop is SO slow',
    message: 'It takes five minutes to open email. I need a new laptop.',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 41 days ago. 12 updates waiting.' },
      { label: 'Memo on his monitor', text: 'Budget freeze: no new hardware. – Grisby' },
    ],
    workaround: 'Close his 47 browser tabs for now',
  },
  {
    id: 't202', day: 2, at: '10:00', who: 'biscuit', via: 'tray', priority: 'normal', issue: 'wrong-charger', mood: 0,
    title: 'Battery dead, won’t charge',
    message: 'Battery is broken, charging all day and still at 3%. Need a new battery!',
    details: [
      { label: 'Charger on his desk', text: 'USB-C phone charger, 20W' },
      { label: 'Laptop sticker', text: 'Use a 65W or higher USB-C charger.' },
    ],
    workaround: 'Lend him your own charger for the day',
  },
  {
    id: 't203', day: 2, at: '13:30', who: 'pip', via: 'tray', priority: 'low', issue: 'paper-jam', mood: 0,
    title: 'Printer just blinks at me',
    message: 'The printer blinks orange and won’t print. Is it angry? Ribbit.',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 1' },
      { label: 'Tray 1', text: 'A crumpled sheet is wedged at the back.' },
    ],
    workaround: 'Print it on the upstairs printer',
  },
  {
    id: 'f201', day: 2, at: '14:40', who: 'otis', via: 'floor', where: 'Meeting room', priority: 'normal', issue: 'monitor-input', mood: 1,
    title: 'Projector shows nothing',
    message: 'My meeting starts in five minutes and the projector just says no signal. Hoo.',
    details: [
      { label: 'Projector', text: 'No signal – HDMI 1' },
      { label: 'Wall plate', text: 'His laptop cable is plugged into the socket marked HDMI 2.' },
    ],
    workaround: '',
  },
  // Day 3
  {
    id: 't301', day: 3, at: '9:15', who: 'pip', via: 'walkup', where: 'Open office', priority: 'normal', issue: 'printer-driver', mood: 1,
    title: 'Can’t add the printer',
    message: 'My new laptop can’t print. I followed the runbook! I found the CD!',
    details: [
      { label: 'Laptop sticker', text: 'Ports: 2× USB-C. No disc drive.' },
      { label: 'In his hand', text: 'A very shiny printer CD from 2011.' },
    ],
    workaround: 'Email the files to Dot and have her print them',
  },
  {
    id: 't302', day: 3, at: '10:20', who: 'otis', via: 'tray', priority: 'low', issue: 'guest-wifi', mood: 0,
    title: 'Wi-Fi works but shared drive doesn’t',
    message: 'Internet works fine but the shared drive says “not found”. Hoo.',
    details: [
      { label: 'Otis’s Wi-Fi', text: 'Connected to: Burrow-Guest' },
      { label: 'Sticky note', text: 'Forgot staff Wi-Fi password. Used the easy one.' },
    ],
    workaround: 'Copy the files he needs onto a USB stick',
  },
  {
    id: 't303', day: 3, at: '11:30', who: 'juniper', via: 'walkup', where: 'Open office', priority: 'normal', issue: 'monitor-input', mood: 2,
    title: 'My second screen is broken',
    message: 'The new screen just says no signal. I think it’s broken!',
    details: [
      { label: 'Monitor', text: 'No signal – HDMI 2' },
      { label: 'Back of the monitor', text: 'Cable plugged into: HDMI 1' },
    ],
    workaround: 'Tell her one screen is plenty for today',
  },
  {
    id: 't304', day: 3, at: '14:00', who: 'dot', via: 'tray', priority: 'normal', issue: 'password-expired', mood: 1,
    title: 'Email won’t let me in',
    message: 'Email keeps asking me for something. I don’t know what it wants.',
    details: [
      { label: 'Email app', text: 'Your password has expired. Change it to continue.' },
    ],
    workaround: 'Let her read email on her phone for now',
  },
  {
    id: 'f301', day: 3, at: '10:40', who: 'marlo', via: 'floor', where: 'Open office', priority: 'normal', issue: 'caps-lock', mood: 1,
    title: 'Password stopped working',
    message: 'You! Quick. My password stopped working. I haven’t changed it. I’ve typed it four times.',
    details: [
      { label: 'His keyboard', text: 'The Caps Lock light is on.' },
      { label: 'Login screen', text: 'Password incorrect. 1 try left before your account is locked.' },
    ],
    workaround: '',
  },
  // Day 4
  {
    id: 't401', day: 4, at: '9:20', who: 'biscuit', via: 'tray', priority: 'normal', issue: 'default-printer', mood: 1,
    title: 'My printing keeps vanishing',
    message: 'Printed my report 4 times, never comes out at the kitchen printer. (My desk is by the kitchen, floor 1.)',
    details: [
      { label: 'Print settings', text: 'Default printer: FINANCE-Floor2' },
      { label: 'Finance', text: 'Someone upstairs has four copies of a report about biscuits.' },
    ],
    workaround: 'Ask Finance to carry his prints down',
  },
  {
    id: 't402', day: 4, at: '10:10', who: 'marlo', via: 'walkup', where: 'Open office', priority: 'normal', issue: 'admin-request', mood: 0,
    title: 'Needs admin rights',
    message: 'I need full admin rights on my laptop. For... a spreadsheet plug-in. Definitely not a game.',
    details: [
      { label: 'Company Portal', text: 'Spreadsheet plug-in: available. One-click install, no admin needed.' },
      { label: 'Grisby’s memo', text: 'Nobody gets admin rights. Nobody.' },
    ],
    workaround: 'Tell him to use the web version of the spreadsheet for now',
  },
  {
    id: 't403', day: 4, at: '11:00', who: 'otis', via: 'walkup', where: 'Meeting room', priority: 'high', issue: 'airplane-mode', mood: 1,
    title: 'No internet on my laptop',
    message: 'I flew to my sister’s at the weekend. Now nothing loads. Hoo.',
    details: [
      { label: 'Otis’s laptop', text: 'Airplane mode: ON (since Saturday)' },
      { label: 'Around the office', text: 'Everyone else is online.' },
    ],
    workaround: 'Let him use the hot-desk PC',
  },
  {
    id: 't404', day: 4, at: '14:10', who: 'juniper', via: 'tray', priority: 'low', issue: 'slow-laptop', mood: 1,
    title: 'Laptop is crawling',
    message: 'My laptop takes forever to do anything. Can I have Marlo’s old one?',
    details: [
      { label: 'Laptop info', text: 'Last restarted: 26 days ago. 8 updates waiting.' },
    ],
    workaround: 'Close everything she isn’t using',
  },
  {
    id: 'f401', day: 4, at: '12:30', who: 'dot', via: 'floor', where: 'Finance corner', priority: 'normal', issue: 'paper-jam', mood: 1,
    title: 'Finance printer stuck',
    message: 'Since you’re walking past: the finance printer’s out of ink. Again. Probably.',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 1. Ink: 81%' },
    ],
    workaround: '',
  },
  // Day 5
  {
    id: 't501', day: 5, at: '9:10', who: 'pip', via: 'tray', priority: 'high', issue: 'cable-unplugged', mood: 2,
    title: 'Whole internet is down (again)',
    message: 'Internet totally gone on my desk PC since the cleaners came.',
    details: [
      { label: 'PC screen', text: 'Network cable unplugged.' },
      { label: 'Under the desk', text: 'A network cable lies on the floor next to the vacuum marks.' },
    ],
    workaround: 'Let him work from the hot-desk PC',
  },
  {
    id: 't502', day: 5, at: '10:00', who: 'grisby', via: 'walkup', where: 'Meeting room', priority: 'high', issue: 'password-expired', mood: 2,
    title: 'The boss’s email is broken',
    message: 'My email is BROKEN. Fix it. And don’t make me change any passwords, I don’t do that.',
    details: [
      { label: 'Email app', text: 'Your password expired 3 days ago. Change it to continue.' },
      { label: 'Under his keyboard', text: 'A sticky note with his old password on it.' },
    ],
    workaround: 'Read his emails out to him from his phone',
  },
  {
    id: 't503', day: 5, at: '11:15', who: 'biscuit', via: 'tray', priority: 'normal', issue: 'guest-wifi', mood: 0,
    title: 'Can’t open the team folder',
    message: 'The team folder says it doesn’t exist! But it does! I saw it yesterday!',
    details: [
      { label: 'Biscuit’s Wi-Fi', text: 'Connected to: Burrow-Guest' },
    ],
    workaround: 'Email him the files he needs',
  },
  {
    id: 't504', day: 5, at: '13:20', who: 'dot', via: 'walkup', where: 'Finance corner', priority: 'normal', issue: 'paper-jam', mood: 1,
    title: 'Printer’s broken AGAIN',
    message: 'The printer is broken again. I bet it’s the ink this time.',
    details: [
      { label: 'Printer screen', text: 'PAPER JAM – TRAY 2. Ink: 64%' },
    ],
    workaround: 'Send it to the printer upstairs',
  },
  {
    id: 'f501', day: 5, at: '10:30', who: 'juniper', via: 'floor', where: 'Meeting room', priority: 'normal', issue: 'monitor-input', mood: 2,
    title: 'Meeting room screen is blank',
    message: 'The big client is HERE and the screen is blank! Please please please.',
    details: [
      { label: 'Big screen', text: 'No signal – HDMI 2' },
      { label: 'Wall plate', text: 'Her cable is plugged into the socket marked HDMI 1.' },
    ],
    workaround: '',
  },
];
