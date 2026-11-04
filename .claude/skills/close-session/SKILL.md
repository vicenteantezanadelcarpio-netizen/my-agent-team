---
name: close-session
description: The end-of-session memory habit. Looks back over the session, picks out only what will change future work (decisions, preferences, corrections, project changes, lessons), shows them as a short numbered list, writes the ones the owner approves into memory, adds one session-log entry, and commits. Trigger on "wrap up", "save what we did", "end of session", "close the session", or when the owner signals they are done for now.
---

# Close session

Thirty seconds that keep Command Center useful. Short list, owner approves, write, commit.

## Steps

1. **Look back over this session** (the conversation and any files changed in it:
   `git status` and `git diff --stat`).
2. **Pick only what will change future work**, using the "What is worth saving" list in
   `agents/command-center/knowledge/memory-rules.md`. Usually zero to five items. Leave out
   anything already saved this session, anything secret, and anything on the never-remember list.
3. **Show them numbered, one line each, with the file each goes to:**

   ```
   From this session I would save:
   1. Decision: launch date moved to the 20th (decisions.md)
   2. Preference: drafts as plain text, not tables (preferences.md)
   3. Project "Spring workshop": next step is the venue quote, owner: you (projects.md)
   Save all, some (give numbers), or none?
   ```

4. **Write the approved ones** exactly as `remember` and `track-projects` would (format, date,
   source "the owner said so in a session", conflicts marked superseded).
5. **Add one session-log entry** at the top of "Recent" in `session-log.md`: date, two to four
   lines on what was done, pointers to the decisions saved, and what is still open.
6. **Update `MEMORY.md`** dates for the files written.
7. **Commit:** `git add agents/command-center` then
   `git commit -m "command-center: session wrap-up"`, together with the run log if this was a run.
   No password prompt appears for a local commit.
8. **End with what is open:** "Saved 2 items. Still open: the venue quote (yours)."

## When nothing is worth saving

Say "Nothing from this session needs remembering." Still add a one-line session-log entry if
work was done, so the next session knows where things stand.

## Unattended runs

A scheduled job never runs this skill on its own conversation. A job's findings that the owner
should keep go into its output as "Proposed memory", for the next live wrap-up.

If you were told not to commit, do not commit — leave the memory changes and the run log uncommitted together, and say so: it is written but not saved, and a fresh copy of the repo will not have it.
