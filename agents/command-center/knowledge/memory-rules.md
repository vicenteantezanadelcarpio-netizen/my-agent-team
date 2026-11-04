# How Command Center's memory works

Reference for every memory skill (`remember`, `recall`, `forget-or-correct`, `close-session`,
`tidy-memory`, `command-center-onboarding`). No blanks to fill here.

## The one idea

Memory is only what is written in files in the team repo and committed. A scheduled job runs on
a fresh copy of the repo, so a note that was never written, or written but never committed, does
not exist for it. "I will remember that" is only true after the line is in a file.

## Where things live

All memory lives in `agents/command-center/memory/`. The dashboard's Memory screen and its voice
assistant can find these files, because they are ordinary notes in the team repo.

| File | What goes in it | Who fills it |
|---|---|---|
| `MEMORY.md` | The index: one line per memory file, what is in it, when it last changed | Every memory skill keeps it current |
| `profile.md` | How the owner likes to work with Command Center: rhythm, standing preferences, tools, what to never store. A summary, not a copy of `shared/about-me.md` | `command-center-onboarding`, then `remember` |
| `preferences.md` | Learned preferences and corrections: "shorter briefs", "never schedule calls on Fridays" | `remember`, `close-session` |
| `decisions.md` | Decisions the owner took, with the reason, so nobody re-argues them | `remember`, `close-session`, `high-stakes-check` |
| `projects.md` | Running projects: goal, status, next step, which agent owns the next step | `track-projects`, `command-center-onboarding` |
| `session-log.md` | One short entry per meaningful session: what was done, what is open | `close-session` |

Things that already have a home elsewhere are never copied into memory:

| Fact | Its home | Command Center does |
|---|---|---|
| Who the owner is, their hours, their hard boundaries | `shared/about-me.md` | Reads it. Suggests `/onboard` or `/customize-team` if it is out of date |
| The business, offers, prices, proof | `shared/business-brain.md` | Reads it. A change is proposed to the owner, never written here |
| How the owner writes | `shared/writing-rules.md` | Reads it |
| A specialist's own knowledge (offer sheet, FAQ, a pack's settings) | `agents/<slug>/knowledge/` | Points to it |
| What a job did | `runs/` and `inbox/` | Reads it for the brief and for status |

## The shape of an entry

One entry is a short block, newest at the top of its section:

```markdown
### 2026-01-15 - Briefs stay under ten lines
- **What:** The owner wants the morning brief under ten lines, focus item first.
- **Why it matters:** Longer briefs go unread.
- **Source:** the owner said so in a session.
- **Sure:** high
- **Status:** active
```

`Source` is one of: the owner said so · the owner wrote it in a file (name the file) · seen in a
run's output (name the run log) · inferred (say from what). `Sure` is high, medium or low.
`Status` is active, superseded (with the date and the entry that replaced it) or proposed (waiting
for the owner's yes).

Dates are the owner's date: take them from the `date` line of `node scripts/run-facts.mjs`, never
from the system clock.

## What is worth saving

Save something only if it will change what the team does next time:

- a preference or a correction the owner gave
- a decision the owner took, and why
- a project starting, changing direction, finishing or stopping
- a lesson: something that went wrong and how to avoid it next time
- where something lives (a file, a tool, a folder), never a secret

Do not save: one-off chit-chat, formatting tweaks, things already in another file, guesses, or
anything in the owner's never-remember list.

## When two entries disagree

Keep both until the owner says which is right. Mark the older one `superseded` with today's date
and a pointer to the newer one. Never silently delete. Only `forget-or-correct`, on the owner's
request, removes an entry.

## Forgetting, honestly

Forgetting removes the entry from the memory files and commits that change. Older versions of
the files stay in the repo's history (git keeps every saved version). Say this plainly when the
owner asks to forget something. Removing it from history as well is a separate, destructive job
for the owner to do with help; Command Center never does it.

## Never in memory

- passwords, keys, tokens, card numbers, logins, recovery codes
- the content of private messages, beyond a one-line summary the owner asked for
- health, family, money or legal details about anyone, unless the owner explicitly asks
- anything on the owner's never-remember list in `command-center-brief.md`

If one of these is pasted, do not save it, do not repeat it, and if it is a secret tell the owner
to change it at the service that issued it.

## Keeping it small

Each memory file should stay readable in a minute. When one passes about 150 lines, the weekly
`tidy-memory` job proposes merging duplicates and moving superseded entries to an `## Archive`
section at the bottom of the same file. It proposes; the owner approves.
