# FitFirst Decision Register

> Every significant choice in this project is made by **Ravindra (owner)** and recorded here. AI assistants research, lay out options and recommend — they do not decide. If a decision is not written here with a date, **it has not been made**.

## How this works

1. An AI (or Ravindra) raises a decision using the `DECISION NEEDED` format in [`AGENTS.md`](../AGENTS.md) §2: question, why it matters, options with trade-offs, a recommendation, how reversible it is, and what it blocks.
2. Ravindra answers in the conversation.
3. The AI records it here in the same session: status `DECIDED`, the date, the choice, the reasoning in Ravindra's terms, and what it unblocks.
4. Tasks blocked by an open decision stay `[?]` in [`END_TO_END_CHECKLIST.md`](END_TO_END_CHECKLIST.md).

**Status values:** `OPEN` (waiting on Ravindra) · `DECIDED` · `SUPERSEDED` (replaced by a later decision) · `DEFERRED` (deliberately not now, with a trigger for revisiting).

**Rules:**
- Silence is not approval. An unanswered decision stays `OPEN`.
- A decision made in a chat that is never written here does not exist — write it down.
- Reversible decisions can be made quickly. One-way doors (data model, provider contracts, pricing promises, anything customer-facing or legal) deserve a slow answer.

---

## Open decisions

| ID | Question | Blocks | Urgency | AI recommendation |
|---|---|---|---|---|
| **D-02** | Rotate the three live API keys in `AI Creation/saree-studio/.env`? | `S05-05`; also the tagger now uses the AICredits key (DEC-16) | **Now** | Yes — rotate today (owner action, not AI) |
| **D-03** | Accept Stage 1, or raise a defect list? | Stage 2 start | After `S1-*` runs | Decide only after the browser checks are recorded |
| **D-04** | Which pilot shop, and what scope (departments, catalogue size, staff champion)? | Most of Stage 2+ | High — the pitch meeting | Start with aged stock plus key categories, 200–400 pieces |
| **D-05** | Pilot POS path: A (sync with their software) or B (FitFirst Billing)? | Stage 6 POS tasks, pilot design | High — needs the discovery meeting | Decide from their answers; default to A with Excel sync |
| **D-06** | v2 data model: migrate in place, or clean baseline plus importer? | All of Stage 2 | Before Stage 2 coding | Clean baseline plus importer — only demo data exists today |
| **D-07** | How is current product-level stock split into per-size stock? | `S2-C06`, `S2-C07` | Before Stage 2 coding | A physical count at the shop; do not guess sizes from totals |
| **D-08** | Pilot success definition: baseline source, holdout %, kill threshold, pilot window | Stage 4 measurement | Before go-live | Import POS history if it exists; 10% holdout; keep the existing kill threshold |
| **D-09** | Taxonomy home: versioned code module, or database tables with per-org overrides? | Stage 2/5 schema | Before Stage 2 coding | Database tables — regional garments change too often for code |
| **D-10** | Pilot skin-tone scope: swatches only, or camera v2 with calibration? | Stage 3/5 | Before Stage 3 | Swatches plus quiz for the pilot; camera v2 only if the hardware supports locking white balance |
| **D-11** | Body input: fit goals only, or body-shape labels too? | Stage 3 | Before Stage 3 | Fit goals as the default, shape as optional |
| **D-12** | Try-on: integrate, demo only, or defer? Which provider, quota and retention? | Stage 5 try-on tasks | After the pilot proves recommendations | Demo only for the pitch; integrate after Stage 3 |
| **D-13** | Hosting: provider, region, and who operates it | Stage 4 deployment | Before go-live | A small India-region VM with managed Postgres and backups |
| **D-14** | Pilot languages: English only, or English + Hindi + Gujarati? | Stage 3 copy | Before Stage 3 | All three for a Gujarat pilot; it affects every screen's copy |
| **D-15** | Commercial plans and prices to test in pitches | Pitch material | Before pitching | Test the three tiers in `MASTER_PLAN.md` §8 as hypotheses, not promises |
| **D-16** | Keep or drop the CLIP/torch fallback in the garment tagger? | `S5-*`, deployment size | With Stage 5 | Drop it; ~2 GB of dependencies for weak accuracy |
*(D-17 was decided on 24 Sep 2026 — see DEC-12 below. D-01 and D-18 were decided on 25 Sep 2026 — see DEC-15 and DEC-16.)*

### Detail on the near-term ones

**D-01 — Urgent technical fixes. DECIDED 25 Sep 2026 (DEC-15).** The try-on prototype's default image model shuts down **2 Oct 2026**, and of the three models the garment tagger tries, two are already shut down. When the AI fails, tagging silently drops to CLIP and then to guessing from image shape, and the dashboard still looks normal. The fix is small: model names in config, loud failures, repo hygiene, CI. *Reversible: easily.* *Blocked until decided:* all of `S0.5`.

**D-02 — Key rotation.** `AI Creation/saree-studio/.env` holds three live keys (Gemini, OpenRouter, AICredits). The folder arrived as a zip from another machine, and the `.env` was inside it, so the keys may exist elsewhere. Rotate them in each provider console and set spend caps. **Ravindra does this; no AI should touch the values.** *One-way door if a key is already being abused.*

**D-04 / D-05 — Pilot shop and POS path.** These two come out of the same conversation with your contact. Take the discovery checklist in `MASTER_PLAN.md` §7.2. The answers decide whether Stage 6's POS work is Excel sync (path A) or our own billing module (path B), which is weeks of difference.

**D-06 — Migration strategy.** The database currently holds only demo and test rows, which makes this the cheapest moment to take a clean v2 baseline plus a one-off importer instead of a long in-place migration. If real pilot data lands first, this gets materially harder — decide before the pilot shop's stock is entered.

**D-07 — Splitting stock into sizes.** Today one number covers all sizes of a product. Nothing in the data can tell us how many mediums of a kurta exist. Either someone counts the rack, or every size-level recommendation stays a guess. This is the one Stage 2 task that needs the shop's people, not code.

---

## Decided

| ID | Date | Decision | Why | Status |
|---|---|---|---|---|
| DEC-01 | 8 Sep 2026 | Keep React + Fastify + Prisma + PostgreSQL; finish one store's workflow before expanding | The architecture is sound; the gaps are in inventory, sales and reporting foundations | DECIDED (SIP) |
| DEC-02 | 8 Sep 2026 | Recommendations stay deterministic and rule-based; no ML without evidence | Explainable to owner and staff; no training data exists yet | DECIDED (SIP) |
| DEC-03 | 8 Sep 2026 | Kill threshold is locked before the pilot and treated as immutable | It is a commitment device against wishful thinking | DECIDED (SIP) |
| DEC-04 | 8 Sep 2026 | The camera is optional, runs on-device, and estimates skin tone only | Privacy, and body shape from a camera is not reliable | DECIDED (SIP) |
| DEC-05 | 8 Sep 2026 | FitFirst is not a POS replacement; POS integration comes late | Scope control for a single-store pilot | **SUPERSEDED by DEC-08** |
| DEC-06 | 22 Sep 2026 | `docs/MASTER_PLAN.md` approved as the product and architecture direction | End-to-end plan covering algorithms, try-on, POS, plans, scenarios and roadmap | DECIDED |
| DEC-07 | 22 Sep 2026 | Phase 0 urgent fixes wait for an explicit go-ahead; plan only, no code | Ravindra wanted the plan finished before any code | DECIDED — see D-01 |
| DEC-08 | 22 Sep 2026 | Support **both** POS paths: integrate with their billing software, **or** offer FitFirst Billing as our own focused module | No shop is turned away over its POS situation; billing also gives perfect attribution | DECIDED (supersedes DEC-05) |
| DEC-09 | 23 Sep 2026 | Delivery is human-gated: AI guides and implements approved tasks; Ravindra makes every product, architecture, commercial, privacy and UX decision | This must not become a vibe-coded project; the thinking has to stay with the owner | DECIDED |
| DEC-10 | 23 Sep 2026 | `PROJECT_CONTEXT`, `PROJECT_STATUS`, `END_TO_END_CHECKLIST` (plus `DECISIONS` and `SESSION_LOG`) are the portable handoff set, updated at the end of every working session | Any AI in any tool can pick the project up without re-deriving context | DECIDED |
| DEC-11 | 23 Sep 2026 | Stage 1 counts as implemented but **not accepted** until the browser checks are recorded | Automated tests passed, but the browser walkthrough stopped at the preferences screen | DECIDED — acceptance is D-03 |
| DEC-12 | 24 Sep 2026 | The handoff must work **both** in Claude Code and in whatever AI tool a collaborator uses. Implemented as: an instructions file per tool (all pointing at `AGENTS.md`), `npm run brief` at the start, `npm run docs:check` at the end, a `/handoff` command, and a Claude Code session-start hook. No blocking hook. | Ravindra works here; a friend works in another AI. Vendor-specific automation alone would leave one of them out, so the enforcement is plain Node scripts any tool or CI can run. | DECIDED (answers D-17) |
| DEC-13 | 24 Sep 2026 | `PROJECT_OVERVIEW.md` and `fitfirst_product_analysis.md` keep a "Historical — superseded" banner instead of being deleted or moved | Their detail and reasoning are still useful, but no AI should plan from them | DECIDED |
| DEC-14 | 24 Sep 2026 | Documentation changes stay **uncommitted** for now; Ravindra reviews and commits them | The owner wants to read the docs before they enter history | DECIDED |
| DEC-15 | 25 Sep 2026 | Stage 0.5 urgent fixes approved; work starts with S05-01 | The try-on image model shuts down 2 Oct and the tagger's models are dead or failing | DECIDED (answers D-01) |
| DEC-16 | 25 Sep 2026 | The garment tagger calls AI through **AICredits** (OpenAI-compatible gateway, `AICREDITS_API_KEY`) instead of Gemini direct. Use a low-cost vision model; the model is switchable by `AICREDITS_TAG_MODEL` or by the commented alternatives in `classifier.py` | Ravindra mainly uses the AICredits key for AI work; one key and one bill. Accepted cost: garment photos now pass through a reseller, and response-schema support depends on the gateway (affects S05-02) | DECIDED (answers D-18, option B) |

---

## Template for a new decision

```markdown
### D-xx — <question in one line>
- **Status:** OPEN | DECIDED | SUPERSEDED | DEFERRED
- **Raised:** <date> by <who>   **Decided:** <date> by Ravindra
- **Why it matters:** <what breaks or gets locked in>
- **Options:** A) … B) … C) …
- **Chosen:** <option> — <reason in Ravindra's words>
- **Reversible:** easy | hard | one-way door
- **Unblocks:** <task IDs>   **Consequences:** <what follows>
```
