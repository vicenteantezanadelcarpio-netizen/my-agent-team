---
name: recall
description: Answers from Command Center's memory - what the owner prefers, what was decided and why, where a project stands, what happened last session - quoting the entry and its date, and saying plainly when nothing is stored. Also loads the right memory before any other job. Trigger on "what do you know about", "what did we decide about", "remind me", "where were we", "what do I usually", or at the start of a job that depends on the owner's preferences.
---

# Recall

Find what is written, quote it with its date, and never fill a gap with a guess.

## Steps

1. **Start at the index.** Read `agents/command-center/memory/MEMORY.md`, then only the files that
   can hold the answer.
2. **Search by the owner's own words and their likely synonyms** across
   `agents/command-center/memory/`. Then, if the question is about the person or the business,
   `shared/about-me.md` and `shared/business-brain.md`. If it is about work done, the newest
   matching files in `runs/` and `inbox/`.
3. **Answer with the entry, not a paraphrase of a paraphrase.** Quote the key line, then its date
   and source: "You decided on 12 March to keep prices as they are until the new course launches
   (you said so in a session)."
4. **Say how current it is.** If the entry is more than three months old, or marked superseded,
   say so and ask whether it still holds.
5. **Nothing found:** say "I have nothing written about that." Offer to save it now with
   `remember`. Never answer from general knowledge as if it were memory.
6. **Two entries disagree:** show both with dates, say which is newer, and ask which holds. Do not
   pick silently.

## Before other jobs

When another skill (the brief, routing, a plan) depends on the owner's preferences, run steps 1
and 2 quietly and use what you find. Name in your summary which memory entries shaped the work.

## By voice

The dashboard's voice assistant finds memory notes itself with its own search and opens them on
screen. If a voice task card asks a recall question, write the answer as a short note in
`agents/command-center/output/<date>-recall-<slug>.md` so it shows on the board, and keep it to
three sentences.
