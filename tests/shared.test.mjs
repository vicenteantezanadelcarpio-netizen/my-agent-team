import test from 'node:test'
import assert from 'node:assert/strict'
import { read, stageDone } from './helpers/repo.mjs'

const BRAIN_FILES = ['shared/about-me.md', 'shared/business-brain.md', 'shared/writing-rules.md']

test('every business-brain file exists and names itself in an h1', async () => {
  for (const file of BRAIN_FILES) {
    const body = await read(file)
    assert.match(body, /^# .+/m, `${file} needs a top-level heading`)
  }
})

test('every unfilled field uses the fill marker so /onboard can find it', async () => {
  const briefDone = await stageDone('1 · Brief')
  const bodies = []
  for (const file of BRAIN_FILES) {
    const body = await read(file)
    bodies.push(body)
    assert.doesNotMatch(
      body,
      /\bTBD\b|\bTODO\b|\[your .+?\]/i,
      `${file} uses a placeholder that is not a fill marker`
    )
  }
  // Onboarding fills these files one at a time, so a file with no marker left is a filled file,
  // not a broken one. What must hold until the Brief stage is ticked done is that /onboard can
  // still see something empty: at least one file keeps a marker.
  if (!briefDone) {
    assert.ok(
      bodies.some((body) => /<!-- fill: [a-z0-9-]+ -->/.test(body)),
      'no brain file has a <!-- fill: ... --> marker left, but the Brief stage is not done; ' +
        '/onboard cannot see what is empty (tick the stage, or restore the marker)'
    )
  }
})

test('an agent is told what to do when the brain is empty', async () => {
  const readme = await read('shared/README.md')
  assert.match(readme, /fill marker/i)
  assert.match(
    readme,
    /still.*(useful|work)/i,
    'shared/README.md must state that agents degrade gracefully on an empty brain'
  )
})
