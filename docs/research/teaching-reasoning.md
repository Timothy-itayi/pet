# Research: teaching how to think through a problem

Done 26 October 2026 by a research agent. Sections 1 and 2 are researched, with sources. Sections 3 to 5 are design proposals.

## Why
Timothy failed a help desk analyst interview because he couldn't explain how he was thinking through problems. Interviews ask, for example, "Wi-Fi is connected but there's no internet. How would you solve it, and what's your process?" Service Desk Simulator trains you to follow steps but never asks why. This game can teach the why, as role play.

## 1. What's proven to teach reasoning
- **Worked examples that fade into practice** (Renkl, Sweller): show one fully worked, then the learner does more and more of the steps. Adaptive fading works best, and the examples stop helping as expertise grows. https://en.wikipedia.org/wiki/Worked-example_effect · https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/worked-and-faded-examples
- **Self-explanation** (Chi): justifying each step improves transfer. Picking from a list beats open text. https://education.asu.edu/sites/default/files/lcl/self-explanation_effect.pdf · https://www.learningscientists.org/blog/2020/2/20-1
- **Hint ladders** (Aleven and Koedinger): hints go strategic, then procedural, then the answer. 36% of student actions were hint abuse, so the answer-giving hint should cost something. https://learnlab.org/research/wiki/index.php/Help_abuse
- **CompTIA's six steps:**
  1. Identify the problem (and what changed).
  2. Form a theory.
  3. Test it.
  4. Plan and fix.
  5. Verify the whole system works.
  6. Document.

  https://www.comptia.org/blog/troubleshooting-methodology. Bottom-up checking, from link to IP to gateway to DNS, fits the Wi-Fi question.
- **Detective games:**
  - Obra Dinn confirms answers in batches of three, to stop guessing.
  - Ace Attorney: press a statement, then present the evidence that contradicts it.
  - Papers Please: check evidence against a rulebook.
  - Her Story: you advance by choosing what to ask.
  - Duolingo: instant feedback with a one-line why.

## 2. What interviews want
A repeatable method, not a "random grab bag of fixes". https://blog.theinterviewguys.com/?p=18500

**The structure** (https://thisisanitsupportgroup.com/blog/troubleshooting-interview-questions-it-complete-guide-2026):
1. Clarify scope: one user or many, one site or all.
2. State a theory.
3. Name the test.
4. Say what result you expect.
5. Give an alternative if that's wrong.
6. Verify beyond the symptom.
7. Document it, and say when you'd escalate.

**Wi-Fi with no internet:**
1. Scope.
2. A valid IP? (169.254.x.x means no)
3. Ping the gateway.
4. Ping an outside IP.
5. nslookup, for DNS.
6. A captive portal or VPN?

https://thisisanitsupportgroup.com/blog/wifi-troubleshooting-checklist-it-support-2026

## 3. Proposals
- **A. Theory board** (medium):
  - 3 to 5 suspect cards, each with the test that rules it out.
  - Tests stamp cards RULED OUT or LIKELY. Fixing unlocks once the cause is pinned.
  - Cheap tests first scores better.
  - Only on tickets with a real fork; repeats can skip it.
- **B. "How did you know?" debrief** (small): 2 to 3 taps at close (the clue that proved it, and the next check if it hadn't). The picks write the ticket note.
- **C. Burrow mentor** (medium):
  - A three-step hint ladder: strategic, then the test, then the answer, which costs something or comes after a delay.
  - A full worked example in week 1, fading by ticket type and by how well you're doing.
  - It never pops up on its own: Clippy was hated for interrupting.
- **D. Interview finale** (medium to large):
  - Three real questions.
  - Answers are built from step cards (scope, theory, test, expected, alternative, verify, document, escalate), phrased with your own past tickets.
  - Specific feedback, such as "You never said when you'd escalate".
- **E. Contradiction moments** (small): they say "nothing changed", the log says otherwise, and you present the log.
- **F. Confirm in pairs** (small): for outages with more than one cause, against guessing.

## 4. Feel and feedback
- **Ruled out:** a rubber-stamp thunk and a shake, and the card slides to a "cleared" pile.
- **Pinned:** the last card glows and red string snaps to the evidence.
- **Resolved:** console checks turn green line by line, then a chime and the user's face changes.
- **Hints:** Burrow's ears perk up and his line types out. A wrong test gets a mild "hm", never a buzzer.
- Respect reduced motion. Reference: "Juice it or lose it" (Jonasson and Purho) and "The Art of Screenshake" (Nijman). https://rpgplayground.com/research-making-a-juicy-game/

## 5. Build first
1. The theory board, starting with the Wi-Fi-but-no-internet ticket (also the network console's first use).
2. The "How did you know?" debrief that writes the note.
3. Burrow's hint ladder, with a worked example in week 1, fading.

Then the interview finale, built on 1 and 2.
