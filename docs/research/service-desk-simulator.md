# Research: Service Desk Simulator (servicedesk-simulator.com)

Done 26 October 2026 by a research agent. Sources: the site's metadata and noscript text, its blog (about 65 posts at /blog/posts/*), its public JavaScript bundle, and Trustpilot (4.6 from 31 reviews). No sign-in. Public criticism is thin, so the "tedious" points are inference, not quotes.

## What it is
- A training product, "the flight simulator for helpdesk": free tier (five tickets and one voice call a day), Pro at $20 a month, and a classroom mode.
- **Loop:** pick a ticket from a ServiceNow-style queue (priority, SLA, category), verify the user, diagnose, fix it in a tool, then close with notes.
- **Tools:**
  - Active Directory, and remote desktop into a mock Windows PC;
  - a terminal with real ipconfig, ping and nslookup;
  - mail admin (message trace and quarantine), an MFA panel, asset shipping, a server room;
  - chat, AI voice calls, voicemail, a knowledge base, and mock interviews.
- **Clever touches:**
  - vague tickets ("my computer") that need a clarifying question;
  - the user's own stated cause can be wrong;
  - randomised hidden root causes;
  - outages that roll internal or ISP, with an ETA.
- **Progression:** points, ranked races, a leaderboard, streaks, certificates, and score penalties for skipped steps (with the reason shown).

## Players
- **Praise:** how detailed it is, chats that feel real, and hints and step explanations that teach.
- **Complaints:** some buggy tickets, and getting stuck.

## Ideas for us, best fun per effort first
1. The user's stated cause is wrong (small): a detective reveal.
2. Vague tickets that need one clarifying question (small).
3. Social engineering callers: refuse, after checking in Oktopus (small to medium).
4. Partial-score penalties for skipped steps, with a one-line reason (small).
5. Persona quirks in what people say (small).
6. Randomised hidden root cause for repeat tickets (medium).
7. Outage set-piece days: internal or ISP, with an intranet announcement and an ETA (medium).
8. Voicemail as a reading puzzle (small).
9. Wrong-host risk: two people called Alex, so confirm the asset tag (small).
10. Hardware logistics going wrong, extending the phone drawer (medium to large).

## Avoid
- Daily caps and grinding.
- Full-length procedures every time: let repeats collapse, or automate them in Workflows.
- Dead waiting time.
- Leaderboard and SLA pressure as the main motivation.
- Untestable tickets.
- A generic UI.

## For our network console, VPN and firewall
They use a small fixed fake network:
- 10.0.1.x, with the gateway on .1;
- DNS on 10.0.2.10 and .11;
- floor switches, a core router, a firewall, a DC and a print server.

There's no packet simulation. Fixes are named actions:
- flush or set DNS, re-enable the network card, static IP vs DHCP;
- remove a rogue DHCP server, extend the scope;
- reboot the router, firewall or a switch, replace a cable.

Users get stable fake IPs. VPN tickets cover connect, sign-in and second factor, flushing DNS over VPN, and mapped drives failing when the VPN is down. Closing needs proof that it works: the intranet loads, or the gateway pings.

**Recommendation:** copy this. Use a small fixed topology, a console with scripted ipconfig, ping and nslookup output, and fixes as named actions, with "prove it works" before closing. They have no firewall rule editing, so a hands-on rule table would be ours alone.
