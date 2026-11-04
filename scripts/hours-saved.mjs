// Prints the morning brief's one line about time saved, from the ledger's own totals.
//
// Run it: npm run brief:hours
//
// The daily-brief skill copies this line into the brief word for word, so the number is the
// ledger's and never the model's. Always exits 0: "no figure yet" is an answer, not a failure.
//
// Optional directory to read ledger.yml and proposals.yml from (as check-ledger.mjs takes), so a
// test can run this binary against a fixture without writing into the repo it is testing.

import { readHoursSaved } from './lib/hours-saved.mjs'

console.log(await readHoursSaved(process.argv[2]))
