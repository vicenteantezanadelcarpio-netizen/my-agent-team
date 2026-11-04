import test from 'node:test'
import assert from 'node:assert/strict'
import { read } from './helpers/repo.mjs'
import { loadAgents } from '../scripts/lib/agents.mjs'

test('the sales agent works without a CRM and says so', async () => {
  const sales = (await loadAgents()).find((agent) => agent.slug === 'sales')
  assert.ok(sales, '.claude/agents/sales.md is missing')
  assert.match(
    sales.body,
    /agents\/sales\/output\/pipeline\.md/,
    'the no-CRM default is the pipeline file; the agent must name it'
  )
  assert.match(sales.body, /no CRM|without a CRM/i, 'the agent must state that it works with no CRM connected')
})

test('the pipeline table has the columns the agent appends', async () => {
  const pipeline = await read('agents/sales/output/pipeline.md')
  for (const column of ['Date', 'Prospect', 'Source', 'Stage', 'Next action', 'Why']) {
    assert.ok(pipeline.includes(column), `pipeline.md is missing the ${column} column`)
  }
})

// Stage is a required column and needs one defined vocabulary, in the agent file and in pipeline.md:
// a column every run words differently cannot be sorted, filtered or counted. review-pipeline does
// NOT read this column - it infers state from prose in the row.
const STAGES = ['Researched', 'Skipped', 'Approached', 'Replied', 'Cold', 'Closed']

test('the pipeline defines its stage vocabulary, and the agent knows it', async () => {
  const pipeline = await read('agents/sales/output/pipeline.md')
  for (const stage of STAGES) {
    assert.ok(
      pipeline.includes(`\`${stage}\``),
      `pipeline.md never defines the ${stage} stage`
    )
  }
  const sales = (await loadAgents()).find((agent) => agent.slug === 'sales')
  for (const stage of STAGES) {
    assert.ok(sales.body.includes(stage), `sales.md never names the ${stage} stage`)
  }
})

// The agent is told to recommend skipping a poor fit, so its output template must not mandate
// an "Outreach draft" and a "Follow-up" heading regardless - or a skip would produce a pitch
// section with "none" written under it. The template must say the skip path omits them.
test('a skipped prospect is not made to carry an outreach section', async () => {
  const sales = (await loadAgents()).find((agent) => agent.slug === 'sales')
  assert.match(
    sales.body,
    /on a skip, leave them out/i,
    'the output template never says the outreach sections are omitted on a skip'
  )
})
