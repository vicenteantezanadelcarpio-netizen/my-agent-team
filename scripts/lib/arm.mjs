import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Two lists that have never met: what workflows/*.yml declares, and what the routines API says
// actually exists. Comparing them is the whole point of this file.
//
// This repo carries NINE workflow files declaring a schedule, against one real routine. A board
// reading those files would report nine jobs running, each with a next-run time, because a file that
// says `schedule:` looks exactly like a job that runs. Nobody lied; nothing checked.
//
// A job is in one of FOUR states, and the two middle ones are the bugs:
//
//   armed       the file says run it, and a routine exists
//   declared    the file says run it, and NOTHING rings          - a wish
//   unapproved  a routine RINGS, and the file says it is off     - spend nobody approved
//   off         deliberately not armed, and nothing rings
//
// `unapproved` matters as much as `declared`: a routine firing every morning, matched to a file
// saying `armed: false`, must not read as "0 jobs armed". A board that can only see over-claiming
// is half a check.
//
// `armed:` defaults to false. A workflow that has never been through /arm is off, not running,
// which is the safe direction and means nothing arms itself by existing.

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const SNAPSHOT = '.agent-team/routines.json'

export const ARM_STATES = ['armed', 'declared', 'unapproved', 'off', 'unknown']

function textOf(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// Names are compared case- and spacing-insensitively because one side is typed into a yaml file by
// a person and the other is typed into a web form by the same person on a different day.
function nameKey(value) {
  // Normalised because one side is typed into a yaml file and the other into a web form, possibly
  // on different machines. "Cafe\u0301" and "Caf\u00e9" look identical and are different strings;
  // an armed job would have reported declared AND left an orphan beside it.
  return textOf(value).normalize('NFC').toLowerCase().replace(/\s+/g, ' ')
}

export function isArmed(workflow) {
  return workflow?.data?.trigger?.armed === true
}

export function reasonFor(workflow) {
  return textOf(workflow?.data?.trigger?.reason)
}

// APPROVAL. The /arm skill's hardest rule is "never arm anything their ledger did not ask for",
// and until this function existed it lived only in that skill's prose - which is to say, in an
// instruction to a model, on the one step in the whole chain that spends money. Every other link
// is checked: check:ledger re-derives the week, check:proposals re-derives the proposals against
// the ledger and the catalogue. Then arming, the expensive end, was taken on trust.
//
// The rule, quoted from the skill: a workflow is armable when proposals.yml names it as
// `workflow:<slug>`, or when its steps are skills approved as `skill:<slug>`, or when its owner is
// an agent approved as `agent:<slug>`.
//
// ANY step, not all of them - the skill's own worked example is a student who approved
// `skill:triage-inbox` and later chained it into `inbox-triage`, a job whose other steps were
// never proposed on. Approving the work approves the job that does it.
export function approvedItems(proposals) {
  const rows = Array.isArray(proposals?.proposals) ? proposals.proposals : []
  const standing = Array.isArray(proposals?.standing) ? proposals.standing : []
  return new Set([
    ...rows.map((row) => textOf(row?.item)),
    ...standing.filter((row) => standingProblem(row) === null).map((row) => textOf(row?.item))
  ].filter(Boolean))
}

// STANDING. Two jobs answer no task in the ledger, because they check the team rather than do the
// owner's work - so /match can never propose them, and onboarding still asks for both
// to run. `standing:` in proposals.yml is where the owner approves them directly: these two slugs
// and no others, each with the owner's own words and the date they said yes. Anything wider would
// turn this into a side door past the ledger.
export const STANDING_JOBS = ['quality-review', 'weekly-tune-up']

function standingProblem(row) {
  const item = textOf(row?.item)
  const slug = item.startsWith('workflow:') ? item.slice('workflow:'.length) : ''
  if (!STANDING_JOBS.includes(slug)) {
    return `standing: \`${item || '<no item>'}\` is not one of the jobs that check the team (${STANDING_JOBS.map((s) => `workflow:${s}`).join(', ')}) - everything else is approved through the ledger`
  }
  if (textOf(row?.words) === '') return `standing: ${item} has no \`words:\` - the owner's own yes, quoted`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(textOf(row?.approved))) return `standing: ${item} needs \`approved:\` as the date the owner said yes, YYYY-MM-DD`
  return null
}

export function standingProblems(proposals) {
  const standing = proposals?.standing
  if (standing === undefined || standing === null || standing === '') return []
  if (!Array.isArray(standing)) {
    return typeof standing === 'object' && Object.keys(standing).length === 0 ? [] : ['`standing:` must be a list, or left out entirely']
  }
  return standing.map(standingProblem).filter(Boolean)
}

export function armedWithoutApproval(workflows, proposals) {
  const approved = approvedItems(proposals)
  const problems = []

  for (const workflow of Array.isArray(workflows) ? workflows.filter(Boolean) : []) {
    if (!isArmed(workflow)) continue

    const name = textOf(workflow?.data?.name) || workflow?.slug || 'a workflow'
    const slug = textOf(workflow?.slug)
    const owner = textOf(workflow?.data?.owner)
    const steps = Array.isArray(workflow?.data?.steps) ? workflow.data.steps : []

    const traces =
      (slug !== '' && approved.has(`workflow:${slug}`)) ||
      (owner !== '' && approved.has(`agent:${owner}`)) ||
      steps.some((step) => textOf(step) !== '' && approved.has(`skill:${textOf(step)}`))

    if (!traces) {
      problems.push(
        `${name}: is armed, but nothing in proposals.yml approves it - not workflow:${slug}, ` +
          `not agent:${owner || '<none>'}, and none of its steps. Run /match again now the job exists, or switch it off`
      )
    }
  }

  return problems
}

// The snapshot is how the truth reaches anything that cannot call the routines API — which is
// everything except a Claude Code session. The dashboard is a web app reading GitHub; it has no
// way to ask the API what is scheduled.
//
// It carries the moment it was taken, and every reader is expected to say so. A stale snapshot
// must read as stale. A snapshot presented as live is the same class of lie as a declared job.
// How stale is too stale to be worth trusting. A day: routines fire on schedules measured in
// hours, so a snapshot older than this has almost certainly missed something.
export const SNAPSHOT_STALE_AFTER_HOURS = 24

// "242426 hours old" is not a number anybody reads. Days past a couple of days, weeks past a
// fortnight - the point of the sentence is that somebody notices it, and a six-digit number of
// hours is noticed as noise.
export function describeAge(hours) {
  if (hours < 48) return `${Math.round(hours)} hours`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days} days`
  const weeks = Math.round(days / 7)
  if (weeks < 9) return `${weeks} weeks`
  const months = Math.round(days / 30)
  return months < 24 ? `${months} months` : `${Math.round(days / 365)} years`
}

export function readSnapshot(source, now = Date.now()) {
  if (source === null || source === undefined) {
    return { takenAt: null, routines: [], missing: true, reason: 'no snapshot has been taken yet' }
  }

  let parsed
  try {
    parsed = JSON.parse(source)
  } catch {
    // Corrupt is NOT the same as absent. Returning an empty routine list for an unreadable file
    // asserts "nothing is scheduled", which is a claim about somebody's account that a broken
    // file cannot support - the exact class of lie this module exists to catch.
    return { takenAt: null, routines: [], missing: true, unreadable: true, reason: 'the snapshot file could not be read' }
  }

  const routines = Array.isArray(parsed?.routines) ? parsed.routines : null
  if (!routines) {
    return { takenAt: null, routines: [], missing: true, unreadable: true, reason: 'the snapshot has no routines list' }
  }

  const takenAt = textOf(parsed?.takenAt) || null
  const takenMs = takenAt ? Date.parse(takenAt) : NaN
  if (!takenAt || Number.isNaN(takenMs)) {
    // Written without a stamp. It may be perfectly accurate, and there is no way to know - so it
    // is served, and it is served as unusable-as-evidence rather than as current.
    return { takenAt: null, routines, missing: true, unstamped: true, reason: 'the snapshot does not say when it was taken' }
  }

  const ageHours = (now - takenMs) / 3600_000

  // A stamp in the future is not fresh, it is wrong - a clock skew, a hand-edited file, a bad
  // timezone. Left alone it produced the worst possible answer: ageHours goes negative, so the
  // staleness test passes and a file stamped 2099 reads as the most current snapshot imaginable.
  // "A stale snapshot must read as stale, never as live" has to survive its own edge case.
  if (ageHours < 0) {
    return {
      takenAt,
      routines,
      ageHours,
      impossible: true,
      missing: true,
      reason: 'the snapshot is stamped in the future, so its age cannot be trusted'
    }
  }

  const stale = ageHours > SNAPSHOT_STALE_AFTER_HOURS
  return {
    takenAt,
    routines,
    ageHours,
    stale,
    reason: stale ? `the snapshot was taken ${describeAge(ageHours)} ago` : null
  }
}

export async function loadRoutineSnapshot(root = repoRoot, now = Date.now()) {
  let source = null
  try {
    source = await readFile(path.join(root, SNAPSHOT), 'utf8')
  } catch {
    source = null
  }
  return readSnapshot(source, now)
}

export function routineFor(workflow, routines) {
  const wanted = nameKey(workflow?.data?.name) || nameKey(workflow?.slug)
  if (!wanted) return null
  return (routines ?? []).find((routine) => nameKey(routine?.name) === wanted) ?? null
}

export function armState(workflow, routines) {
  const ringing = Boolean(routineFor(workflow, routines))
  if (!isArmed(workflow)) return ringing ? 'unapproved' : 'off'
  return ringing ? 'armed' : 'declared'
}

// Returns human-readable problems, the same contract as validateWorkflow and validateLedger.
export function validateArming(workflow) {
  const problems = []
  const trigger = workflow?.data?.trigger
  const name = textOf(workflow?.data?.name) || workflow?.slug || 'a workflow'

  const armed = trigger?.armed
  if (armed !== undefined && typeof armed !== 'boolean') {
    problems.push(`${name}: trigger.armed must be true or false`)
  }

  // Some jobs have no clock. A webhook is fired by an inbound request; a `fire: true` job is
  // fired by a button on the dashboard. Neither is ever "off" in the sense this check means, so
  // demanding a reason is asking somebody to justify a state the job was never in - and neither
  // can be armed with a schedule, because there is no schedule to pass. This matches workflows.mjs,
  // which accepts "at least one of: schedule, fire, webhook".
  const clockless = textOf(trigger?.schedule) === '' &&
    (trigger?.webhook === true || trigger?.fire === true)

  // Nothing is deleted here, ever. A job that is off keeps its file and gains a reason, so that
  // six weeks later the silence is a decision somebody made rather than something that looks
  // exactly like a mistake.
  if (armed !== true && !clockless && !reasonFor(workflow)) {
    problems.push(
      `${name}: is not armed and carries no reason - say what would have to change for it to be worth a run`
    )
  }

  // You cannot arm what has no time attached. An armed job with no schedule is a routine nobody
  // could have created, which means the flag is describing something that does not exist.
  //
  // Both clockless kinds are exempt. A webhook's routine is real and fires on request, and a
  // dashboard button is the same object: agent-cockpit's api/fire.js fires the registered routine
  // trigger URL. Exempting only webhooks would report a wired button as both "armed - a routine
  // exists" and "armed but declares no schedule" in one run, about one job.
  //
  // This rule now only fires on a trigger with no schedule, no fire and no webhook - which
  // validateWorkflow already rejects. That makes it the second layer rather than the first, and
  // it is kept deliberately: validateArming is called directly, and a rule that refuses to
  // describe a routine nobody could have created should not depend on another function running.
  if (armed === true && !clockless && textOf(trigger?.schedule) === '') {
    problems.push(`${name}: is armed but declares no schedule - there is nothing for a routine to fire on`)
  }

  return problems
}

// `routinesKnown` is the difference between "nothing rings" and "I have no idea what rings": with an
// unusable snapshot, armed jobs must not be reported as `declared` on no evidence.
export function reconcile(workflows, routines, { routinesKnown = true } = {}) {
  const buckets = { armed: [], declared: [], unapproved: [], off: [], unknown: [], orphans: [], problems: [] }
  const list = Array.isArray(workflows) ? workflows.filter(Boolean) : []
  const alarms = Array.isArray(routines) ? routines.filter(Boolean) : []
  const claimed = new Set()

  // Two workflow files with one name both matched the same routine and both reported `armed` -
  // one alarm clock, two jobs claiming it. Caught here rather than downstream, where it looks
  // like twice as much running as there is.
  const seenNames = new Map()
  for (const workflow of list) {
    const key = nameKey(workflow?.data?.name) || nameKey(workflow?.slug)
    if (key) seenNames.set(key, (seenNames.get(key) ?? 0) + 1)
  }
  for (const [key, count] of seenNames) {
    if (count > 1) {
      buckets.problems.push(`${key}: ${count} workflow files share this name, so a routine cannot be matched to one of them`)
    }
  }

  // And two routines with one name: the second silently vanished - not armed, not an orphan,
  // nowhere. Two alarm clocks for one job is a double fire and a double spend, and it is exactly
  // what /arm's own "confirm before you arm again" rule exists to prevent.
  const seenRoutines = new Map()
  for (const routine of alarms) {
    const key = nameKey(routine?.name)
    if (key) seenRoutines.set(key, (seenRoutines.get(key) ?? 0) + 1)
  }
  for (const [key, count] of seenRoutines) {
    if (count > 1) {
      buckets.problems.push(`${key}: ${count} routines share this name - they will all fire, and the spend is multiplied`)
    }
  }

  for (const workflow of list) {
    for (const problem of validateArming(workflow)) buckets.problems.push(problem)

    const routine = routineFor(workflow, alarms)
    if (routine) claimed.add(nameKey(routine.name))

    // With no trustworthy snapshot the only honest states are the ones the FILE decides.
    const state = routinesKnown ? armState(workflow, alarms) : (isArmed(workflow) ? 'unknown' : 'off')
    const row = {
      slug: workflow?.slug ?? null,
      name: textOf(workflow?.data?.name) || workflow?.slug || '(unnamed)',
      path: workflow?.path ?? null,
      schedule: textOf(workflow?.data?.trigger?.schedule) || null,
      // Carried so the reporter can tell a clockless job from one that owes a reason. Both
      // kinds are carried: a webhook and a dashboard button are clockless for different
      // reasons and a reader deserves to be told which.
      webhook: workflow?.data?.trigger?.webhook === true,
      fire: workflow?.data?.trigger?.fire === true,
      reason: reasonFor(workflow) || null,
      // Set exactly when something rings.
      routineId: routine?.id ?? null
    }
    buckets[state].push(row)

    // A wish is a problem: the check must not exit cleanly while a declared job has nothing running.
    if (state === 'declared') {
      buckets.problems.push(
        `${row.name}: the file says run it and nothing rings. Arm it, or set armed: false with a reason`
      )
    }

    if (state === 'unapproved') {
      buckets.problems.push(
        `${row.name}: a routine is firing for this and the file says armed: false - it is spending runs nobody approved. Either arm it in the file or remove the routine at claude.ai/code/routines`
      )
    }
  }

  // A routine pointing at this repo with no workflow behind it. Reported, never adopted: somebody
  // armed something that has since been renamed or removed, and quietly claiming it belongs to a
  // file it does not match would be inventing a connection.
  for (const routine of alarms) {
    if (!routinesKnown) break
    if (claimed.has(nameKey(routine?.name))) continue
    buckets.orphans.push({ id: routine?.id ?? null, name: textOf(routine?.name) || '(unnamed)' })
  }

  return buckets
}
