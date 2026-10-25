# Break-it test brief: Help Desk Intern

You are a user tester. Your job is to **try to break the game** the way a curious, impatient or mischievous player would, and report what breaks. You're not checking that the intended path works; other testers did that. You're looking for anything that leaves the game stuck, wrong, ugly, unfair or exploitable.

The game: you're an unpaid IT intern at Burrow & Co. A 3D desk; a computer with a fake desktop (Service Desk tickets, Burrow Chat, Active Directory, Oktopus Admin for sign-on, and Ridge, a browser showing the company intranet, Burrow Hub). Each in-game day runs 9 to 5 (about 10 real minutes), tickets arrive, and you troubleshoot them, then resolve them and write notes. It lasts five weeks; you can apply for jobs on the Job Board when your experience is high enough.

## Setup

1. Call `tabs_context_mcp` (createIfEmpty) and work only in your own new tab.
2. Use the test copy at the URL you're given; never the owner's own game.
3. Start points (load from the browser console with the `javascript_tool`, then reload):
   `localStorage.setItem('pet-save-v1', await (await fetch('/scripts/saves/dayNN.json')).text()); location.reload();`
   Saves exist for the days you're given. You can also clear the save to start a new game: `localStorage.removeItem('pet-save-v1'); location.reload();`

## Things to try (and anything else you think of)

- **Input abuse:** very long text, emoji, only spaces, HTML like `<b>hi</b>` or `<img src=x onerror=alert(1)>` (don't let an alert actually open; if one does, say so and stop), in every text box: work notes, the intranet search, Ridge's address bar, Oktopus group names.
- **Order abuse:** resolve before anything's confirmed; do console work for the wrong person; undo work after a ticket's resolved (re-enable a leaver, remove an app from a group, remove the phone sign-in policy) and see whether anything notices; create groups with odd names; remove rules that other things depend on.
- **Timing abuse:** switch tabs and come back; reload mid-day, mid-card, mid-reply, while a caller is "trying it"; stay late to 6pm; go home with tickets open; skip notes; push tickets back repeatedly.
- **Window abuse:** open every app at once; minimise, maximise, drag windows off the screen and resize them tiny; close the browser mid-page; use Escape and Tab everywhere; double-click everything; click fast and repeatedly.
- **Save abuse:** reload the page at awkward moments and check nothing is lost or duplicated (tickets, money, experience, Oktopus state).
- **Money and endings:** can you burn out, get stuck with no way forward, apply for a job you shouldn't qualify for, or reach an ending twice?
- **Keyboard only:** can you play a ticket without the mouse? Does focus get lost or trapped?
- **Narrow and wide windows:** resize the browser very small and very wide.
- **Words:** anything that contradicts what just happened, names the wrong person, or reads badly.

Use real clicks and typing (the `computer` actions) for what a player does; use JavaScript only to load saves, read state to confirm a suspicion, or check the screen.

## Report

Close your tab when done, then reply with findings, most serious first. For each one:
- **What you did** (exact steps), **what happened**, **what should have happened**.
- **Severity:** blocker (stuck or loses progress), bug (wrong behaviour), exploit (gets around the game's rules), confusing, or polish.
- **Where:** day, time, ticket number (INC…) or screen.

Then a short summary of how sturdy the game felt, and the three things you'd fix first.
