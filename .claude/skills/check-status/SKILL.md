---
name: check-status
description: Answers whether something is running and whether it worked - a job, a task card, an order sent from the dashboard, a project's last piece of work - using only run logs, output files, task cards and workflow files as evidence, with five status words kept strictly apart (switched off, switched on, ran and worked, ran and failed, unknown). Use for "is X running", "did the brief go out", "what ran overnight", "did my order land", "why didn't X happen".
---

# Check status

A status answer is only as good as the file behind it.

## Steps

1. **Identify what is being asked about:** a workflow (its file in `workflows/`), a task card (in
   `tasks/`), an order sent from the dashboard (a task card or a run started from the board), or
   a project.
2. **Gather the evidence, newest first:**
   - the workflow file: `armed:` (switched on or off) and its schedule;
   - `npm run check:arming` for the team's own reading of what is on;
   - run logs in `runs/<YYYY-MM>/` for that workflow or agent, with their result;
   - the output file the workflow names (`output:`) for the date in question;
   - for a task card: its `status`, `done_at` and `## Result` section.
3. **Answer with one of the five words** from `agents/command-center/knowledge/routing-playbook.md`,
   then the evidence: "Ran and worked: the run log for this morning says done, and
   `inbox/<date>/daily-brief.md` is there."
4. **Separate the parts** the owner may be mixing up: switched on is not the same as ran; a run
   log is not the same as the output being there; a draft being written is not the same as it
   being sent.
5. **When you cannot tell, say so.** "Unknown: there is no run log for that day." Then say what
   would settle it (press the job's button on the dashboard, or check the computer that runs the
   jobs is on).
6. **Never fix by retrying.** Do not re-run a job to "check". If something failed, report the
   failure and its stated cause, and suggest the next step for the owner to approve.

## Output

A spoken or short answer in the conversation. For a voice task card, a three-sentence note in
`agents/command-center/output/<date>-status-<slug>.md` so the dashboard can show it.
