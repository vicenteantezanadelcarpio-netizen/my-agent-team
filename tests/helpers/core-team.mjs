import { readFile, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { repoRoot } from './repo.mjs'

/* The team as this template ships it, and what an installed pack has added on top.

   The guards in this suite must not pin the whole team by name: the agent list, the
   specialists CLAUDE.md and routing.md must name, the prompt files that mandate a commit, the
   counts the README states. Each would be right about the template and wrong the moment a
   student installs a pack. A student must never have to edit a test to install something we ship.

   So the pins below describe the template ONLY, and anything else on disk is read as a pack, but
   only if it can be traced to one:

     - a pack agent is an agent file in .claude/agents/ that is not a core agent. It must be
       registered in AGENT_SPECS (scripts/lib/agents.mjs) like any agent, and every guard that
       checks an agent checks it too.
     - a pack workflow is a workflow whose `owner` is a pack agent.
     - a pack skill is a skill a pack agent or a pack workflow names.

   Anything extra that traces to no pack is reported by `teamOnDisk().unattributed`, and
   tests/packs.test.mjs fails on it. That is what keeps the core pins honest: a new skill added to
   the TEMPLATE itself traces to no pack, so it still has to be added here, and to the README
   count, before the suite goes green - exactly as before.

   Adding a core agent, skill or workflow to the template means adding it to the list below. */

export const CORE_AGENTS = [
  'command-center',
  'content',
  'customer-service',
  'editor',
  'email',
  'orchestrator',
  'research',
  'sales',
  'security'
]

// Who you delegate to - every core agent except the front door's own card.
export const CORE_SPECIALISTS = ['research', 'content', 'email', 'customer-service', 'sales', 'security', 'editor', 'command-center']

export const CORE_SKILLS = [
  'approval-queue',
  'capture-verdict',
  'check-status',
  'check-whats-changed',
  'close-session',
  'collect-run-logs',
  'collect-voice-notes',
  'command-center-onboarding',
  'connect',
  'daily-brief',
  'draft-chase-messages',
  'draft-content-queue',
  'draft-replies',
  'forget-or-correct',
  'high-stakes-check',
  'install-stack',
  'learn-from-the-week',
  'recall',
  'remember',
  'review-draft',
  'review-pipeline',
  'route-request',
  'run-a-play',
  'run-log',
  'scan-market',
  'scan-repo-security',
  'surplus-burn',
  'sync',
  'tidy-memory',
  'tidy-request',
  'token-saver',
  'track-projects',
  'triage-inbox',
  'watch-updates',
  'work-the-tasks',
  'write-intel-brief',
  'write-quality-review',
  'write-tune-up',
  'write-weekly-review'
]

export const CORE_WORKFLOWS = [
  'approval-queue',
  'daily-brief',
  'draft-queue',
  'gone-cold',
  'inbox-triage',
  'memory-tidy',
  'morning-intel',
  'quality-review',
  'security-review',
  'task-sweep',
  'weekly-review',
  'weekly-tune-up'
]

async function names(root, dir, keep) {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true }).catch(() => [])
  return entries.filter(keep).map((entry) => entry.name)
}

const ownerOf = (source) => (/^owner:\s*['"]?([a-z0-9-]+)/m.exec(source) ?? [])[1]
const mentions = (text, name) => new RegExp(`(^|[^a-z0-9-])${name}([^a-z0-9-]|$)`).test(text)

export async function teamOnDisk(root = repoRoot) {
  const agents = (await names(root, '.claude/agents', (e) => e.isFile() && e.name.endsWith('.md')))
    .map((file) => file.replace(/\.md$/, ''))
    .sort()
  const skills = (await names(root, '.claude/skills', (e) => e.isDirectory() && !e.name.startsWith('.'))).sort()
  const workflows = (await names(root, 'workflows', (e) => e.isFile() && e.name.endsWith('.yml')))
    .map((file) => file.replace(/\.yml$/, ''))
    .sort()

  const packAgents = agents.filter((slug) => !CORE_AGENTS.includes(slug))
  const agentText = await Promise.all(packAgents.map((slug) => readFile(path.join(root, '.claude/agents', `${slug}.md`), 'utf8')))

  const packWorkflows = []
  const workflowText = []
  const unattributed = []
  for (const slug of workflows.filter((name) => !CORE_WORKFLOWS.includes(name))) {
    const source = await readFile(path.join(root, 'workflows', `${slug}.yml`), 'utf8')
    if (packAgents.includes(ownerOf(source))) {
      packWorkflows.push(slug)
      workflowText.push(source)
    } else {
      unattributed.push(`workflows/${slug}.yml`)
    }
  }

  const packSkills = []
  const packText = [...agentText, ...workflowText].join('\n')
  for (const slug of skills.filter((name) => !CORE_SKILLS.includes(name))) {
    if (mentions(packText, slug)) packSkills.push(slug)
    else unattributed.push(`.claude/skills/${slug}/`)
  }

  return {
    agents,
    skills,
    workflows,
    pack: { agents: packAgents, skills: packSkills, workflows: packWorkflows },
    unattributed
  }
}

// The paths a pack brought in, relative to the repo root. A skill is its whole folder.
export function packPaths(pack) {
  return [
    ...pack.agents.map((slug) => `.claude/agents/${slug}.md`),
    ...pack.skills.map((slug) => `.claude/skills/${slug}/`),
    ...pack.workflows.map((slug) => `workflows/${slug}.yml`)
  ]
}

// True when a repo-relative prompt file (as tests/commit-override.test.mjs walks them) came in
// with a pack: the pack agent's own card, or anything inside a pack skill's folder.
export function isPackFile(file, pack) {
  return packPaths(pack).some((owned) => (owned.endsWith('/') ? file.startsWith(owned) : file === owned))
}

// Several guards were written against the catalogue the template SHIPS - their expected answers
// quote its descriptions verbatim. A pack legitimately changes what a word is worth in a bigger
// catalogue, so those guards read the shipped items only. What they prove about the template is
// unchanged; what a pack does to matching is the pack's to prove.
export const CORE_IDS = new Set([
  ...CORE_AGENTS.map((slug) => `agent:${slug}`),
  ...CORE_SKILLS.map((slug) => `skill:${slug}`),
  ...CORE_WORKFLOWS.map((slug) => `workflow:${slug}`)
])

export const shippedOnly = (catalogue) => catalogue.filter((item) => CORE_IDS.has(item.id))

// For a SCRATCH COPY of this repo: delete whatever the packs installed here brought in, so a
// script run inside the copy sees the team the template ships. Never pointed at the repo itself.
export async function stripPacks(copy) {
  if (path.resolve(copy) === path.resolve(repoRoot)) throw new Error('stripPacks is for scratch copies only')
  const { pack } = await teamOnDisk(repoRoot)
  for (const owned of packPaths(pack)) await rm(path.join(copy, owned), { recursive: true, force: true })
}

// The specialists a test should expect CLAUDE.md and routing.md to name: the template's own,
// plus every installed pack agent (a pack agent is always a specialist you delegate to).
export async function expectedSpecialists() {
  const { pack } = await teamOnDisk()
  return [...CORE_SPECIALISTS, ...pack.agents]
}
