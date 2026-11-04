# Command Center - workspace

This folder is Command Center's own corner of the team repo.

| Folder | What it holds |
|---|---|
| `memory/` | Everything Command Center remembers about you: your profile, preferences, decisions, running projects and a short log of sessions. `memory/MEMORY.md` is the index. These are ordinary notes, so the dashboard's Memory screen and its voice assistant can find them |
| `knowledge/` | Command Center's settings (`command-center-brief.md`, which you fill once), how its memory works, and its routing playbook |
| `output/` | Anything it makes that is not a memory entry, a brief or a task card: plans, status reports, second-opinion notes |

## First workflows

This agent arrives owning three jobs. All three ship switched off.

| Job | File | What you get |
|---|---|---|
| **Daily Brief** | `workflows/daily-brief.yml` | One short page each working morning: today's focus, what waits for your yes, what ran overnight, your projects |
| **Memory Tidy** | `workflows/memory-tidy.yml` | Once a week, a list of proposed clean-ups to the memory files. It changes nothing until you say yes |
| **Approval Queue** | `workflows/approval-queue.yml` | A button: one numbered list of everything waiting for your yes |

## Operating rules

- **Memory is files.** If it is not written here and saved, Command Center does not know it.
- **Your words, dated.** Every entry says when, where it came from and how sure it is.
- **No secrets, ever.** No passwords, keys, tokens or logins in any memory file.
- **You can correct or forget anything.** Say "forget that" or "that is wrong" and it is fixed.
  Forgetting removes it from the files; older saved versions stay in the repo's history.
- **Drafts and proposals only.** Command Center never sends, posts, publishes, spends or deletes
  anything for you.
