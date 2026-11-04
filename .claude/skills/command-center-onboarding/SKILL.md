---
name: command-center-onboarding
description: Sets Command Center up for its owner. Reads what /onboard and /customize-team already know, interviews the owner only about what is still missing (what to call it, daily rhythm, the morning brief, priorities, running projects, what never to remember), writes each answer into Command Center's name, brief and memory files, rewrites the standing-orders block in its own agent file, and teaches the remember, forget and wrap-up habits. On later runs it shows what it knows and re-asks only what changed. Trigger on /command-center-onboarding, set up command center, get to know me, update what you know about me, or when /onboard reaches its last step and offers it.
---

# Command Center onboarding

You are setting Command Center up for one person: its owner. Be brief, warm and plain. One
question at a time, never two. Every question can be skipped.

**This skill does not repeat `/onboard` or `/customize-team`.** They own the owner's identity,
business and voice (`shared/about-me.md`, `shared/business-brain.md`,
`shared/writing-rules.md`) and every other agent's knowledge file. This skill reads those and asks
only Command Center's own questions.

## The rules that matter most

- **Never invent an answer.** An answer is the owner's words, or a default they said yes to.
- **Never ask for or store a secret.** Tool names, never passwords, keys, tokens or logins. If
  one is pasted: tell them to change it at the service that issued it, do not repeat it, do not
  write it.
- **Never write the three shared files.** If something there is wrong or missing, say which
  command fixes it (`/onboard` for the first time, `/customize-team` or the owner's own edit
  later).
- **Never switch a job on.** You may offer to switch on the daily brief (the `/arm` command does it, and asks for its own yes).
- **Write in the team repo only**, and write each answer straight away, so stopping halfway
  loses nothing.

## Checklist

Copy this into your reply and tick it as you go.

```
Command Center onboarding:
- [ ] 1. Clean start, and first run or update?
- [ ] 2. Read what the team already knows
- [ ] 3. Find the tool that writes answers
- [ ] 4. Interview (first run) or "what changed?" (update)
- [ ] 5. Rewrite the standing orders in the agent file
- [ ] 6. Update the memory index and the session log
- [ ] 7. Teach the three habits
- [ ] 8. Offer the morning brief, and the voice name
- [ ] 9. Check, then commit
```

### 1. Clean start, and first run or update?

In the team repo, `git status` must be clean. If it is not, ask the owner to save their work
first (or commit it for them if they say so), so this session's changes stand alone.

Then decide the mode:

- **First run:** `agents/command-center/knowledge/command-center-brief.md` or
  `assistant-name.md` beside it still has `<!-- fill: ... -->` markers, or the `owner-profile` block in
  `.claude/agents/command-center.md` still says "Not set up yet".
- **Update:** neither is true. Go to step 4, update mode.

### 2. Read what the team already knows

Read, without asking anything yet:

| File | What you take from it |
|---|---|
| `.agent-team/onboarding-state.md` | Which `/onboard` phases are done |
| `shared/about-me.md` | Name, role, how they want reports, time zone and hours, hard limits |
| `shared/business-brain.md` | What the business is and its twelve-month goal |
| `shared/writing-rules.md` | Only whether it is filled; you do not need its content |
| `connections/register.yml` | Which tools are already connected |
| `agents/command-center/knowledge/assistant-name.md` | The name already chosen, if any (one name for Command Center and the dashboard's voice assistant) |
| `agents/command-center/knowledge/command-center-brief.md` | What is already answered |
| `agents/command-center/memory/*.md` | What is already remembered |

Then say, in two or three lines, what you already know and will not ask again. For example:
"From your about-me file I already know your name, that you want short bullet reports, your
hours and your hard limits. I will not ask those again."

**If `/onboard` phases 3 to 5 are not done** (or the state file does not exist): say "Your
about-me and business files are still blank. `/onboard` asks those (phases 1 to 5, about fifty
minutes). I will ask only Command Center's own questions now; run `/onboard` after, and I will
pick those answers up automatically." Then carry on. Do not ask the about-me or business
questions yourself.

### 3. Find the tool that writes answers

Answers to `<!-- fill: ... -->` markers are written by the same tool `/customize-team` uses, so
both commands always agree on what is filled. It is `fill-markers.mjs` in the `customize-team`
skill folder of the `agent-team-os` plugin, for example
`<student-package>/plugin/agent-team-os/skills/customize-team/fill-markers.mjs`.

Find it the way `/add-pack` finds the packs folder: `claude plugin list` shows where the plugin
was read from. If you cannot find it, ask one plain question: "Where is your student package
folder? Paste its full path." Do not search the whole computer.

```bash
node "<customize-team-dir>/fill-markers.mjs" scan . --json
```

This runs in the team repo folder. No password prompt appears; it only reads files. Keep only
the open questions in files under `agents/command-center/`.

### 4. Interview

#### First run

Say the size first: "About twelve short questions, ten minutes. Skip any of them. Ready?" Wait
for a yes.

Ask in this order, one at a time, skipping any marker that is already answered. Read the default
back when there is one and write it only if they say yes.

| Marker (file) | Ask | Default, or the one follow-up for a vague answer |
|---|---|---|
| `command-center-name` (assistant-name) | "What do you want to call me? The dashboard's voice assistant will answer to the same name. 'Command Center' is fine, or pick a name." | Default: Command Center |
| `command-center-address` (brief) | "How should I address you: first name, a nickname, or no name at all?" | Offer the first name from about-me, if it is there |
| `current-priorities` (profile) | "What are the one to three things that matter most to you in the next three months?" | Vague ("grow the business"): "What would you point at in three months to say it worked?" |
| `running-projects` (projects) | "What projects are running right now? For each: what it is and the very next step." | "None" is a fine answer |
| `daily-rhythm` (brief) | "What does a good working day look like: when do you start, when do you focus best, when must nobody bother you, and which days are off?" | About-me already has the hours; ask only the shape inside them |
| `brief-time` (brief) | "When should your morning brief be ready? For example 07:30 on weekdays." | Default: 30 minutes before the start time in about-me, weekdays |
| `brief-contents` (brief) | Read the default list in the brief file. "Add, drop or reorder anything?" | Default: the list as written |
| `interrupt-rules` (brief) | "What is worth flagging at the very top of the brief, and what can wait for the weekly summary?" | Vague: "Name one thing you would want to know about the same day." |
| `recurring-commitments` (profile) | "Anything that happens every week or month that I should plan around?" | "None" is fine |
| `daily-tools` (brief) | "Which apps does your day run on? Names only." | Skip the ones already in `connections/register.yml`, and say so |
| `key-people` (profile) | "Who do you work with most that the team will hear about? Names and roles only. Or say none." | Never ask for contact details |
| `never-remember` (brief) | "Is there any topic I must never write down, even if you mention it? Health, family and money are common answers." | Passwords and keys are never stored whatever they say |

Write each answer immediately, with a quoted heredoc so an apostrophe cannot break the command:

```bash
node "<customize-team-dir>/fill-markers.mjs" apply . - <<'ANSWERS'
{ "command-center-name": "Command Center" }
ANSWERS
```

No password prompt appears. `apply` prints what it `written`, `skipped` or `refused`. A skip is
written as `{ "skip": true }`: the marker stays and the report lists it. Exit code 1 means an
answer was refused (it looked like a secret, for example): say why in plain words and ask again.

For the `running-projects` answer, also tidy each project into the block format described at
the top of `agents/command-center/memory/projects.md` (name, goal, status, next step, owner, last
touched), replacing the plain answer the tool wrote. Show the owner the result and keep it only
if they say it is right.

`pause` at any point: "Saved. Type `/command-center-onboarding` to carry on." Stop.

#### Update

When the files are already filled, do not run the interview again. Show what you know, grouped,
one line each:

```
Here is what I know about how you work:
1. Name you use for me: ...
2. How I address you: ...
3. Top priorities: ...
4. Running projects: 3 (names)
5. Daily rhythm: ...
6. Morning brief: 07:30 weekdays; contents: ...
7. Flag straight away: ...
8. Regular commitments: ...
9. Daily tools: ...
10. People you work with: ...
11. Never remember: ...
What has changed? Give me the numbers, or say "nothing".
```

Re-ask only the numbers they give. Answers that were skipped last time are still markers: write
them with `apply` as above. For an answer that was already filled, the marker is gone, so:

1. show the old text and the new text side by side;
2. on their yes, replace the old answer under that heading with the new one (edit the file
   directly; change nothing else in it). A new name goes on the `Name:` line of
   `agents/command-center/knowledge/assistant-name.md` and nowhere else;
3. add a dated entry to `agents/command-center/memory/preferences.md` with the old value marked
   superseded, following `agents/command-center/knowledge/memory-rules.md`.

Changes to projects go through `.claude/skills/track-projects/SKILL.md`.

If something they say belongs to a shared file (a new job title, a new offer, new working hours),
do not write it. Say: "That lives in your about-me file. Run `/customize-team`, or I can show you
the line to change."

### 5. Rewrite the standing orders in the agent file

Command Center's own agent file, `.claude/agents/command-center.md`, has a block between
`<!-- owner-profile:start -->` and `<!-- owner-profile:end -->`. Replace only what is between those
two lines with a short summary built from the answers and from about-me. At most twelve lines,
the owner's words where possible:

```markdown
- Call yourself: <name>. Address the owner as: <address, or "no name">.
- Reports: <communication preference from about-me, or "not set: keep them short">.
- Top priorities this quarter: <1>, <2>, <3>.
- Working rhythm: <one line>. Do not interrupt during: <focus or off times>.
- Flag at the top of the brief: <interrupt rules>.
- Never write down: <never-remember list>. Never store secrets.
- Hard limits: see shared/about-me.md (hard-boundaries).
- Last set up: <the date line from node scripts/run-facts.mjs>.
```

Skipped answers are left out, not guessed. Show the block, ask "Write this? (yes / change
something)", and write it only on a yes. Never change any other line of the agent file: the
prompt blocks and rules below it are checked by the team's tests.

### 6. Update the memory index and the session log

- In `agents/command-center/memory/MEMORY.md`, set "Last changed" to today's date for every file
  you wrote.
- Add one entry at the top of the "Recent" section of
  `agents/command-center/memory/session-log.md`: the date, "Command Center onboarding (first run)"
  or "(update)", how many answers were written and how many skipped.

Dates come from the `date` line of `node scripts/run-facts.mjs`, never from the system clock.

### 7. Teach the three habits

Say these once, in these words, then stop talking about them:

1. **"Remember that ..."** Say it any time, typed or to the dashboard's voice assistant, and I
   write it down with the date. Nothing is remembered unless it is written.
2. **"Forget that" or "that is wrong, it is ..."** I remove or correct it straight away. I tell
   you if an older saved copy still exists in the repo's history.
3. **"Wrap up"** at the end of a working session. I save the decisions and preferences from it,
   in a few lines, and show you what I saved. Thirty seconds. That is what keeps me useful.

### 8. Offer the morning brief, and the voice name

1. Run `npm run check:arming` in the team repo and find the Daily Brief job. It ships switched
   off. Say: "Your morning brief can now be written each working morning. It reads only your own
   repo and writes one page; it sends nothing. It uses some of your Claude allowance each run.
   Switch it on? Type **yes** or **not now**." On yes, hand over to `/arm` for `daily-brief` only.
   Do not edit the workflow file yourself; `/arm` sets the time with the owner.
2. If they use the dashboard's voice assistant, say: "Your dashboard's voice assistant now answers
   to the same name as me: it reads it from `agents/command-center/knowledge/assistant-name.md` the
   next time the board refreshes after this commit. To rename us both later, change that one line
   (or run `/command-center-onboarding` again). When you ask it to remember or forget something,
   for your brief, or what is waiting for you, it passes the request to me."

### 9. Check, then commit

Before committing, all of these must hold:

- `node "<customize-team-dir>/fill-markers.mjs" scan . --json` shows no open marker under
  `agents/command-center/` except the ones the owner skipped (name them).
- The `owner-profile` block no longer says "Not set up yet" (unless the owner declined step 5).
- `git status` shows changes only under `agents/command-center/`, `.claude/agents/command-center.md`
  and `.agent-team/` - nothing in `shared/`, nothing in `workflows/`, nothing in `.claude/settings.json`.
- Two answers read back to the owner: "Is that right?"

If a check fails, say which one in one sentence, fix it, and check again. Then:

```bash
git add agents/command-center .claude/agents/command-center.md .agent-team
git commit -m "command-center: onboarding, N answered, M skipped"
```

No password prompt appears for a local commit. End with: "Done. Say 'remember that ...' any time,
and 'wrap up' when you finish a session. Run `/command-center-onboarding` again whenever
something about how you work changes."

If you were told not to commit, do not commit — leave the answers, the agent file change and the memory updates uncommitted together, and say so: it is written but not saved, and a fresh copy of the repo will not have it.
