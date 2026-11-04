// The two setup records are part of the team, not scratch: `.agent-team/onboarding-state.md` (which
// /onboard phase comes next, and what the board reads for its setup ring) and
// `.agent-team/customize-state.json` (what /customize-team filled and what was skipped). Both are
// committed, so a second computer, the board and a later run all see the same progress. A student may see
// customize-state.json make the folder "look dirty" and wonder whether to ignore
// it; the answer is to commit it, the same way as onboarding-state.md. This holds .gitignore to that.
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))

// `git check-ignore` only answers inside a git work tree. The folder a student is handed is not one
// yet (no `git init`), and asking git there fails for a reason that has nothing to do with the
// ignore rules. Only then is this skipped, with the reason printed; in this folder's own repo it
// runs and fails for real. Same test as '.env never appears in git history' in secrets.test.mjs.
function ownGitTop() {
  try {
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return realpathSync(top) === realpathSync(ROOT)
  } catch {
    return false
  }
}

for (const file of ['.agent-team/onboarding-state.md', '.agent-team/customize-state.json']) {
  test(`${file} is not ignored, so it is committed with the team`, (t) => {
    if (!ownGitTop()) return t.skip('this folder is not a git repo yet, so git cannot judge the ignore rules; run `git init` and commit, then this runs')
    // --no-index: judged by the ignore rules alone, whether or not the file exists or is tracked yet.
    const run = spawnSync('git', ['check-ignore', '--no-index', '-v', file], { cwd: ROOT, encoding: 'utf8' })
    assert.equal(run.status, 1, `git ignores it: ${run.stdout.trim() || run.stderr.trim()}`)
  })
}
