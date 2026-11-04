import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { teamOnDisk } from './helpers/core-team.mjs'

/* The README is the first file a stranger reads and the last one anybody checks. It tells them to
   run `npm test` and expect a pass count with 0 failing, in the format the suite really prints (`pass N`, `fail 0`).
   The one sentence whose whole job is to let a beginner decide whether the install worked must not name a
   number or a format that is wrong.

   These tests make the claims checkable instead of hand-corrected: the counts come from the repo, and the
   test total comes from actually running the suite. */

const root = new URL('../', import.meta.url)
const readme = await readFile(new URL('README.md', root), 'utf8')

const countDirs = async (path) => {
  const entries = await readdir(new URL(path, root), { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).length
}
const countFiles = async (path, extension) => {
  const entries = await readdir(new URL(path, root), { withFileTypes: true })
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(extension)).length
}

/* The word map must know every count, not a few fixed numbers. Otherwise the next skill anyone
   adds fails this test no matter how well it is written - the map has no word for it, the
   README cannot be made to match, and an unattended Add-skill tap from the dashboard can
   never pass the checks it is told to run. A count the repo derives has to have a word for whatever it derives. */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
export function countWord(count) {
  if (!Number.isInteger(count) || count < 1 || count > 99) return String(count)
  if (count < 20) return ONES[count]
  const rest = count % 10
  return TENS[Math.floor(count / 10)] + (rest ? `-${ONES[rest].toLowerCase()}` : '')
}

test('the count has a word for every number a repo can reach, not just the three it shipped with', () => {
  assert.equal(countWord(25), 'Twenty-five')
  assert.equal(countWord(26), 'Twenty-six', 'the twenty-sixth skill was the one nobody could add')
  assert.equal(countWord(30), 'Thirty')
  assert.equal(countWord(9), 'Nine')
  assert.equal(countWord(41), 'Forty-one')
})

/* The README describes the team the template SHIPS - "Eight agents. Five do your business's
   work; three maintain the team itself" - with a table row for each. A pack adds agents, jobs and
   skills that the README never lists, so counting the folders raw made every pack install fail
   here and every pack's INSTALL.md tell the student to rewrite the README's numbers (which then
   no longer matched its own tables). So what a pack brought in is subtracted first. Only what
   tests/helpers/core-team.mjs can trace to an installed pack agent is subtracted; anything else
   extra still counts, so a new item added to the template itself still has to be counted here. */
test('the README names the real number of agents, jobs and skills', async () => {
  const { pack } = await teamOnDisk()
  const counts = {
    agents: (await countFiles('.claude/agents/', '.md')) - pack.agents.length,
    jobs: (await countFiles('workflows/', '.yml')) - pack.workflows.length,
    skills: (await countDirs('.claude/skills/')) - pack.skills.length
  }
  assert.ok(readme.includes(`**${countWord(counts.agents)} agents.**`),
    `the README does not say there are ${counts.agents} agents`)
  assert.ok(readme.includes(`**${countWord(counts.jobs)} jobs.**`),
    `the README does not say there are ${counts.jobs} jobs`)
  assert.ok(readme.includes(`**${countWord(counts.skills)} skills.**`),
    `the README does not say there are ${counts.skills} skills`)
})

test('the README quotes the number of tests the suite actually reports', () => {
  // The child runs the same suite with this flag set, which makes this test a no-op inside it -
  // otherwise asking the suite how many tests it has would spawn suites forever.
  if (process.env.AGENT_TEAM_README_SELF_CHECK === '1') return

  // NODE_TEST_CONTEXT is set for us by the runner, and passing it down makes the child report
  // in v8-serialized frames to a parent that is not listening - no readable summary at all.
  const env = { ...process.env, AGENT_TEAM_README_SELF_CHECK: '1' }
  delete env.NODE_TEST_CONTEXT
  const run = spawnSync(process.execPath, ['--test'], {
    cwd: fileURLToPath(root),
    encoding: 'utf8',
    env
  })
  // Quote the TOTAL, not the pass count: a test that needs a sibling checkout stands itself down
  // without one, so the pass count differs between copies while the total is the same everywhere.
  const reported = /^\s*(?:ℹ|#)\s*tests\s+(\d+)\s*$/m.exec(run.stdout ?? '')
  assert.ok(reported, `could not read a test count out of the suite's own output`)

  const claimed = /^\s*(?:ℹ|#)\s*tests\s+(\d+)\s*$/m.exec(readme)
  assert.ok(claimed, 'the README no longer quotes a test count for `npm test`')
  assert.equal(Number(claimed[1]), Number(reported[1]),
    `the README shows a beginner "tests ${claimed[1]}" and the suite reports ${reported[1]}`)

  // And the line that actually decides whether it worked has to be the one shown.
  assert.match(readme, /^\s*(?:ℹ|#)\s*fail\s+0\s*$/m,
    'the README no longer shows `fail 0`, which is the line that says the clone is good')
})

/* Every command in the install block is typed by somebody who has never used a terminal, on
   whichever machine they own. `rm -rf` is not a PowerShell command: on Windows it errors, and
   then the next three commands all appear to succeed while the clone quietly keeps our history
   and our remote. */

test('the install block is possible to follow on Windows', () => {
  const install = readme.split('## Install')[1].split('\n## ')[0]
  if (install.includes('rm -rf')) {
    assert.ok(install.includes('Remove-Item'),
      'the install tells a Windows reader to run `rm -rf`, which PowerShell cannot do, and offers no alternative')
    assert.ok(/powershell/i.test(install),
      'the Windows alternative is there but nothing says which shell it belongs to')
  }
})

test('the install does not tell anybody to run a command before installing the plugin that provides it', () => {
  const install = readme.split('## Install')[1].split('\n## ')[0]
  // The command as TYPED - alone on its own line inside a fence - not every mention of its name.
  const plugin = install.indexOf('/plugin install')
  const onboard = /^\/onboard\s*$/m.exec(install)
  assert.notEqual(plugin, -1, 'the install never mentions installing the agent-team-os plugin')
  assert.ok(onboard, 'the install never actually tells anybody to run /onboard')
  assert.ok(plugin < onboard.index, '`/onboard` is offered before the plugin that provides it is installed')
})

test('the install ends on main, which is the branch everything downstream looks for', () => {
  const install = readme.split('## Install')[1].split('\n## ')[0]
  // EVERY `git init`, not just one of them: a single `-b main` anywhere in the section would let the Mac block
  // quietly go back to `master` while the Windows block kept the guard green.
  const bare = /^git init\s*$/m.exec(install)
  assert.ok(!bare,
    'a bare `git init` still produces `master` on many installs, and the dashboard reads `main`')
})

test('the reader is told which shell to type any of this into, and that they need git', () => {
  const before = readme.split('## Before you start')[1].split('\n## ')[0]
  // Not /Git/ - "A GitHub account" would satisfy that, so the row could be deleted unnoticed.
  assert.match(before, /git --version/,
    'git is never listed as something you need, and step one is `git clone`')
  assert.match(before, /Terminal|PowerShell/, 'nothing tells the reader where these commands get typed')
})
