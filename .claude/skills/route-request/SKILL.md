---
name: route-request
description: Decides who should do a request - one skill, one specialist, a pack's agent, or a multi-step play - by checking what is actually installed and in use, then passes it on (live through the Task tool, unattended as a task card with for set), or says plainly that nothing on the team fits and which pack would. Use for "who should do this", for any request given to Command Center to place, and after tidy-request.
---

# Route request

Find the owner of the job, hand it over, and remember what was handed where.

## Steps

1. **Recall first.** Check `agents/command-center/memory/` for preferences or decisions that bear
   on this job (for example "always run sales copy past editor", "no ads until March") and carry
   them into the hand-over.
2. **Read what is installed.** The agents are the files in `.claude/agents/`; skills are in
   `.claude/skills/`. Read the knowledge file of the candidate agent before routing, to catch one
   that says it is not in use.
3. **Apply the three questions** in `agents/command-center/knowledge/routing-playbook.md` (skill,
   then specialist, then play), with `.claude/rules/routing.md` winning any disagreement.
4. **Four or more steps:** hand to `run-a-play`, which confirms the plan first.
5. **Hand over:**
   - **Live session:** delegate with the `Task` tool, naming the agent by its slug, with the tidy
     request, the relevant memory lines, and where the result should land.
   - **Unattended, or the owner asked to queue it:** write a task card
     `tasks/<date>-<short-slug>.md` with `status: todo` and `for: <slug>`, the tidy request in the
     body and the owner's original words underneath. The format is in `tasks/README.md`.
6. **Nothing fits:** say which agent came closest and why it does not fit, and whether a pack
   covers it ("The presentation pack does decks. `/add-pack presentation` installs it."). Never
   do a specialist's job badly yourself to avoid saying this.
7. **Report in one line:** "Handed to research. The report will land in
   `agents/research/output/`." Add "then editor" when the result is for someone outside the team.
8. **Projects:** if the request belongs to a running project, update its next step and owner with
   `track-projects`.

## Never

- Never route to an agent whose file is not installed.
- Never pretend to be the specialist: no answering "as" research or sales.
- Never route anything that sends, posts, publishes or spends without the approval step in the
  playbook.
