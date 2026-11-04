---
name: track-projects
description: Keeps the owner's running projects in Command Center's memory - start, update, pause, finish or stop a project, with its goal, status, next step, who owns the next step and when it was last touched - and answers where a project stands from that file plus the work the team has produced. Use for "start a project", "where is project X", "next step on X is", "pause X", "X is done", and when another skill changes a project.
---

# Track projects

`agents/command-center/memory/projects.md` is the single list of what the owner has on. Keep it
short and true.

## The block

```markdown
### <Project name>
- **Goal:** <one line, the owner's words>
- **Status:** planned | active | waiting (on whom) | paused | done | stopped
- **Next step:** <one concrete action>
- **Owner of next step:** you | <agent slug>
- **Last touched:** <date>
- **Notes:** <links to the files that matter, decisions in decisions.md>
```

Active, planned, waiting and paused projects sit under "Active". Done and stopped ones move to
"Finished or stopped", shortened to one line with the end date and outcome.

## Commands

| The owner says | Do |
|---|---|
| "Start a project ..." | Ask only for what is missing from: goal, first next step, who owns it. Add the block |
| "Where is X?" | Read the block, then check the files it links and the newest run logs and outputs for that project. Report status, next step and anything newer than the block. Update "Last touched" only if something changed |
| "Next step on X is ..." | Update next step, owner and date |
| "Pause X" / "X is done" / "Stop X" | Change the status (a yes is needed to move it to finished), add the outcome, log the decision in `decisions.md` if a choice was made |

## Rules

- The next step is one action someone can do, not a theme ("send the venue three dates", not
  "venue").
- A project with no change for 30 days is listed in the brief as "gone quiet" with the question
  "still on?". Never close it on your own.
- If a next step belongs to an agent, offer to queue it as a task card through `route-request`.
- Update `MEMORY.md`'s "Last changed" date for `projects.md` on every write.
