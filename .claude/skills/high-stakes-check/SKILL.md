---
name: high-stakes-check
description: Before the owner takes a decision that is expensive or hard to undo (pricing, a launch, hiring, stopping a product, a big spend), writes a one-page decision brief, gets an independent second opinion through the second-opinion pack when it is installed, shows the owner where the second opinion disagrees in its own words, and logs the decision once the owner takes it. Without that pack it runs a clearly labelled pre-mortem instead. Use for "second opinion on this", "sanity check this decision", "should I do X" on a big call, or before presenting a recommendation the owner will act on with money.
---

# High-stakes check

For big, hard-to-undo calls only. Not for routine work: at most one or two a week unless the
owner asks.

## Steps

1. **Write the decision brief** to `agents/command-center/output/<date>-decision-<slug>.md`:
   - the decision, in one line;
   - the options (including "do nothing");
   - the recommendation and why;
   - the evidence, each item with where it came from;
   - what would make the recommendation wrong;
   - what it costs and whether it can be undone.
   Leave out anything secret and anything about a client that the owner would not want shown to
   another service.
2. **Get an independent view.**
   - If `.claude/agents/second-opinion.md` exists, hand the brief's path to `second-opinion`
     through the `Task` tool. It uses a model from a different company, on the owner's own
     settings and spending limits; follow what it reports.
   - If it does not exist, say so: "An independent check needs the second-opinion pack
     (`/add-pack second-opinion`)." Then run a pre-mortem yourself and label it plainly as **not
     independent**: imagine it is a year later and the decision went badly; list the three most
     likely reasons, and what you would check now to rule each out.
3. **Show the owner, in this shape:**
   - **Recommendation:** unchanged, or revised (and why).
   - **Second opinion:** agrees / disagrees / agrees with changes, and how sure it was.
   - **Where it disagrees:** quoted, not smoothed over.
   - **The owner decides.** Neither Command Center nor the second opinion decides.
4. **Log it** once the owner decides: an entry in `decisions.md` with the decision, the reason,
   whether the second opinion agreed, and a pointer to the brief. Status `active`. If the owner
   has not decided yet, status `proposed`, and it appears in the brief's "Waiting for your yes".
