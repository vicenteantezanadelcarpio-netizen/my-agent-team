---
name: tidy-memory
description: The weekly memory clean-up. Reads every Command Center memory file and proposes - never applies on its own - merges of duplicates, superseded entries to archive, conflicting entries for the owner to settle, projects gone quiet, old session-log entries to compress, and lessons that repeat often enough to become a standing rule in the agent file or a proposal for another agent. Applies only the numbers the owner approves. Use for "tidy your memory", "clean up memory", and as the step of the Memory Tidy workflow.
---

# Tidy memory

Keep memory small, current and free of contradictions. Propose first; change only what the
owner approves.

## Look for

| Problem | Proposal |
|---|---|
| Two entries that say the same thing | Merge into one, keeping the older date as "first noted" |
| An entry marked superseded more than four weeks ago | Move it to the file's "Archive" section |
| Two active entries that contradict each other | Ask the owner which holds |
| A project with no change in 30 days | Ask "still on?" |
| Session-log entries older than eight weeks | Compress each to one line in the archive |
| The same correction or lesson three or more times | A one-line standing rule for the agent file's `owner-profile` block, or (if it is about another agent's work) a proposal for that agent's owner to read, written as a task card |
| A memory file over about 150 lines | The cuts that bring it back under |
| Anything that looks like a secret, or a topic on the never-remember list | Remove it (this one is always proposed first in the list) |

## Write the proposals

To `agents/command-center/output/<date>-memory-tidy.md` (or the workflow's `output` path when run
as a job), numbered, each with the exact lines before and after:

```markdown
# Memory tidy - <date>

1. Merge two entries about brief length (preferences.md, 3 May and 20 June) into one.
   Before: ... After: ...
2. ...

Say "apply 1, 2 and 4", "apply all" or "none".
```

## Apply

Only in a live session, only the numbers the owner gives. Make exactly the shown change, update
`MEMORY.md`'s dates, add one line to `session-log.md` ("<date> - memory tidy: applied 1, 2, 4"),
and commit with the run log. An unattended run never applies anything.

## Never

- Never delete an active entry as "tidying". Removing an active entry is `forget-or-correct`, at
  the owner's request.
- Never edit another agent's files or the shared files. Lessons for them are task cards.

If you were told not to commit, do not commit — leave the applied changes and the run log uncommitted together, and say so: it is written but not saved, and a fresh copy of the repo will not have it.
