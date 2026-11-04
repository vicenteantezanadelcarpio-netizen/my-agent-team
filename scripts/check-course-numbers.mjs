// Checks that every number the Level 2 course states about itself is still true.
//
// Run it: node scripts/check-course-numbers.mjs <LEVEL_2 folder>
//
// Two places that assert the same fact drift apart unless something compares them. The counts
// are derived here from the files and compared with what the prose claims, so a lesson that is
// added, removed or re-timed fails this check until every dependent number is updated.

import { readFile, readdir, writeFile, rm, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
import path from 'node:path'

const root = process.argv[2]
if (!root) {
  console.log('usage: node scripts/check-course-numbers.mjs <LEVEL_2 folder>')
  process.exit(2)
}

const problems = []
const notes = []
const fail = (what) => problems.push(what)
const ok = (what) => notes.push(what)

const read = (file) => readFile(path.join(root, file), 'utf8')

// ---------------------------------------------------------------- the files

const all = (await readdir(root)).filter((f) => /^\d\d_.+\.md$/.test(f)).sort()
const numbered = all.filter((f) => !/^00_/.test(f))
const totalFiles = all.length // numbered lessons + the pre-work

ok(`${all.length} SOP files (${numbered.length} numbered + pre-work)`)

// ------------------------------------------------- 1. "Lesson N of M" headers

const seen = []
let declaredTotal = null

for (const file of all) {
  const body = await read(file)
  const header = body.match(/\*\*Lesson (\d+) of (\d+) ·/)
  if (!header) {
    if (!/^00_/.test(file)) fail(`${file}: no "**Lesson N of M ·" header`)
    continue
  }
  const [, n, m] = header
  seen.push({ file, n: Number(n) })
  if (declaredTotal === null) declaredTotal = Number(m)
  else if (declaredTotal !== Number(m)) {
    fail(`${file}: says "of ${m}" but another lesson says "of ${declaredTotal}"`)
  }
}

if (declaredTotal !== null && declaredTotal !== totalFiles) {
  fail(`lesson headers say "of ${declaredTotal}" but there are ${totalFiles} SOP files`)
} else if (declaredTotal !== null) {
  ok(`every lesson header says "of ${declaredTotal}", matching the file count`)
}

const numbers = seen.map((s) => s.n).sort((a, b) => a - b)
const expected = numbered.map((_, i) => i + 1)
if (numbers.join(',') !== expected.join(',')) {
  fail(`lesson numbers are ${numbers.join(',')} — expected ${expected.join(',')} (no gaps, no repeats)`)
} else {
  ok(`lesson numbers run 1–${numbers.length} with no gaps`)
}

// ------------------------------------------ 2. the index catalogue and its sum

const index = await read('00-INDEX.md')

// | 17 | [Arm Your Jobs](17_ARM_YOUR_JOBS.md) | 20m | ... |
const rows = [...index.matchAll(/^\|\s*(\d+)\s*\|\s*\[[^\]]+\]\(([^)]+)\)\s*\|\s*([^|]+?)\s*\|/gm)]

const catalogued = new Set()
let minuteSum = 0
for (const [, num, file, time] of rows) {
  catalogued.add(file)
  if (num === '0') continue // pre-work is "60–90m at home", not part of the lesson sum
  const mins = time.match(/(\d+)m/)
  if (!mins) { fail(`index row ${num} (${file}): no "NNm" in the time cell — got "${time}"`); continue }
  minuteSum += Number(mins[1])
}

for (const file of all) {
  if (!catalogued.has(file)) fail(`${file} exists but has no row in 00-INDEX.md's lesson table`)
}
for (const file of catalogued) {
  if (!all.includes(file)) fail(`00-INDEX.md lists ${file}, which is not a lesson file in this folder`)
}
if (catalogued.size === all.length) ok(`all ${all.length} SOPs have an index row, and nothing extra is listed`)

const claimed = index.match(/\((\d+) minutes across/)
if (!claimed) {
  fail('00-INDEX.md does not state "(NNN minutes across …)" — the total cannot be checked')
} else if (Number(claimed[1]) !== minuteSum) {
  fail(`00-INDEX.md claims ${claimed[1]} lesson-minutes; the table adds up to ${minuteSum}`)
} else {
  ok(`index claims ${minuteSum} lesson-minutes and the table adds up to ${minuteSum}`)
}

// --------------------------------------- 3. run of show: every session sums to 90

const show = await read('RUN_OF_SHOW.md')
const lines = show.split(/\r?\n/)

const SESSION_MINUTES = 90
const sessions = []

for (let i = 0; i < lines.length; i += 1) {
  const heading = lines[i].match(/^### (D\d·\d) — .+· (\d+) min\s*$/)
  if (!heading) continue
  const [, name, stated] = heading

  // Walk to the first table separator, then sum the second column until the table ends.
  let j = i + 1
  while (j < lines.length && !/^\|\s*-+/.test(lines[j])) {
    if (/^### /.test(lines[j])) break
    j += 1
  }
  if (j >= lines.length || !/^\|\s*-+/.test(lines[j])) {
    fail(`${name}: no block table found under its heading`)
    continue
  }

  let sum = 0
  let counted = 0
  for (j += 1; j < lines.length && lines[j].startsWith('|'); j += 1) {
    const cells = lines[j].split('|')
    const min = (cells[2] ?? '').trim()
    if (!/^\d+$/.test(min)) { fail(`${name}: block "${(cells[1] ?? '').trim()}" has no plain minute count ("${min}")`); continue }
    sum += Number(min)
    counted += 1
  }

  sessions.push({ name, sum, stated: Number(stated), blocks: counted })
}

if (sessions.length !== 9) {
  fail(`found ${sessions.length} sessions in RUN_OF_SHOW.md — expected 9`)
} else {
  ok('nine sessions found')
}

for (const s of sessions) {
  if (s.stated !== SESSION_MINUTES) fail(`${s.name}: heading says ${s.stated} min, not ${SESSION_MINUTES}`)
  if (s.sum !== SESSION_MINUTES) fail(`${s.name}: its ${s.blocks} blocks add up to ${s.sum}, not ${SESSION_MINUTES}`)
}

const dayTotal = sessions.reduce((a, s) => a + s.sum, 0)
const expectedTotal = sessions.length * SESSION_MINUTES
if (sessions.length === 9 && dayTotal !== expectedTotal) {
  fail(`sessions total ${dayTotal} minutes, not ${expectedTotal}`)
} else if (sessions.length === 9) {
  ok(`every session sums to ${SESSION_MINUTES}; nine sessions total ${dayTotal}`)
}

// ------------------------------- 4. the deck: sequential slides, matching masthead

const deck = await read('PRESENTATION.md')

const slides = [...deck.matchAll(/^## Slide (\d+) — /gm)].map((m) => Number(m[1]))
const sequential = slides.every((n, i) => n === i + 1)
if (!sequential) {
  const firstBad = slides.findIndex((n, i) => n !== i + 1)
  fail(`PRESENTATION.md slide numbers break at position ${firstBad + 1}: got ${slides[firstBad]}`)
} else {
  ok(`${slides.length} slides, numbered 1–${slides.length} with no gaps`)
}

const masthead = deck.match(/·\s*(\d+) lessons\s*·/)
if (!masthead) {
  fail('PRESENTATION.md masthead does not state "· N lessons ·"')
} else if (Number(masthead[1]) !== totalFiles) {
  fail(`PRESENTATION.md masthead says ${masthead[1]} lessons; there are ${totalFiles} SOP files`)
} else {
  ok(`deck masthead says ${totalFiles} lessons, matching the file count`)
}

// Every slide must name a lesson that exists, or be a declared exception —
// and every lesson must be named by at least one slide.
const covered = new Set()
for (const block of deck.split(/^## Slide /m).slice(1)) {
  const num = block.match(/^(\d+) — (.+)/)
  const lesson = block.match(/\*\*Lesson:\*\* ([^\s·]+)/)
  if (!num || !lesson) continue
  if (lesson[1] === '—') continue // the opener and closes; the deck declares these
  const n = Number(lesson[1])
  // 0 is the pre-work SOP, which is a real lesson the deck is allowed to cite.
  if (!Number.isInteger(n) || n < 0 || n > numbered.length) {
    fail(`slide ${num[1]} ("${num[2].trim()}") names Lesson ${lesson[1]}, which does not exist`)
  } else {
    covered.add(n)
  }
}

const uncovered = []
for (let n = 0; n <= numbered.length; n += 1) if (!covered.has(n)) uncovered.push(n)
if (uncovered.length) {
  fail(`no slide cites Lesson ${uncovered.join(', ')} — a lesson with no slide is taught from nothing`)
} else {
  ok(`every lesson 0–${numbered.length} is cited by at least one slide`)
}

// The index describes the deck too, and that prose drifts the moment a slide is added.
const deckClaim = index.match(/\*\*nine modules, one per session in the run of show\*\*, (\d+) slides/)
if (!deckClaim) {
  fail('00-INDEX.md no longer states the deck\'s slide count in the expected form — the claim cannot be checked')
} else if (Number(deckClaim[1]) !== slides.length) {
  fail(`00-INDEX.md says the deck is ${deckClaim[1]} slides; PRESENTATION.md has ${slides.length}`)
} else {
  ok(`index and deck agree on ${slides.length} slides`)
}

const coverageClaim = index.match(/every one of the (\w+) lessons carrying at least one slide/)
const WORDS = { seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20 }
if (coverageClaim) {
  const claimed = WORDS[coverageClaim[1].toLowerCase()]
  if (claimed !== totalFiles) {
    fail(`00-INDEX.md says "${coverageClaim[1]} lessons" carry a slide; there are ${totalFiles} SOP files`)
  } else {
    ok(`index's slide-coverage claim names all ${totalFiles} lessons`)
  }
}

// ------------------------------------------ the course cannot promise safety we do not have
//
// The course may not describe the settings-file deny list as covering send-capable tools while
// docs/safety/draft-only.md says that layer is still a gap. A lesson may describe layer 3 as a
// gap for the owner to close; it may not describe it as done.

const settings = JSON.parse(
  await readFile(new URL('../.claude/settings.json', import.meta.url), 'utf8')
)
const deniesSend = (settings.permissions?.deny ?? []).some((rule) =>
  /send|mail|message|reply|forward/i.test(rule)
)

if (!deniesSend) {
  // Three unordered tests rather than one ordered regex, so the claim is caught however the
  // sentence is phrased (verb before or after the noun, "permissions.deny" standing alone).
  //
  // This is a phrasing guard, not a proof: a determined paraphrase gets through.
  const NAMES_THE_FILE = /settings|permissions\s*\.\s*deny/i
  const CLAIMS_BLOCKING = /\b(?:den(?:ies|y|ying|ied)|block(?:s|ing|ed)?|prevent(?:s|ing|ed)?|cover(?:s|ing)?|stop(?:s|ping)?)\b/i
  const ABOUT_SENDING = /\bsend|sending|forward|repl(?:y|ies|ying)|mail\b/i
  // Lines that describe the gap, or tell the owner to close it, are the honest ones. The list is
  // deliberately tiny and every entry is a structural marker of an unchecked box or a whole
  // statement of the gap: a loose fragment here would let a false claim escape by containing it.
  const NEGATED = /not (?:yet )?in place|pending|⬜|☐|secret file|does not deny/i
  const CLAIMS_DENY = {
    test: (line) =>
      NAMES_THE_FILE.test(line) && CLAIMS_BLOCKING.test(line) && ABOUT_SENDING.test(line)
  }
  const offenders = []
  for (const file of all) {
    for (const line of (await read(file)).split('\n')) {
      if (CLAIMS_DENY.test(line) && !NEGATED.test(line)) offenders.push(`${file}: ${line.trim()}`)
    }
  }
  for (const offender of offenders) {
    fail(`a lesson says the settings file denies send tools, but none is denied — ${offender}`)
  }
  if (!offenders.length) ok('no lesson claims a send-tool deny list this repo does not have')
}

// ---------------------------------------------------------------------------------------------
// Any course file that mentions FIRE_TRIGGERS must name `task-intake` or defer to the lesson that
// does.
//
// The cockpit buttons (Add task, New workflow, Start, Done, Add agent, Add skill, Arm, Approve)
// dispatch to one dedicated routine, `task-intake`, not to each workflow by slug. Describing
// FIRE_TRIGGERS as "each workflow's slug" would send a reader to wire routines that return 404.
const FIRE_DOCS = [...all, 'RUN_OF_SHOW.md', 'PRESENTATION.md', '00-INDEX.md']
for (const file of FIRE_DOCS) {
  const body = await read(file).catch(() => null)
  if (body === null || !body.includes('FIRE_TRIGGERS')) continue
  // Naming the slug anywhere in the file covers that file. A file that never names it has to defer
  // in the passage itself: a file-level deferral is too far from the wiring it instructs.
  if (body.includes('task-intake')) {
    ok(`${file}: names task-intake alongside FIRE_TRIGGERS`)
    continue
  }
  const paragraphs = body.split(/\r?\n\s*\r?\n/)
  for (const para of paragraphs) {
    if (!para.includes('FIRE_TRIGGERS')) continue
    if (/Lesson 12|12_COCKPIT/.test(para)) continue
    fail(`${file}: a passage explains FIRE_TRIGGERS without naming "task-intake" or pointing ` +
      'at Lesson 12. Add task, New workflow, Arm and Approve all 404 without that entry, and ' +
      'it is not a workflow slug, so wiring every workflow does not supply it. Passage: ' +
      `"${para.trim().slice(0, 80)}…"`)
  }
}
// ---------------------------------------------------------------------------------------------
// A workflow example printed anywhere a reader follows must name skills that exist.
//
// An example whose `steps:` name skills this repo does not have would teach a file that the
// repo's own validator refuses.
//
// It covers the same file set as the FIRE_TRIGGERS check, and all three step forms the repo's
// fixtures use: inline, dashed list, and the `- skill:` map form.
//
// This script lives in the template, so its own repo root is where the real skills are - `root` is
// the LEVEL_2 folder passed on argv, which is a different repo entirely.
const templateRoot = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')))
const realSkills = new Set(
  (await readdir(path.join(templateRoot, '.claude', 'skills'), { withFileTypes: true }).catch(() => []))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
)

// Every step name a fenced example asks for, in any of the three forms.
const stepsIn = (body) => {
  const found = []
  for (const match of body.matchAll(/^[ \t]*steps:[ \t]*(?:\[([^\]]*)\]|((?:\r?\n[ \t]*-[^\n]*)+))/gm)) {
    if (match[1] !== undefined) {
      found.push(...match[1].split(',').map((step) => step.trim()).filter(Boolean))
    } else if (match[2] !== undefined) {
      for (const row of match[2].split(/\r?\n/)) {
        // Skill slugs are lowercase kebab, and the validator resolves only that shape. Requiring it
        // keeps out a prose line that starts `steps:` above an ordinary markdown list.
        const item = /^[ \t]*-[ \t]*(?:skill:[ \t]*)?([a-z][a-z0-9-]*)[ \t]*$/.exec(row)
        if (item) found.push(item[1])
      }
    }
  }
  return found
}

if (realSkills.size === 0) {
  fail('could not read .claude/skills, so workflow examples cannot be checked')
} else {
  for (const file of FIRE_DOCS) {
    const body = await read(file).catch(() => null)
    if (body === null) continue
    const steps = stepsIn(body)
    if (!steps.length) continue
    const missing = [...new Set(steps.filter((step) => !realSkills.has(step)))]
    if (missing.length) {
      fail(`${file}: a workflow example lists ${missing.map((s) => `"${s}"`).join(', ')}, ` +
        'which is not a skill in this repo. The lesson tells a reader every step already exists, ' +
        'and the repo\'s own validator rejects a workflow whose steps do not.')
    } else {
      ok(`${file}: workflow example names ${steps.length} real skills`)
    }
  }
}





// ---------------------------------------------------------------------------------------------
// The ledger lesson prints a sample run and tells the reader to copy ledger.example.yml and run
// the check. The sample must match what the example file produces, and so must the figures in the
// /ledger skill's read-back script.
//
// This lives here rather than in npm test because it needs the course folder, which is an
// argument to this script and absent on a student's machine. A test that skips is not a pass.
const { summarize, formatMoney } = await import('../scripts/lib/ledger.mjs')
const { parseSimpleYaml } = await import('../scripts/lib/yaml-lite.mjs')
const exampleSource = await readFile(path.join(templateRoot, 'ledger.example.yml'), 'utf8').catch(() => null)
const ledgerLesson = all.find((file) => /_YOUR_LEDGER\.md$/.test(file))
if (exampleSource && ledgerLesson) {
  const summary = summarize(parseSimpleYaml(exampleSource))
  // Printed through the same formatter check-ledger.mjs uses, so this guard cannot disagree with
  // the command itself.
  const line = `Your week: ${summary.hoursPerWeek.toFixed(1)} hours a week - ${formatMoney(summary.costPerWeek, summary.currency)}`
  const body = await read(ledgerLesson)
  if (!body.includes(line)) {
    fail(`${ledgerLesson}: its sample run does not match ledger.example.yml, which prints "${line}". ` +
      'The lesson tells a reader to copy that file and run the check, so the two have to agree.')
  } else if (!body.includes(`${summary.candidates.length} ready to hand over`)) {
    fail(`${ledgerLesson}: the example file has ${summary.candidates.length} ready; the sample says otherwise`)
  } else {
    ok(`${ledgerLesson}: sample run matches ledger.example.yml`)
  }
}

// ---------------------------------------------------------------------------------------------
// A lesson that prints the check's output has to print what the check prints.
//
// Any console line the reporter emits and a lesson quotes has to appear in both, so the lesson
// does not go on teaching a message the tool no longer emits.
const reporter = await readFile(path.join(templateRoot, 'scripts', 'check-ledger.mjs'), 'utf8').catch(() => '')
// Leading escapes are part of the source, not of what a lesson would quote; stripping them keeps
// the header line covered.
const PAIRED_LINES = [...reporter.matchAll(/console\.log\('([^']{25,})'\)/g)].map((m) => m[1].replace(/^(?:\\n)+/, ''))
if (ledgerLesson && PAIRED_LINES.length) {
  const body = await read(ledgerLesson)
  // Only the lines the lesson has chosen to quote - it does not have to show all of them.
  const quotedish = PAIRED_LINES.filter((line) => body.includes(line.slice(0, 20)))
  for (const line of quotedish) {
    if (!body.includes(line)) {
      fail(`${ledgerLesson}: quotes the check's output but not as the check prints it. ` +
        `check-ledger.mjs emits "${line}" and the lesson has a near-miss of it.`)
    }
  }
  // Pinned, because "the lines the lesson quotes" is decided by a 20-character prefix: a line
  // reworded inside that prefix would leave coverage silently. The number is asserted rather than
  // printed, so if the reporter gains or loses a line the lesson shows, this fails and both get
  // updated together.
  const QUOTED_IN_LESSON = 5
  if (quotedish.length !== QUOTED_IN_LESSON) {
    fail(`${ledgerLesson}: quotes ${quotedish.length} of the check's output lines, expected ${QUOTED_IN_LESSON}. A line was reworded on one side only, or the block changed shape.`)
  } else {
    ok(`${ledgerLesson}: quotes all ${QUOTED_IN_LESSON} lines of the check's flag block verbatim`)
  }
}

// ---------------------------------------------------------------------------------------------
// A lesson that shows what a command prints has to show what it prints.
//
// The checks are run against the shipped example files, and every line of a lesson's sample
// block must be a line the command actually printed. A line ending in "..." may be a prefix:
// truncating a long line is honest, rewording it is not.
const SAMPLE_BLOCKS = [
  { lesson: /_YOUR_LEDGER\.md$/, script: 'check-ledger.mjs', starts: /^Your week: / },
  { lesson: /_THE_MATCH\.md$/, script: 'check-proposals.mjs', starts: /^\d+ proposals?, covering / }
]

// The sample blocks are graded by RUNNING the command and comparing what it prints. That needs
// a ledger.yml and a proposals.yml to read, so the fixtures go in a temp directory and the
// commands are pointed at it (both take a data root as argv[2]). Nothing is written into the
// repo, so a real ledger.yml there is no problem. The catalogue still comes from THIS repo,
// because the agents and skills being matched against are this repo's.
const withExamples = async (run) => {
  const copies = [['ledger.example.yml', 'ledger.yml'], ['proposals.example.yml', 'proposals.yml']]
  const dir = await mkdtemp(path.join(tmpdir(), 'check-course-'))
  try {
    for (const [src, dst] of copies) {
      const source = await readFile(path.join(templateRoot, src), 'utf8').catch(() => null)
      if (source === null) continue
      await writeFile(path.join(dir, dst), source)
    }
    return await run(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

for (const spec of SAMPLE_BLOCKS) {
  const lessonFile = all.find((file) => spec.lesson.test(file))
  if (!lessonFile) continue
  const body = await read(lessonFile)
  // Anchored at line starts, or a closing fence pairs with the NEXT opening one and the capture is
  // the prose between two blocks.
  const fenced = [...body.matchAll(/^```[a-z]*\n([\s\S]*?)^```/gm)].map((m) => m[1])
  const sample = fenced.find((chunk) => spec.starts.test(chunk.trimStart()))
  if (!sample) {
    // A guard that finds nothing must say so, or it would look like a pass.
    fail(`${lessonFile}: no sample block matching ${spec.starts} - either the lesson stopped showing what ${spec.script} prints, or this check stopped being able to find it.`)
    continue
  }

  const printed = await withExamples(async (dataRoot) => {
    const result = await run(process.execPath, [path.join(templateRoot, 'scripts', spec.script), dataRoot],
      { cwd: templateRoot }).catch((error) => ({ stdout: error.stdout ?? '' }))
    return (result.stdout ?? '').split(/\r?\n/).map((line) => line.trimEnd())
  })

  const missing = []
  for (const raw of sample.split(/\r?\n/)) {
    const line = raw.trimEnd()
    if (!line.trim()) continue
    const truncated = line.endsWith('...')
    const stem = truncated ? line.slice(0, -3) : line
    const found = printed.some((out) => (truncated ? out.startsWith(stem) : out === line))
    if (!found) missing.push(line.trim())
  }

  if (missing.length) {
    fail(`${lessonFile}: its sample block shows ${missing.length} line(s) the command does not ` +
      `print. First: "${missing[0].slice(0, 90)}". A line may be truncated with "..." but not reworded.`)
  } else {
    ok(`${lessonFile}: every line of its sample block is real output of ${spec.script}`)
  }
}

// ---------------------------------------------------------------------------------------------
// The arming lesson names the settled states. So does check-arming, in a ternary with two
// branches, and the lesson has to quote the right one.
//
// The `fired by webhook` branch only prints when a webhook job is sitting at `armed: false`. A
// student who finished the arming steps sees the other branch, so the lesson must quote the PASS
// branch and must not present the webhook branch as the pass sentence. Whitespace is normalised
// so wrapping a quote across two lines is not a failure, and a missing check-arming.mjs fails
// rather than skipping the block.
const armLesson = all.find((file) => /_ARM_YOUR_JOBS\.md$/.test(file))
if (armLesson) {
  const armingScript = await readFile(path.join(templateRoot, 'scripts', 'check-arming.mjs'), 'utf8')
    .catch(() => null)
  if (armingScript === null) {
    fail(`${armLesson}: scripts/check-arming.mjs could not be read, so its settled-states sentence cannot be checked`)
  } else {
    const branches = [...armingScript.matchAll(/'\\nEvery job is ([^']+)'/g)].map((m) => m[1])
    if (branches.length !== 2) {
      fail(`check-arming.mjs no longer has two settled-states branches (found ${branches.length}) — ${armLesson} quotes one of them`)
    } else {
      // Strips blockquote markers as well as whitespace: the lesson quotes this inside a `>` block, so
      // a wrap puts `> ` in the middle of the sentence.
      const flat = (text) => text.replace(/^[ \t]*>[ \t]?/gm, ' ').replace(/\s+/g, ' ')
      const body = flat(await read(armLesson))
      const [webhookBranch, passBranch] = branches[0].includes('webhook')
        ? [branches[0], branches[1]]
        : [branches[1], branches[0]]
      if (!body.includes(flat(passBranch))) {
        fail(`${armLesson}: does not quote the sentence check:arming prints when a finished repo passes — "${passBranch}"`)
      } else if (body.includes(flat(webhookBranch))) {
        fail(`${armLesson}: quotes "${webhookBranch}" — that branch prints only while a webhook job sits at armed: false, so it is not what passing looks like`)
      } else if (!webhookBranch.includes('fired by webhook')) {
        // The lesson does not quote this branch; it describes it as "with `fired by webhook` in the
        // middle". If the branch stops containing that phrase, the description is stale.
        fail(`${armLesson}: describes check:arming's other branch as containing "fired by webhook", which it no longer does — the branch now reads "${webhookBranch}"`)
      } else {
        ok(`${armLesson}: quotes check:arming's pass sentence, describes its webhook branch, and does not confuse the two`)
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// One lesson shows what check:arming prints BEFORE a snapshot exists. That transcript is real
// output, so it is pinned by sentence: every distinctive line has to exist on both sides, and
// the failure says which side moved.
const noSnapshotLines = [
  'No usable snapshot of your routines',
  'Run /routines first. Until then this can only report what your FILES claim,',
  'and a file claiming a schedule is exactly what this command exists to check.',
  'the file says should run - whether anything rings is UNKNOWN',
  'The file says these should run - nothing here can tell you whether they do'
]

const webhookLesson = all.find((file) => /_CUSTOMER_SERVICE\.md$/.test(file))
if (webhookLesson) {
  const armingSource = await readFile(path.join(templateRoot, 'scripts', 'check-arming.mjs'), 'utf8')
    .catch(() => null)
  if (armingSource === null) {
    fail(`${webhookLesson}: scripts/check-arming.mjs could not be read, so its no-snapshot transcript cannot be checked`)
  } else {
    const flat = (text) => text.replace(/^[ \t]*>[ \t]?/gm, ' ').replace(/\s+/g, ' ')
    const lessonBody = flat(await read(webhookLesson))
    const scriptBody = flat(armingSource)
    const goneFromScript = noSnapshotLines.filter((line) => !scriptBody.includes(flat(line)))
    const goneFromLesson = noSnapshotLines.filter((line) => !lessonBody.includes(flat(line)))
    if (goneFromScript.length) {
      fail(`${webhookLesson}: check:arming no longer prints ${goneFromScript.length} line(s) the ` +
        `lesson quotes. First: "${goneFromScript[0].slice(0, 70)}". The command was reworded and the lesson was not.`)
    } else if (goneFromLesson.length) {
      fail(`${webhookLesson}: its transcript has lost ${goneFromLesson.length} line(s) the command ` +
        `still prints. First: "${goneFromLesson[0].slice(0, 70)}". The lesson was reworded and the command was not.`)
    } else {
      ok(`${webhookLesson}: every line of its no-snapshot check:arming transcript is real output`)
    }
  }
}

// ---------------------------------------------------------------------------------------------
// A slash command the course tells somebody to type has to exist. The pairing runs across three
// repos - the lessons here, the plugin's skills in agent-team-os, and this template's own skills -
// so renaming a skill in the plugin would otherwise break references with no test going red.
//
// Four things are deliberately NOT treated as commands, because each would be a false positive:
//   <!-- /prompt-block -->      a marker comment, not something anybody types
//   github.com/<you>/repo       a URL
//   `agents/<name>/output/`     a path - the > of the placeholder reads as a blockquote marker
//   /plugin, /schedule          Claude Code's own commands, not this course's to ship
const CLAUDE_CODE_COMMANDS = new Set(['plugin', 'schedule'])
const skillDirs = async (dir) =>
  (await readdir(dir, { withFileTypes: true }).catch(() => []))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

const pluginSkills = process.env.AGENT_TEAM_OS
  ? path.join(process.env.AGENT_TEAM_OS, 'skills')
  : path.join(templateRoot, '..', 'agent-team-os', 'agent-team-os', 'skills')
const fromPlugin = await skillDirs(pluginSkills)
const fromTemplate = await skillDirs(path.join(templateRoot, '.claude', 'skills'))

if (fromPlugin.length === 0) {
  // Loudly: half the commands live in the plugin, so without it this check would pass by seeing
  // nothing.
  fail(`could not read the plugin's skills at ${pluginSkills}, so slash commands cannot be checked. Clone agent-team-os beside this repo, or set AGENT_TEAM_OS to it`)
} else {
  const commands = new Set([...fromPlugin, ...fromTemplate])
  const SLASH = /(^|[\s`"'(\[|:])\/([a-z][a-z0-9-]*)/gm
  const counts = new Map()
  let dangling = 0
  for (const file of FIRE_DOCS) {
    const body = await read(file).catch(() => null)
    if (body === null) continue
    body.split(/\r?\n/).forEach((raw, index) => {
      // STRIPPED, not skipped. Dropping a whole line because it holds a URL or a marker comment would
      // lose every command on it too. `**` goes because a command written in bold - **`/arm`** -
      // otherwise has an asterisk in front of it, and an asterisk cannot join the prefix class.
      //
      // A command written inside a comment is not checked: a reader cannot type what a reader cannot
      // see.
      const line = raw
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/\*\*/g, ' ')
        .replace(/^\s*>[\s>]*/, '')
      for (const [, , name] of line.matchAll(SLASH)) {
        if (CLAUDE_CODE_COMMANDS.has(name)) continue
        if (commands.has(name)) {
          counts.set(name, (counts.get(name) ?? 0) + 1)
          continue
        }
        dangling += 1
        fail(`${file}:${index + 1}: names /${name}, which is neither a skill in agent-team-os nor one in this template`)
      }
    })
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0)
  if (dangling === 0) {
    ok(`all ${total} slash-command references resolve to a real skill (${counts.size} commands)`)
  }
}

// ---------------------------------------------------------------------------------------------
// A workflow file a lesson tells you to open has to be in the repo it tells you to open it in.
// A specific name that does not exist is not allowed; a placeholder such as
// `workflows/<your-slug>.yml` is fine because it is honest about being yours.
//
// FIRE_DOCS, not `all`: the run of show is the script somebody teaches from, so it is scanned too.
const shippedWorkflows = new Set(
  (await readdir(path.join(templateRoot, 'workflows')).catch(() => []))
    .filter((entry) => /\.ya?ml$/.test(entry))
)
if (shippedWorkflows.size === 0) {
  fail('could not read workflows/ in the template, so lesson references to workflow files cannot be checked')
} else {
  let dangling = 0
  const seen = new Set()
  for (const file of FIRE_DOCS) {
    const body = await read(file).catch(() => null)
    if (body === null) continue
    // Scanned twice: as written, and with line breaks closed up, because a path that wraps across two
    // lines is still a path a reader will follow.
    for (const text of [body, body.replace(/\n[ \t]*/g, '')]) {
      for (const [, named] of text.matchAll(/workflows\/([A-Za-z0-9._<>{}-]+\.ya?ml)/g)) {
        if (/[<{]/.test(named)) continue
        if (shippedWorkflows.has(named)) continue
        const key = `${file}:${named}`
        if (seen.has(key)) continue
        seen.add(key)
        dangling += 1
        fail(`${file}: names workflows/${named}, which the template does not ship`)
      }
    }
  }
  if (dangling === 0) {
    ok('every workflow file a lesson names is one the repo actually ships')
  }
}

// ---------------------------------------------------------------------------------------------
// The guard above is scoped to one lesson, but check:arming's output is quoted in more than one.
// Find the line the script actually prints, and require every lesson that quotes any part of it
// to quote the current version. Em dashes and wrapping are normalised.
const clocklessLine = (await readFile(path.join(templateRoot, 'scripts', 'check-arming.mjs'), 'utf8')
  .catch(() => ''))
  .match(/\}\s*(with no clock[^`]*?)`\)/)?.[1]

if (!clocklessLine) {
  fail('check-arming.mjs no longer prints a "with no clock" count line - the lessons quoting it cannot be checked')
} else {
  const flatten = (text) =>
    text.replace(/^[ 	]*>[ 	]?/gm, ' ').replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim()
  const wanted = flatten(clocklessLine)
  const tail = 'nothing to be off from'
  let stale = 0
  for (const file of all) {
    const body = flatten(await read(file))
    if (!body.includes(tail)) continue
    if (body.includes(wanted)) continue
    stale += 1
    fail(`${file}: quotes check:arming's clockless line, but not as it now reads - "${clocklessLine}"`)
  }
  if (stale === 0) {
    ok(`every lesson quoting check:arming's clockless line quotes it as the script now prints it`)
  }
}


// ---------------------------------------------------------------------------------------------
// A distinction a lesson tells the reader to make has to exist in the tool that reports it - and
// existing means the tool prints something, not that the word appears somewhere in the file.
//
// The guard requires the printable line itself (the zero-verdicts branch of write-quality-review),
// not just the word.
const OUTPUT_LINE = '**Acceptance rate: uncomputable'
const skillFile = path.join(templateRoot, '.claude', 'skills', 'write-quality-review', 'SKILL.md')
const reviewSkill = await readFile(skillFile, 'utf8').catch(() => null)
const improveLesson = all.find((file) => /_IMPROVE\.md$/.test(file))
if (improveLesson) {
  const body = await read(improveLesson)
  const lessonSays = /uncomputable/i.test(body)
  if (reviewSkill === null) {
    fail(`${improveLesson}: write-quality-review/SKILL.md could not be read, so the acceptance-rate wording cannot be checked`)
  } else if (!lessonSays) {
    fail(`${improveLesson}: no longer explains "uncomputable", which is what an empty quality/ folder produces`)
  } else if (!reviewSkill.includes(OUTPUT_LINE)) {
    fail(`${improveLesson}: tells the reader to distinguish 0% from "uncomputable", but ` +
      `write-quality-review does not prescribe the line to print ("${OUTPUT_LINE}…") — the word ` +
      'appearing in the file is not the same as the tool having the branch.')
  } else {
    ok(`${improveLesson}: the uncomputable branch prescribes its output line, and the lesson teaches it`)
  }
}


for (const note of notes) console.log(`ok   ${note}`)


if (problems.length) {
  console.log('')
  for (const p of problems) console.log(`FAIL ${p}`)
  console.log(`\n${problems.length} problem(s) - the course prose no longer matches the files`)
  process.exit(1)
}
console.log('\nevery stated course number matches what the files actually contain')
