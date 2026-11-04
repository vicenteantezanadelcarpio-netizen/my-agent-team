# agent-team-template

**A team of AI workers that runs on a schedule, in the cloud, while your laptop is shut.**

This is the repo you clone. It is the office: your agents live here, the jobs they do are written
down here, and everything they produce lands here as files you own.

You do not need to be a developer to use it. You do need to be able to copy a command and press
enter.

---

## Who this is for

Someone running a business, or working in one, who keeps doing the same handful of things every
week and would like most of them to happen without being asked.

**It will not** send an email, publish a post, or spend money. Everything it produces is a draft
that waits for you. The boundary is a setting, not only an instruction: `.claude/settings.json`
denies every connector's send, reply, forward, publish, delete and trash tools, so an agent,
scheduled or not, cannot call them.

---

## What is in here

**Nine agents.** Five do your business's work; one is your chief of staff; three maintain the team itself.

| Agent | What it does |
|---|---|
| `research` | Looks something up on the web and comes back with a short report where every claim has a link |
| `content` | Writes posts, captions and newsletters that sound like you, and leaves them as drafts |
| `email` | Sweeps your inbox, archives the noise, tells you what needs you, leaves replies in drafts |
| `customer-service` | Answers a customer's question from the answer sheet you wrote, and says "I don't know" rather than guessing |
| `sales` | Researches a prospect, writes the first message you would actually send, keeps a list of who you approached |
| `command-center` | Your chief of staff: remembers you between sessions, writes a morning brief (with the hours the team saved, from your ledger), turns spoken or messy requests into tasks for the right agent, and keeps one list of what waits for your yes. Its name is also the voice assistant's on your dashboard |
| `editor` *(maintenance)* | Grades what the team produced against a written rubric before it reaches you |
| `security` *(maintenance)* | Sweeps this repo for committed secrets and stale tooling |
| `orchestrator` *(maintenance)* | Works your to-do column, handing each card to the right specialist |

**Twelve jobs.** A job is a chain of skills with a name and an owner. Six are yours; six keep the
team honest.

| Job | What lands in your inbox folder |
|---|---|
| `morning-intel` | What moved in your market overnight, before your first call |
| `inbox-triage` | Your inbox sorted: needs you · drafted reply · noise |
| `draft-queue` | Your voice notes turned into post drafts, graded before you see them |
| `gone-cold` | Who in your pipeline went quiet, with a chase message drafted for each |
| `daily-brief` | One short page each working morning: today's focus, the hours your team saved, what waits for your yes, what ran overnight |
| `approval-queue` | A button: one numbered list of everything waiting for your yes. It approves nothing itself |
| `memory-tidy` *(maintenance)* | Proposed clean-ups to Command Center's memory, applied only on your yes |
| `weekly-review` *(maintenance)* | What shipped, what slipped, what went quiet — one page |
| `quality-review` *(maintenance)* | Did the team produce work you actually used? One number, with evidence |
| `security-review` *(maintenance)* | Anything leaking, anything stale |
| `task-sweep` *(maintenance)* | Your to-do cards, worked off and routed |
| `weekly-tune-up` *(maintenance)* | What went wrong twice this week, and what changes because of it |

**Thirty-nine skills.** A skill does one task; a job chains several. Eight are business work —
`triage-inbox`, `draft-replies`, `scan-market`, `write-intel-brief`, `collect-voice-notes`,
`draft-content-queue`, `review-pipeline`, `draft-chase-messages`. Fourteen are Command Center's:
remembering, recalling, forgetting, the morning brief, routing, approvals, projects and its own
onboarding (`command-center-onboarding`, which runs after `/onboard`). The other seventeen
maintain the team: syncing, grading, watching upstream for changes, writing run logs.

**Nothing here ships switched on.** Every job arrives `armed: false` with a written reason. See
[Which jobs actually run](#which-jobs-actually-run).

---

## Before you start

| You need | Why |
|---|---|
| **Claude Pro or Max** | Free cannot run scheduled work. This is the hard one |
| **Claude Code**, installed and signed in | It is what reads this repo |
| **A GitHub account**, connected to claude.ai | Your team runs in the cloud from GitHub, not from your laptop |
| **Node.js 20 or newer** | Only for the check commands below. Run `node --version` to see yours |
| **Git**, installed | Every command in the next section is a git command. Run `git --version` |

Everything with a `$`-style block below is typed into a terminal — **Terminal** on a Mac,
**PowerShell** on Windows. The `/slash` commands are typed into Claude Code instead.

You do **not** need to install any packages. There are no dependencies — `npm test` works on a
fresh clone with nothing downloaded.

---

## Install

**1. Install the plugin first.** `/onboard`, `/ledger`, `/match` and `/arm` are not files in this
folder — they come from a separate plugin, the `plugin` folder that came in the same package as
this one, and without it step 4 has nothing to run. In Claude Code, with the package folder as
the folder you are in:

```
/plugin marketplace add ./plugin
/plugin install agent-team-os
```

**2. Make your own copy.** Copy this `team-template` folder to wherever you keep your work, give
the copy your own name (for example `my-agent-team`), and make it a fresh git repo with your own
history. Nothing in it points back at anybody else's repo.

On a Mac, in Terminal, from the package folder:

```bash
cp -R team-template ~/my-agent-team
cd ~/my-agent-team
git init -b main
git add -A
git commit -m "My team"
```

On Windows, in PowerShell, from the package folder:

```powershell
Copy-Item -Recurse team-template $HOME\my-agent-team
cd $HOME\my-agent-team
git init -b main
git add -A
git commit -m "My team"
```

Then make an empty **private** repo on GitHub — no README, no `.gitignore`, nothing ticked — and
push to it:

```bash
git remote add origin <your-team-repo-address>
git push -u origin main
```

The branch has to be **`main`**. `git init` on its own still makes `master` on many installs, the
dashboard looks for `main`, and the mismatch shows up later as an empty board rather than an error.
`git init -b main` above is what settles it; if you already have a `master`, `git branch -M main`
renames it.

**3. Check it works.**

```bash
node --version
npm test
```

`node --version` must say 20 or higher. `npm test` ends with a summary. These are the two lines
that matter:

```
ℹ tests 2675
ℹ fail 0
```

**`fail 0` is the one to read.** Just above it you will see a `pass` line and a `skipped` line,
and how those two split is not something to worry about. One test in the suite compares a contract
this repo shares with the dashboard repo, and it stands itself down unless you happen to have that
repo checked out in the same folder — so on most machines it shows as skipped, and on a few it
runs. Either way the total is the same and nothing failed.

Nothing is downloaded and nothing is installed.

**4. Open it in Claude Code and let it introduce itself.**

```
/onboard
```

That walks you through who you are and what the business does. It takes a while, and it is the part
that decides whether everything else is any good.

---

## Did it work?

Five commands, in this order. Each tells you something different.

```bash
npm test                 # ends with "fail 0". If anything fails, the clone is broken
npm run check:ledger     # your week, measured
npm run check:proposals  # what your numbers say your team should be
npm run check:arming     # which jobs actually ring
npm run check:verdicts   # what you did with the work, and whether it can be counted
```

On a fresh clone the last four **tell you what is missing** rather than failing mysteriously.
`No ledger.yml yet. Ask for one: /ledger` is the correct answer before you have run `/ledger`.

Two of them also **exit non-zero** while they are saying it, which is right for anything automated
and looks alarming in a terminal. A red mark before you have run `/ledger` is the tool agreeing
with you, not a fault.

---

## How it actually works

**You measure first.** `/ledger` interviews you about where your week goes and writes `ledger.yml`
— your own words, quoted, with the hours derived from how often and how long. Nothing is built in
that step, on purpose.

**Then your numbers pick the team.** `/match` reads that file and proposes what should answer each
line of it. Every proposal cites three things: your words, your number, and something that already
exists in this repo. **Missing any one, and it is refused.** Where nothing fits, it says so — and
that gaps list is worth more than the proposals, because it is the specification for what gets
built next.

**Then you switch on only what you approved.** `/arm` turns approved jobs into real scheduled
routines, one at a time, each confirmed afterwards.

### Which jobs actually run

A file saying `schedule: "daily 06:30"` makes **nothing** happen at 06:30. A *routine* is the alarm
clock. This repo ships eleven files that name a schedule, one button-only job and no routines at
all, on purpose — every one of them arrives **off**, with a written reason, which is what `check:arming` reports. *Declared*
in the table below is the state you reach later, by claiming a schedule and not arming it.

```bash
npm run check:arming
```

| State | Means | Costs you |
|---|---|---|
| **armed** | The file says run it, and a routine exists | Runs, on schedule |
| **declared** | The file says run it, and **nothing rings** | Nothing — it is a wish |
| **unapproved** | A routine **rings** that the file says is off | Runs nobody approved |
| **off** | Deliberately off, with a written reason | Nothing, honestly |

---

## When it breaks

| What you saw | What to do |
|---|---|
| `npm test` fails on a fresh clone | You are probably on Node 18 or older. Check `node --version`, upgrade to 20+ |
| `No ledger.yml yet` | Correct, before you have run `/ledger`. Run it |
| `No usable snapshot of your routines` | Run `/routines` in Claude Code and commit the file it writes |
| `the file says run it and nothing rings` | A job claims a schedule with no routine behind it. Arm it, or set `armed: false` with a reason |
| `is not armed and carries no reason` | Say what would have to change for that job to be worth a run. "Not needed" is not a reason |
| `/onboard` or `/ledger` is not a command | The `agent-team-os` plugin is not installed — it lives in a separate repo |
| A job fires twice a day | Two routines for one job. The API cannot delete them; remove one at `claude.ai/code/routines` |
| Everything says UNKNOWN | No routines snapshot committed. Run `/routines`, commit, push |

---

## The commands you will actually use

All but the last come from the **`agent-team-os` plugin**, installed separately — they are not
files in this repo. `/connect` is a skill that ships **in here**, in `.claude/skills/connect/`.

| Command | What it does |
|---|---|
| `/onboard` | Sets the team up, start to finish |
| `/ledger` | Interviews you about your week, writes `ledger.yml` |
| `/match` | Reads your ledger, proposes a team, names the gaps |
| `/routines` | Shows what is actually scheduled on your account |
| `/arm` | Turns approved jobs into real routines, one at a time |
| `/audit` | Diagnoses the team you actually have |
| `/new-workflow` | Builds a job by asking you five questions |
| `/connect` *(in this repo)* | Works out how a tool connects today, and wires it |

---

## Usage meters on the dashboard

The dashboard can show how much of your Claude and Codex plan limits you have used, and when they
reset. A small script on your computer reads the numbers and saves them into this repo.

- **Set it up:** [Usage meters on your dashboard](docs/guides/usage-meters.md) - a step-by-step
  guide, no coding needed. Or ask Claude: **set up my usage meters**.
- **How it works:** [How the usage meters work](docs/guides/usage-meters-how-it-works.md) - the
  data flow, every source, and what is never written.

## The Connections wall

The same script also lists, by name only, the AI tools, servers and plugins each computer has, and
whether each one connects. If the computer runs Hermes, a Hermes card sits on top: whether it is
running, its version, and per profile the model, skills and last week's conversations - read from
Hermes's own files, never by running Hermes.

- **Set it up:** [The Connections wall on your dashboard](docs/guides/connections-wall.md) - how to
  fill it, and what each word on it means. Or ask Claude: **/snapshot**.
- **How it works:** [How the Connections wall works](docs/guides/connections-wall-how-it-works.md) -
  every file it reads, what it keeps, and what is never kept.

## The Readiness wall

The same script also lists every scheduled job on your always-on computer - the Mac's LaunchAgents
and Hermes's cron jobs - by name, schedule and how its last run went, so the dashboard's Readiness
screen can show one light per job. It publishes names, schedules, times and exit codes only; it does
not publish a job's arguments, settings, prompts, error text or logs. A Hermes job is shown as
"Hermes job <id>": Hermes copies the start of a job's prompt into the name of a job you did not name,
and keeps those words after the prompt is edited, so the script never uses or publishes a Hermes
job's name or prompt. To name a job on the wall, or hide it, ask Claude to edit [`jobs.yml`](jobs.yml).

- **How it works:** [The jobs file](.agent-team/status/README.md#the-jobs-file) - what it reads,
  what it keeps, and what is never kept.

## The memory graph

The same script can also draw the Obsidian vaults you choose as a graph on the Memory screen: each note a
dot, each link a line. Which vaults it may read is decided **on your computer**, in a file only you can
write (`allowed-vaults.yml`), not in this repo, which other people and cloud routines can push to; [`vaults.yml`](vaults.yml)
here only chooses among them, and can only ask for less. With no such file it reads nothing. By default it
publishes numbers and anonymous dots only, and you choose, vault by vault, to also publish its titles. It
never publishes what a note says, a path, or where a vault is on your computer.

- **How it works:** [The vaults file](.agent-team/status/README.md#the-vaults-file) - what it reads,
  what it keeps at each level, and what is never kept.

## Orders on your own computer (the Mac mailbox)

Optional, and off unless you switch it on. Out of the box, the board sends its Run, Add task and voice
orders to a cloud routine. With the mailbox it signs each order and leaves it waiting, and your always-on
Mac asks for it every 5 minutes, checks it, does it, and pushes the result to this repo. The Mac opens no
port. It does not trust the board or this repo to say what it may do: a file only you can write on the
Mac (`allowed-orders.yml`) does. At first that is two jobs, the morning intel and the task sweep, and plain
edits to your task cards. Claude runs with no shell, no connectors and no repo hooks, and only the runner
pushes.

- **Set it up:** [The Mac mailbox guide](.agent-team/mailbox/README.md) - eight copy-paste steps for the Mac
  Mini, how to pause it, and how to take it out again.
- **Known limit:** while the runner is paused or not ready it never tidies up, so the progress file of a run
  that crashed keeps saying "working" until the next full tick. A planned fix treats an old last-event time as stale.
- **Known limit:** if a signal arrives in the middle of writing an order's final word, the progress file says "unknown" even
  if the order landed. That is the cautious answer; the status file is what settles it.

---

## What this repo will never do

- **Send anything.** No email, no post, no message. Drafts only, always
- **Spend money without you saying so.** Arming is deliberate, one job at a time
- **Claim something ran when it did not.** Every number traces back to a file in here
- **Delete your work.** A job switched off keeps its file and gains a reason

