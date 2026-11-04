import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseFrontmatter } from './frontmatter.mjs'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const AGENT_DIR = '.claude/agents'

// Carried by every agent, no exceptions.
export const COMMON_BLOCKS = ['unattended-run', 'progress-grounding', 'boundaries', 'final-summary']

export const OPUS_BLOCKS = ['opus-conciseness', 'opus-scope', 'opus-corrections']
export const SONNET_BLOCKS = ['sonnet-verbosity']

export const AGENT_SPECS = {
  research: {
    model: 'sonnet',
    blocks: [...COMMON_BLOCKS, ...SONNET_BLOCKS, 'parallel-tool-calls'],
    workspace: 'agents/research/output',
    knowledge: null
  },
  content: {
    model: 'opus',
    blocks: [...COMMON_BLOCKS, ...OPUS_BLOCKS],
    workspace: 'agents/content/output',
    knowledge: null
  },
  email: {
    model: 'sonnet',
    blocks: [...COMMON_BLOCKS, ...SONNET_BLOCKS],
    workspace: 'agents/email/output',
    knowledge: null
  },
  'customer-service': {
    model: 'sonnet',
    blocks: [...COMMON_BLOCKS, ...SONNET_BLOCKS],
    workspace: 'agents/customer-service/output',
    knowledge: 'agents/customer-service/knowledge/faq.md'
  },
  sales: {
    model: 'opus',
    blocks: [...COMMON_BLOCKS, ...OPUS_BLOCKS],
    workspace: 'agents/sales/output',
    knowledge: 'agents/sales/knowledge/offer-sheet.md'
  },
  security: {
    model: 'sonnet',
    blocks: [...COMMON_BLOCKS, ...SONNET_BLOCKS],
    workspace: 'agents/security/output',
    knowledge: 'agents/security/knowledge/watch-list.md'
  },
  // The last read before the owner's. Opus because grading is judgement - a cheap grader
  // that passes everything is worse than no grader, since it teaches the owner to stop
  // reading the scores.
  editor: {
    model: 'opus',
    blocks: [...COMMON_BLOCKS, ...OPUS_BLOCKS],
    workspace: 'agents/editor/output',
    knowledge: null
  },
  // The owner's memory between sessions, the morning brief, and the list of what waits for a yes.
  // Sonnet because its daily work is reading the repo and writing short summaries; specialist
  // work goes to the specialists on their own models.
  'command-center': {
    model: 'sonnet',
    blocks: [...COMMON_BLOCKS, ...SONNET_BLOCKS],
    workspace: 'agents/command-center/output',
    knowledge: 'agents/command-center/knowledge/command-center-brief.md'
  },
  // Not a specialist: the CLAUDE.md front door itself, registered as an agent so
  // scheduled runs (the task sweep) can be owned by the role that actually routes work.
  orchestrator: {
    model: 'opus',
    blocks: [...COMMON_BLOCKS, ...OPUS_BLOCKS, 'opus-subagent-cap'],
    workspace: 'agents/orchestrator/output',
    knowledge: null
  }
}

export async function loadAgents() {
  const dir = path.join(repoRoot, AGENT_DIR)
  const files = (await readdir(dir)).filter((file) => file.endsWith('.md')).sort()
  const agents = []
  for (const file of files) {
    const relative = path.posix.join(AGENT_DIR, file)
    const source = await readFile(path.join(repoRoot, relative), 'utf8')
    const { data, body } = parseFrontmatter(source)
    agents.push({ slug: file.slice(0, -3), path: relative, data, body })
  }
  return agents
}
