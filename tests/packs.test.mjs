import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { repoRoot } from './helpers/repo.mjs'
import {
  CORE_AGENTS,
  CORE_SKILLS,
  CORE_WORKFLOWS,
  teamOnDisk,
  isPackFile,
  stripPacks
} from './helpers/core-team.mjs'

/* Installing a pack must never mean editing a test. The agent list, the specialist lists, the
   commit-rule inventory and the README counts all pin the TEMPLATE, and read anything a pack
   added as a pack (tests/helpers/core-team.mjs). That is only safe while "a pack added it" is
   provable - otherwise any new file would excuse itself. These guards are what keep it provable. */

test('everything in the team is either shipped by the template or traceable to an installed pack', async () => {
  const { unattributed } = await teamOnDisk()
  assert.deepEqual(
    unattributed,
    [],
    'these are not part of the shipped template and no installed pack agent owns or names them. ' +
      'If the template itself gained them, add them to tests/helpers/core-team.mjs and to the README ' +
      'count; if a pack brought them, its agent or workflow has to name them'
  )
})

test('every item the template ships is still there', async () => {
  const { agents, skills, workflows } = await teamOnDisk()
  for (const slug of CORE_AGENTS) assert.ok(agents.includes(slug), `.claude/agents/${slug}.md is missing`)
  for (const slug of CORE_SKILLS) assert.ok(skills.includes(slug), `.claude/skills/${slug}/ is missing`)
  for (const slug of CORE_WORKFLOWS) assert.ok(workflows.includes(slug), `workflows/${slug}.yml is missing`)
})

// The tracing is what every pack-tolerant guard leans on, so it is tested against a fixture repo
// with one real-shaped pack and two strays: a skill nobody names and a workflow owned by a core
// agent. Both strays have to come back unattributed, or a new core item could hide as a pack.
async function fixtureRepo() {
  const dir = await mkdtemp(join(tmpdir(), 'pack-trace-'))
  await mkdir(join(dir, '.claude/agents'), { recursive: true })
  await mkdir(join(dir, 'workflows'), { recursive: true })
  for (const slug of CORE_AGENTS) await writeFile(join(dir, '.claude/agents', `${slug}.md`), `---\nname: ${slug}\n---\n`)
  for (const slug of [...CORE_SKILLS, 'notes-tidy', 'stray-skill']) {
    await mkdir(join(dir, '.claude/skills', slug), { recursive: true })
    await writeFile(join(dir, '.claude/skills', slug, 'SKILL.md'), `---\nname: ${slug}\n---\n`)
  }
  for (const slug of CORE_WORKFLOWS) await writeFile(join(dir, 'workflows', `${slug}.yml`), 'owner: content\n')
  await writeFile(join(dir, '.claude/agents/notes.md'), '---\nname: notes\n---\nUse notes-tidy-extra and the notes-checkup workflow.\n')
  await writeFile(join(dir, 'workflows/notes-checkup.yml'), 'name: Notes Checkup\nowner: notes\nsteps: [notes-tidy, review-draft]\n')
  await writeFile(join(dir, 'workflows/stray-job.yml'), 'name: Stray\nowner: content\nsteps: [stray-skill]\n')
  return dir
}

test('a pack is traced through its agent, the workflows it owns and the skills they name - and nothing else is', async () => {
  const dir = await fixtureRepo()
  try {
    const { pack, unattributed } = await teamOnDisk(dir)
    assert.deepEqual(pack.agents, ['notes'])
    assert.deepEqual(pack.workflows, ['notes-checkup'])
    // Named by the pack workflow's steps. "notes-tidy-extra" in the agent text must not count as
    // naming "notes-tidy" - and does not need to, the workflow names it.
    assert.deepEqual(pack.skills, ['notes-tidy'])
    // review-draft is a core skill a pack workflow also names: it stays core.
    assert.ok(!pack.skills.includes('review-draft'))
    // The stray skill is named only by a workflow a CORE agent owns, which makes it core work,
    // not pack work - so both strays are reported.
    assert.deepEqual(unattributed.sort(), ['.claude/skills/stray-skill/', 'workflows/stray-job.yml'])

    assert.ok(isPackFile('.claude/agents/notes.md', pack))
    assert.ok(isPackFile('.claude/skills/notes-tidy/SKILL.md', pack))
    assert.ok(isPackFile('.claude/skills/notes-tidy/references/more.md', pack))
    assert.ok(!isPackFile('.claude/skills/notes-tidy-extra/SKILL.md', pack))
    assert.ok(!isPackFile('.claude/agents/content.md', pack))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('a name is only "mentioned" as a whole name, not as part of a longer one', async () => {
  const dir = await fixtureRepo()
  try {
    await writeFile(join(dir, 'workflows/notes-checkup.yml'), 'name: Notes Checkup\nowner: notes\nsteps: [review-draft]\n')
    const { pack, unattributed } = await teamOnDisk(dir)
    // Only "notes-tidy-extra" appears now, which is not notes-tidy.
    assert.deepEqual(pack.skills, [])
    assert.ok(unattributed.includes('.claude/skills/notes-tidy/'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('stripping packs is for scratch copies only - it refuses the repo itself', async () => {
  await assert.rejects(stripPacks(repoRoot), /scratch copies only/)
})
