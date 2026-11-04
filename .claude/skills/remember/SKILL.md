---
name: remember
description: Writes one thing the owner wants kept - a preference, a correction, a decision, a fact about how they work, or where something lives - into Command Center's memory files, dated, with its source, after checking it is not a secret, not on the never-remember list and not already stored. Trigger on "remember that", "note that I prefer", "we decided", "keep in mind", or a voice task card asking Command Center to remember something.
---

# Remember

Turn one thing the owner said into one dated memory entry, in the right file.

Read `agents/command-center/knowledge/memory-rules.md` first: it has the entry format, the file
for each kind of fact, and the list of things never stored.

## Steps

1. **Say back what you will save, in one line.** "Saving: you want briefs under ten lines."
   If the request could mean two things, ask once which.
2. **Refuse what must not be stored.** A password, key, token or login: do not save it, do not
   repeat it, tell them to change it at the service that issued it. A topic on the never-remember
   list in `command-center-brief.md`: say "You asked me never to write that down", and stop.
3. **Pick the file.** Preference or correction: `preferences.md`. Decision: `decisions.md`.
   Project news: hand to `track-projects`. Something about how they work (rhythm, commitments,
   people): `profile.md`, under "Standing preferences". Something that belongs in a shared file
   (their job, their offer, their hours, their voice) is not saved here: say which file owns it
   and that `/customize-team` or their own edit changes it.
4. **Check for an older entry on the same thing.** Search the memory folder for the key words.
   - Same meaning: say it is already saved, and update only its date if they want.
   - Different: write the new entry, mark the old one `superseded` with today's date and a
     pointer to the new one, and say so.
5. **Write the entry** at the top of the "Active" section (or "Standing preferences"), in the
   format from `memory-rules.md`: date, what, why it matters (ask only if not obvious), source,
   how sure, status `active`. The date is the `date` line of `node scripts/run-facts.mjs`.
6. **Update `MEMORY.md`**: the file's "Last changed" date.
7. **Confirm in one line**: "Saved in your preferences, dated today."

## When nobody is watching

A task card that asks Command Center to remember something counts as the owner's own request:
write it. Something you only noticed in a run (the owner did not ask) is never written in an
unattended run; list it under "Proposed memory" in your output for the owner's yes.

## Finishing

The memory change and the run log go in the same commit
(`.claude/skills/run-log/SKILL.md`).

If you were told not to commit, do not commit — leave the memory entry and the run log uncommitted together, and say so: it is written but not saved, and a fresh copy of the repo will not have it.
