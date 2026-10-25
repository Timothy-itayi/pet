# Playtest brief: one week of Help Desk Intern

You are playtesting a browser game, **Help Desk Intern**: an unpaid IT intern at a run-down company, Burrow & Co. You sit at a 3D desk; the old computer on it runs a fake desktop with a Service Desk (tickets), Burrow Chat, Active Directory, Oktopus Admin (single sign-on, from week 2), and Ridge, a browser showing the company intranet, Burrow Hub. Each in-game day runs 9am to 5pm on its own clock (about 10 real minutes), tickets arrive, and you troubleshoot them with the caller: ask questions, suggest fixes, do admin work in a console, then resolve and write a work note.

## Your job

Play the week you're given **as a real player would, through the game's own screens**, and report everything that's wrong, confusing, missing or broken. You're looking for gaps, not confirming it works.

- Use real mouse clicks and real typing (the Chrome tools' `computer` actions) for anything a player does. Only use JavaScript to load the save, read state to confirm a suspicion, or check what's on screen, never to play for you.
- Do the console work (Active Directory, Oktopus) the way the ticket and the IT Service Policy suggest. When a ticket is ambiguous, note what you tried and why.
- Read everything: ticket text, questions and answers, cards after resolving, the intranet news and feed, staff profiles. Wrong names, stale facts, text that contradicts what happened, and characters acting out of character are all findings.
- Try at least one wrong approach on purpose per Oktopus ticket (e.g. give an app to a person, or deactivate a mover) and check the game explains why it's wrong.
- Stop after the Friday of your week, or if you're truly stuck for more than 15 minutes of real time (that's a finding too).

## Setup

1. Call `tabs_context_mcp` (createIfEmpty) and work only in your own new tab.
2. Open the test copy of the game at the URL you were given (a separate address from the owner's own game, so its save is separate).
3. Load the starting save from the browser console (the `javascript_tool`):
   `localStorage.setItem('pet-save-v1', await (await fetch('/scripts/saves/dayNN.json')).text()); localStorage.setItem('pet:muted', '1'); location.reload();`
4. In the room, click the computer's power button (or the monitor), wait for it to boot, log in (the button on the lock screen), and play.
5. Tips: the clock only runs while the tab is visible and nothing is "held"; a card after resolving stops the clock until you dismiss it. 5pm closes the office; you can stay to 6. "Go home" ends the day; the next day starts with the computer off.

## Report

Close your tab when done. Reply with a findings list, most serious first. For each finding:
- **What happened** and **what you expected**, in plain words.
- **Where**: the day, time, ticket number (INC…) or screen.
- **Severity**: blocker (can't progress), bug (wrong behaviour), confusing (works but a player would get lost), or polish (text, looks).
- **How to repeat it**, briefly.

Then a short summary: which tickets you resolved, which you couldn't, the day-end results (goal met or not, savings), and your overall impression of the week as a player.
