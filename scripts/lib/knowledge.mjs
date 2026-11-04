import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Whether a specialist's knowledge file has been ANSWERED with a refusal, rather than just left
// empty. Both halves matter: the shipped templates quote "I do not sell" inside their own
// guidance paragraph, so matching the phrase alone marks every fresh clone as not in use.
//
// Kept in step with agent-cockpit's api/lib.js, which makes the same judgement for the board.
const NOT_IN_USE = /\b(?:i|we)\s+do\s+not\s+(?:sell|deal\s+with\s+customers|have\s+customers)\b/i

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))

// The two specialists whose work belongs to the business rather than to the person doing the job,
// so they are the two a user routinely switches off. One shared copy of this map, so check:arming,
// the board and the matcher all agree which agent has switched itself off.
// to a bid coordinator's week and passed every check on the way to being proposed.
export const KNOWLEDGE = {
  sales: 'agents/sales/knowledge/offer-sheet.md',
  'customer-service': 'agents/customer-service/knowledge/faq.md'
}

export function fillMarkers(source) {
  return [...String(source ?? '').matchAll(/<!--\s*fill:\s*([a-z0-9-]+)\s*-->/g)].map((m) => m[1])
}

// The refusal has to be found in the user's OWN WORDS, not in the instructions that show them
// what to write. Both files open with a paragraph that quotes the sentence as an example, wrapped
// in markdown emphasis and quotation marks:
//
//     *"I do not sell - I work for this business and the selling is <name>'s job"*
//
// "No fill markers left" is not enough on its own: it separates a fresh file from an answered one,
// but a person who answers every question and leaves the instructions in place would still match
// the example and be marked "Not in use".
//
// So the example is stripped, and what is left is what the user wrote. What identifies the example
// is the `<name>` still sitting inside it: an unfilled placeholder, the same family as a
// `<!-- fill: -->` marker. Anybody who answered has a real name in there, or no name at all.
// Splitting at the first heading, or stripping any `*"..."*` span, would misjudge real answers.
//
// The test that fills in the real shipped files and checks they read as in use is the lasting
// guard: if the guidance is reworded so its example no longer carries `<name>`, that test fails.
const QUOTED_EXAMPLE = /\*"[\s\S]*?"\*/g
const UNFILLED_NAME = /<name>/i

export function ownWords(knowledgeBody) {
  return String(knowledgeBody ?? '').replace(QUOTED_EXAMPLE, (span) =>
    UNFILLED_NAME.test(span) ? ' ' : span
  )
}

export function notInUse(knowledgeBody) {
  if (typeof knowledgeBody !== 'string' || !knowledgeBody) return false
  if (fillMarkers(knowledgeBody).length) return false
  return NOT_IN_USE.test(ownWords(knowledgeBody))
}

// A knowledge file is in one of exactly two good states, and a test that demands the first one
// fails every repo that reached the second.
//
//   SHIPPED   - still carries fill markers, so /onboard and /audit can see what is blank
//   ANSWERED  - the markers are gone and there is prose under a heading
//
// Both files ship with instructions telling the user to "delete the rest of the file's markers,
// and you are done", so a test that demands the markers be present would fail in every repo that
// has been answered.
export function answered(body) {
  const text = String(body ?? '')
  if (fillMarkers(text).length) return false
  return text
    .split('\n')
    .some((line) => {
      const trimmed = line.trim()
      return trimmed.length > 0 && !trimmed.startsWith('#')
    })
}

// The slugs of the agents this owner has said, in their own knowledge file, do not apply to them.
// A missing file is not a refusal: a repo that never had one is not the same as a repo where
// somebody wrote "I do not sell".
export async function notInUseAgents(root = repoRoot) {
  const off = new Set()
  for (const [slug, relative] of Object.entries(KNOWLEDGE)) {
    const body = await readFile(path.join(root, relative), 'utf8').catch(() => null)
    if (notInUse(body)) off.add(slug)
  }
  return off
}
