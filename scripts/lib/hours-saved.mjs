import { loadLedger, validateLedger, summarize } from './ledger.mjs'
import { loadProposals, validateProposals, summarizeProposals } from './proposals.mjs'
import { loadCatalogue } from './catalogue.mjs'

// The one line of the morning brief about time: how many hours a week the team has taken off the
// owner. Every number comes from the ledger's own arithmetic, re-derived the way
// `npm run check:proposals` derives it - the hours of each ledger task proposals.yml hands to
// something on the team. Nothing is estimated here, and nothing is rounded up to look better.
//
// When there is no figure - no ledger, an empty one, one that does not check out, or nothing
// handed to the team yet - the sentence says so in plain words and names the command that fixes
// it. A brief that printed "0 hours" for a ledger nobody started would read as the team failing.

const NO_LEDGER = 'No hours-saved figure yet: there is no ledger. Ask for one with /ledger.'
const EMPTY_LEDGER = 'No hours-saved figure yet: your ledger has no entries. Add your week with /ledger.'
const NOTHING_MATCHED =
  'No hours-saved figure yet: your ledger has entries, but nothing on the team has been matched to them. Run /match.'
const NOTHING_HANDED = 'No hours-saved figure yet: your ledger has entries, but none is handed to the team yet.'

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

// Whole hours, said the way a person says them. Under one hour is said as such, never as "about 0".
export function hoursWords(hours) {
  if (!(hours > 0)) return null
  const whole = Math.round(hours)
  if (whole < 1) return 'less than an hour'
  return `about ${plural(whole, 'hour')}`
}

// Pure: what to say, given what was read. `ledger` / `proposals` are null when the file is absent.
export function hoursSavedSentence({ ledger, proposals, catalogue }) {
  if (!ledger) return NO_LEDGER
  const ledgerProblems = validateLedger(ledger)
  const tasks = Array.isArray(ledger.tasks) ? ledger.tasks : []
  if (!tasks.length) return EMPTY_LEDGER
  if (ledgerProblems.length) {
    return `No hours-saved figure today: your ledger has ${plural(ledgerProblems.length, 'thing')} to fix. Run npm run check:ledger.`
  }
  if (!(summarize(ledger).hoursPerWeek > 0)) return EMPTY_LEDGER
  if (!proposals) return NOTHING_MATCHED
  const proposalProblems = validateProposals(proposals, ledger, catalogue)
  if (proposalProblems.length) {
    return `No hours-saved figure today: proposals.yml has ${plural(proposalProblems.length, 'thing')} to fix. Run npm run check:proposals.`
  }
  const summary = summarizeProposals(proposals, ledger, catalogue)
  const words = hoursWords(summary.hoursPerWeek)
  if (!summary.proposed || !words) return NOTHING_HANDED
  return `Your team saved ${words} this week (your ledger's figure for the ${plural(summary.proposed, 'task')} handed to it).`
}

async function absentAsNull(load) {
  try {
    return await load()
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

// `dataRoot` holds ledger.yml and proposals.yml; the catalogue is always this repo's own team,
// as in check-proposals.mjs.
export async function readHoursSaved(dataRoot) {
  const ledger = await absentAsNull(() => (dataRoot ? loadLedger(dataRoot) : loadLedger()))
  const proposals = ledger ? await absentAsNull(() => (dataRoot ? loadProposals(dataRoot) : loadProposals())) : null
  const catalogue = proposals ? await loadCatalogue() : []
  return hoursSavedSentence({ ledger, proposals, catalogue })
}
