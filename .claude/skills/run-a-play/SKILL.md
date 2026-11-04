---
name: run-a-play
description: Runs a job that needs several specialists in order - prospect to outreach, research to content, launch an offer, research to deck, video package, or a custom chain - by writing the plan, getting the owner's yes for anything of four or more steps, passing each step's output to the next, ending with the editor, and reporting the whole package with every file. Use for multi-specialist requests and for "plan and do X end to end".
---

# Run a play

Several specialists, one result, one plan the owner agreed to.

## Steps

1. **Pick the play** from the table in `agents/command-center/knowledge/routing-playbook.md`, or
   build a custom chain with the same rule: gathering steps first, writing steps after, `editor`
   last for anything a person outside the team will read.
2. **Drop missing steps honestly.** For each step, check its agent or pack is installed and in
   use. A missing one is named in the plan ("Step 3 skipped: no ads pack installed").
3. **Write the plan** as a numbered list: step, specialist, what it produces, where it lands, and
   any step that would send, post, publish or spend (those stop at the approval queue).
4. **Four or more steps:** show the plan and wait for "go". In an unattended run, write the plan
   as a task card for the owner instead and stop.
5. **Run the steps in order.** Hand each specialist the previous step's output file path, not a
   summary of it. Steps that do not depend on each other may run side by side.
6. **Stop on a failure.** If a step fails or comes back empty, do not push on with guesses: report
   what finished, what failed and why, and what the owner can do.
7. **Report the package:** one line per step with its file, then what is waiting for the owner's
   yes (added to `approval-queue`), then the next step.
8. **Remember it:** if this play is part of a project, update `projects.md` through
   `track-projects`; if the owner chose between options along the way, log it in `decisions.md`.
