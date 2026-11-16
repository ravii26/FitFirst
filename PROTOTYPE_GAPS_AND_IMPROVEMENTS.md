# Prototype gaps and improvements register

> Written while building `prototype/` on 15 November 2026. It records what the documentation left open, what the prototype decided in order to keep moving, and what could not be shown honestly in HTML.
>
> **How to read it.** “In prototype?” says whether you can see the item working in `prototype/`. A choice made inside the prototype is a **proposal you can look at**, not a recorded project decision. Anything that should become one still needs an entry in [docs/DECISIONS.md](docs/DECISIONS.md).

## The short version

- The plan describes the product well. The largest gaps were not features but **screens the plan implies and never names**: first-time setup, the review queue, stock count, labels, day close, a place to see consent records, a way for a shopper to delete their own data.
- Twelve open decisions (D-03 … D-20) touch what a screen looks like. The prototype had to pick one option for each to be drawable. Those picks are listed in section 3 so you can accept or reverse them.
- Seven things are only simulated: product photos, the camera measurement, AI tagging, try-on rendering, payments, printing and messaging.
- Hindi and Gujarati copy is a draft written by the AI and has **not** been reviewed by a native speaker, a stylist or a sensitivity reviewer.

---

## 1. Missing features discovered

| # | What is missing or problematic | Why it matters | Recommendation | In prototype? |
|---|---|---|---|---|
| 1.1 | The plan lists a staff queue but no **help request** from a shopper who is stuck | An elderly or hesitant shopper has no way to call someone; the kiosk just times out | A “Call staff” button on every kiosk screen that raises an alert in the queue | Yes — kiosk header, shown on Today and Live queue |
| 1.2 | No way for staff to **hold** a piece while fetching it | The scenario table promises a reservation when a piece is about to sell out; no screen carries it | A 30-minute hold per pick | Partly — the hold is recorded and shown; it does not yet reduce stock available to other shoppers |
| 1.3 | **Held bills** at the counter | A cashier is often interrupted mid-bill; every real POS has this | Hold and recall | Yes |
| 1.4 | No **“tell me when it arrives”** path, though the scenario table mentions “notify me” | Without it a demand gap has no shopper attached | Opt-in for one WhatsApp message, listed for the owner beside the gaps | Yes |
| 1.5 | **Exposure counter** (impressions in 7 days) is in the ranking formula but has no visible home | The owner cannot see why a piece is or is not being shown | Show “shown · 7 days” on the aged-stock list, with a suggestion | Yes |
| 1.6 | **Markdown suggestion** for pieces shown often but not selling | It is in the scenario table (Phase 6) with no design | A plain-words suggestion on the aged list, no automatic price change | Yes — as a suggestion only |
| 1.7 | **Staff incentive (spiff)** appears in the schema (`ProductPush.spiffPaise`) and nowhere else | Adoption by salespeople is the plan's biggest risk; this is the main lever | Show the incentive to staff on the pick, and total it on the Team page | Yes — the amounts are illustrative |
| 1.8 | **Pick list print-out** | Not every salesperson will carry a tablet to the racks | A one-tap printable list with rack codes | Yes |
| 1.9 | **Manager PIN** for discounts and refunds is specified; the limit itself has no setting | Shops differ a lot on bargaining | A discount limit in Billing settings | Yes |
| 1.10 | **Platform-level controls** (model registry, kill-switch) are described but belong to no screen | Someone at FitFirst must be able to stop try-on spend or swap a retired model | A small internal ops console | Yes — “FitFirst ops” |

## 2. Missing screens or user journeys

| # | What is missing | Why it matters | Recommendation | In prototype? |
|---|---|---|---|---|
| 2.1 | **First-time setup** for a new shop | The plan describes onboarding in prose (dead-stock sprint, import, count, staff, devices) but there is no guided path | A six-step setup guide that also runs the billing discovery questions and proposes path A or B | Yes — Setup guide |
| 2.2 | **Role-specific home** | One dashboard for four roles hides what each person must do next | “Today” shows different numbers and tasks per role | Yes |
| 2.3 | **Declined-consent journey** | “I'd rather not” previously just reset the kiosk | A short, kind screen that offers staff help and confirms nothing was saved | Yes |
| 2.4 | **Shopper self-service privacy** | DPDP erasure is planned as a staff action only | Shopper can see what is kept, when it is deleted, and delete it from their phone; staff can do the same at the counter | Yes — both |
| 2.5 | **Consent record viewer** | Consent records are in the schema but nobody can see them | A table in Settings → Privacy | Yes |
| 2.6 | **Family visit** (several profiles, one code) | Named in the plan; no flow | “Add another family member” after the first handoff, with a tab per person for staff and on the phone | Yes |
| 2.7 | **Edit answers without losing the code** | DEC-18 decided the behaviour; there was no UI for editing one answer | A summary sheet with “Change” per answer; the code is kept | Yes |
| 2.8 | **Device enrolment and camera calibration** | Described as data, not as steps a manager follows | Pairing code flow; a three-step calibration wizard with an expiry | Yes |
| 2.9 | **Ruleset lifecycle** (clone → edit → activate) | The “Rules Studio” is deferred, but owners need to see that rules are versioned | A simple weights editor on a cloned draft, activated with a manager PIN | Yes — weights only, not individual rules |
| 2.10 | **Empty, loading, error and offline states** | The Stage 3 checklist asks for them; none were designed | Every list has an empty state; recommendations and AI calls have loading states; offline and AI-off have banners | Yes |
| 2.11 | **WhatsApp e-bill landing page** | The bill link has to open somewhere | A phone page showing the receipt | Yes |
| 2.12 | **Multi-store experience** | Stage 6; no design at all | Store switcher exists and is gated to Premium; a second store's data is not modelled | Partly — the gate and the prompt only |
| 2.13 | **Stock transfers between stores**, **khata (customer credit)**, **loyalty**, **supplier ledger** | Listed as later or never | Leave out until a paying shop needs them | No — deliberately |

## 3. Incomplete product decisions the prototype had to assume

Each row is an open decision in `docs/DECISIONS.md`. The prototype shows **one** option so the product could be drawn. Reversing any of them is a small change in the prototype.

| Decision | What the prototype assumes | Why | In prototype? |
|---|---|---|---|
| D-04 / D-05 pilot shop and POS path | A mid-size Ahmedabad saree and ethnic shop on **path B** (FitFirst Billing), with path A fully switchable in Settings → Billing software | Path B shows more of the product; path A is one click away | Yes — both |
| D-07 splitting stock into sizes | A physical count, rack by rack | It is the plan's recommendation and the only honest source | Yes — Stock count |
| D-08 pilot success definition | 15% / 30% / 40% thresholds, 10% control group, a 6-week window; a verdict needs 100 consultations and 60 baseline bills | The existing kill threshold; the minimum sample sizes are **my assumption** | Yes |
| D-09 taxonomy home | Data, with per-shop additions | The plan's recommendation | Yes — “Add a category of your own” |
| D-10 skin tone | Both: swatch plus three-question quiz as the default, camera as an opt-in that asks the shopper to confirm one of three swatches | Lets you compare them side by side | Yes |
| D-11 body input | Fit goals only. The optional body-shape quiz is **not** built | Fit goals are the plan's default and the safer wording | Fit goals yes; shape quiz no |
| D-12 try-on | Integrated on the phone, with quotas, consents and quality checks | So you can judge the whole experience before deciding | Yes — simulated |
| D-14 languages | English, Hindi and Gujarati on every shopper screen | The plan's recommendation for a Gujarat pilot | Yes — draft copy |
| D-15 plans and prices | The three tiers and add-ons from MASTER_PLAN §8, labelled “to test” everywhere | They are hypotheses | Yes |
| D-16 CLIP fallback | Dropped. When AI is off, nothing is guessed and staff enter details by hand | The plan's recommendation; removes the “silent guess” landmine | Yes |
| D-20 tenancy timing | An organisation with two stores exists from the start | Needed to show the store switcher | Partly |
| Minimum control-group size before showing a lift | 20 visits | **My assumption**; a statistician should set this | Yes |
| Exchange window | 7 days, manager PIN after that and for any refund | **My assumption**; shops vary | Yes |
| Idle timing on the kiosk | Warn after 60 seconds, clear 15 seconds later | **My assumption** | Yes |
| Per-visit retention | 90 days | **My assumption**; needs the legal review (S0-08) | Yes — editable |

## 4. UX problems identified (and what the prototype does instead)

| # | Problem in the current apps or plan | Why it matters | What the prototype does | In prototype? |
|---|---|---|---|---|
| 4.1 | Scores shown as a “match %” | Scores are not probabilities and can exceed 1.0 | No percentage anywhere a shopper can see. Owners see a labelled internal 0–1 score in the clearance simulator only | Yes |
| 4.2 | Tone labels | Colourism risk | Numbered tones 1–10 with neutral undertone and contrast words; stored codes are never shown | Yes |
| 4.3 | Body-shape picker with labels | Body-shaming risk | Fit goals (“What should your outfit do?”) | Yes |
| 4.4 | Size asked before category | A saree shopper was asked for a chest size | Category first; only the size systems that apply are asked; sarees say “free size, nothing to choose” | Yes |
| 4.5 | A long horizontal row of result cards | No hierarchy; the best pick does not stand out | Three hero picks, then up to six more | Yes |
| 4.6 | “Staff notified” shown immediately | It claimed something that had not happened | “Telling our staff…” first, then confirmed; when offline it says to show the code | Yes |
| 4.7 | Twelve-column inventory table | Unreadable; metadata crowds out stock | Six columns with stock by size; everything else in a drawer | Yes |
| 4.8 | Sale logged one item at a time, “Other item” broken | Multi-item baskets and bargaining are normal | A basket with any catalogue item, size, price after bargaining and the shop's own bill number | Yes |
| 4.9 | Pilot verdict hard-coded | A verdict with no basis | Each threshold shows its own evidence, and “not measurable yet” when an input is missing | Yes |
| 4.10 | Demo numbers look real | A founder could show them to an owner by accident | A “Demo data” tag in the top bar and on every analytics page | Yes |
| 4.11 | Promoted items indistinguishable from personal picks | Dark-pattern and trust risk | “Store pick · offer” label whenever an offer exists, plus a one-line “How picks are chosen” | Yes |
| 4.12 | Staff-only information leaking to shoppers | “In stock 140 days” would embarrass the shop | Shown only on the staff visit screen, marked “Staff only” | Yes |
| 4.13 | The dark, gold “luxury atelier” theme vs the later ivory theme | Two visual directions in the docs | One system: warm ivory, ink, a brass accent, serif headings, sans-serif for work | Yes |

## 5. Architectural or workflow inconsistencies

| # | Inconsistency | Why it matters | Recommendation | In prototype? |
|---|---|---|---|---|
| 5.1 | MASTER_PLAN says assisted mode comes first; everything built so far is a kiosk | The first pilot would use the least-built mode | Treat the three modes as one flow with three shells | Yes — one flow, `?mode=` |
| 5.2 | “Stage” and “Phase” numbering | Easy to plan the wrong thing | The prototype ignores both and shows the end state | n/a |
| 5.3 | Two sale paths (staff app and FitFirst Billing) could both record the same sale | Double counting conversion and stock | One sale record with a source and an attribution method; the staff-app form takes the shop's bill number so a later import can match it | Yes — the matching itself is shown for imports, not for staff-app sales |
| 5.4 | Stock authority (who owns quantities) is a per-connector flag with no explanation to the shop | A wrong setting silently double-decrements stock | A plain-words switch in Settings → Billing software | Yes — the reservation behaviour behind it is not simulated |
| 5.5 | The plan's holdout hides the nudge from 10% of shoppers, but staff still see “Priority” flags | Staff could push aged stock to control-group shoppers and blur the measurement | Decide whether staff priority flags are also hidden for control visits | **No — needs a decision.** The prototype still shows the flag |
| 5.6 | Erasure vs GST retention | A shopper deletes their data but the bill must stay | Erase the visit, keep the bill, say so on screen | Yes |
| 5.7 | Try-on quota is per visit and per month; the plan does not say what a family visit gets | Four people sharing three previews | Per-visit quota for now; staff can add three more | Yes |
| 5.8 | An “other occasion” or “next size” alternative is not a recommendation, but it is still a pick staff must find | Staff screens only list true picks | Decide whether alternatives carry into the staff view | **No — needs a decision** |

## 6. Features that need further clarification

| # | Question | Why it matters | In prototype? |
|---|---|---|---|
| 6.1 | What exactly does the shopper's shared WhatsApp link show, and when does it expire? | It is a public link to someone's choices | Assumed: pieces only, never answers or tone; dies with the visit |
| 6.2 | Who may see individual shopper profiles: all staff, or only the one who claimed the visit? | Privacy and staff trust | Assumed: any floor staff |
| 6.3 | Are incentives real money, and who pays? | The Team page shows rupee amounts | Illustrative ₹100 per aged recommended piece plus the push amount |
| 6.4 | Should the control group be per shopper or per day? | Per-shopper is cleaner but staff may notice | Per visit, by code |
| 6.5 | What does “remember me” store, and for how long? | It is the first personal identifier in the product | A masked phone number against the visit only |
| 6.6 | Does the owner want cost prices in the system at all? | Aged value at cost is the number owners think in | A cost ratio on MRP |
| 6.7 | For path A, will cashiers really type the code on the bill? | The whole attribution story for path A rests on it | Shown as the habit to train; worth testing in the pilot shop before anything else |
| 6.8 | Kids: is “no tone at all” right, or do parents want colour guidance? | The plan says no camera and no try-on, and is silent on swatches | Assumed: no tone questions for anyone under 18 |

## 7. Improvements introduced independently

| # | Improvement | Why | In prototype? |
|---|---|---|---|
| 7.1 | **Clearance simulator**: the same sample shopper with the nudge off and on, side by side | Makes the “never outranks a clearly better match” promise something an owner can see | Yes |
| 7.2 | **“Suits” card** on every product, computed from the rules | The plan's idea, placed where staff and owners will read it | Yes |
| 7.3 | **Why-it-suits lines** come from the rule that actually scored highest, in three languages | Deterministic and auditable, as the plan requires | Yes |
| 7.4 | **Intake timer** against the 90-second and 3-minute targets | Cataloguing effort is the adoption killer; make it visible | Yes |
| 7.5 | **Import that proves it is safe to repeat**: preview, per-row outcome, and a replay that changes nothing | The checklist gate S2-G04 | Yes — real CSV parsing, including quoted commas |
| 7.6 | **GST explained on the line** (“drops to 5% because the price after discount is ₹2,500 or less”) | The slab rule surprises cashiers | Yes |
| 7.7 | **Scenario switches** (offline, AI off, camera denied, poor light, try-on failing) | Lets you check the unhappy paths in a demo | Yes |
| 7.8 | **Metric definitions on the tile** | The old dashboard counted conversions wrongly; definitions should be one tap away | Yes |
| 7.9 | **Attribution shown as a range** | Proven links in the headline, likely-but-unproven only as an upper bound | Yes |
| 7.10 | **Pitch kit inside the product**: value calculator, 7-minute script with deep links, plans, pilot offer | Stage 0 item S0-10 has not started | Yes |
| 7.11 | **Validation with reasons** on every form (GSTIN shape, MRP ceiling, size codes, duplicate bills, weights adding to 100) | The engineering review found several silent failures | Yes |
| 7.12 | **Audit log** fed by every privileged action | Checklist S2-A05 | Yes |

## 8. Important functionality that could not be meaningfully simulated

| # | What | What the prototype shows instead | What the real thing needs |
|---|---|---|---|
| 8.1 | **Real product photos** | Drawn garment illustrations, labelled as such | 60–100 pieces photographed by us (S0-10). Until then nobody can judge whether picks *look* right |
| 8.2 | **Skin-tone measurement** | A timed animation that always proposes tones 4–6 and a warm undertone, or abstains when “poor light” is switched on. A live camera preview appears if the browser allows it; **no pixels are read** | MediaPipe face landmarks, a grey reference, calibrated hardware, and the repeatability tests in MASTER_PLAN §5.8 |
| 8.3 | **AI garment tagging** | A canned result per category with made-up confidence values | A live vision model, a stylist-labelled evaluation set, and measured colour from real photos |
| 8.4 | **Try-on rendering** | A drawn figure wearing the garment's colours. The four quality checks are always shown as passed unless the failure scenario is on | A provider call, the automated checks, a DPA, the 18+ and consent flow reviewed by a lawyer |
| 8.5 | **Payments** | A stand-in QR and a “I saw the payment” tick | A real UPI intent link; later a soundbox or payment-partner confirmation |
| 8.6 | **Printing** | The browser's print dialog on a receipt-shaped block | Thermal and label printer drivers, tested on a supported-hardware list |
| 8.7 | **QR codes and barcodes** | Visual stand-ins that are not scannable, each with a “simulate scan” link | A real encoder; scanner testing |
| 8.8 | **SMS codes and WhatsApp** | Fixed code 123456; message previews | An SMS provider, WhatsApp Business API, opt-in handling |
| 8.9 | **Offline behaviour** | A switch that changes banners and wording | A cached stock snapshot, an offline engine, queued events and per-device bill series that really sync |
| 8.10 | **Two devices at once** | Tabs in one browser share state and update each other | A server; the concurrency gates S2-G01 and S2-G02 (two staff, last unit) cannot be shown here |
| 8.11 | **Accuracy of the styling rules** | A simplified rule set written by the AI from MASTER_PLAN §5.5 | Rules written and signed off by a professional stylist. **The prototype's picks are plausible, not validated** |
| 8.12 | **Hindi and Gujarati quality** | AI-drafted translations of about 120 strings. Staff, owner, privacy-notice and most phone screens are English only | Human translation and a sensitivity review of every shopper-facing line |
| 8.13 | **Tally bridge, cloud connectors** | A settings screen and an install-code dialog | The agent itself |
| 8.14 | **Legal sufficiency** | Consent toggles, a notice, retention settings, erasure | A qualified DPDP review (S0-08) and CA review of billing. Nothing on screen is legal advice |

---

## What was verified, and what was not

Run on 15 November 2026 in headless Chrome, driven by a script.

- **Every page renders**: all 23 workspace pages, 14 settings areas, the pitch tabs and the setup steps were opened as the owner with no JavaScript errors, and every button, input and form on them has a handler.
- **51 workflow checks passed** in the workspace, including: wrong PIN and wrong phone code rejected; role limits; claim → tried → rejected → sale; stock reduced by size; billing with a scanned visit, a manager-approved discount and UPI; the GST slab boundary; return → credit note → exchange; intake to live; purchase inward; items and sales imports, and a replay importing nothing; stock count; labels; day close; push; ruleset activation; device enrolment; erasure keeping the bill.
- **Three of those checks are engine properties**, which held on the demo data: a nudged piece never outranks one that suits 0.10 better; at most two nudged pieces in a top five; a sold-out size is never recommended and the control group gets no nudge.
- **15 checks passed** on the phone and extra kiosk paths: try-on consents, a failed try-on not being counted, self-service erasure, a family visit with a child, poor light, offline handoff.
- **Mobile width (390 px)**: no page scrolls sideways.

**Not verified:** Firefox and Safari; a real phone or tablet; keyboard-only and screen-reader use beyond basic labels; opening straight from the file system in a browser that isolates local storage per file (the surfaces would then not share data — serve the folder instead); printing on real hardware.
