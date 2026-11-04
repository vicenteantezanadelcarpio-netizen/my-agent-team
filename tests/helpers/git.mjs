// The git the collector tests run - for their own throwaway repos, and handed to the collector as
// deps.git - with one narrow retry.
//
// Why the retry: on some Windows computers antivirus software can hold a file open: a real-time virus scanner
// opens each file git has just written. If git renames that file into place while the
// scanner still holds it - git writes every object to a temporary file, then renames it - the
// rename fails and git stops with "unable to write file ...: Permission denied". Under the full
// suite's parallel load this can hit any git test.
//
// The same hold hits git's other write-then-rename files: .git/config through config.lock ("could
// not write config file ...: Permission denied") and the index. Only these messages, and only with "Permission denied", are retried,
// at most four times, a little longer each time. Any other git failure - every one a test is
// about - is returned at once, unchanged. A failed write of this kind changes nothing git counts as
// done (no ref moves, no commit is made, the old config and index stay), so running the same
// command again is safe; a clone that failed part way has its half-made folder removed first.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const execFileP = promisify(execFile)

export const HELD_BY_SCANNER = /(unable to (write|create temporary) file|could not (write|commit) config file|unable to write new index file).*Permission denied/
export const RETRIES = 4

const runGit = (args, cwd) => execFileP('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })

export async function git(args, cwd) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await runGit(args, cwd)
    } catch (error) {
      if (attempt >= RETRIES || !HELD_BY_SCANNER.test(String(error?.stderr ?? ''))) throw error
      if (args[0] === 'clone') await rm(resolve(cwd ?? '.', args[args.length - 1]), { recursive: true, force: true })
      await new Promise((done) => setTimeout(done, 200 * (attempt + 1)))
    }
  }
}
