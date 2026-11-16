# FitFirst V2 — improvements register

> Written on 15 November 2026 for the founder. It records:
> - what V2 changes compared with the real apps (`kiosk/`, `dashboard/`) and with V1 (`prototype/`), and why;
> - what is implemented and what is only recommended;
> - what still needs a product or business decision.
>
> Every choice made inside V2 is a **proposal you can look at**, not a recorded project decision. Anything that should become one still needs an entry in `docs/DECISIONS.md`.

## 1. How V2 relates to V1 and to the real apps

| | Real apps (`kiosk/`, `dashboard/`) | V1 (`prototype/`) | V2 (`prototype_v2/`) |
|---|---|---|---|
| **Purpose** | What is built and running | The whole product vision, as wide as possible | The real product, made client-ready, with V1's best workflows brought in |
| **Look** | Alabaster Atelier: warm alabaster, obsidian ink, brass `#8C6D3B`; Fraunces, Manrope, JetBrains Mono; “F” monogram; dark theme on the console | A new ivory-and-brass look with Figtree type and a sidebar | The real apps' identity (same tokens, fonts, monogram, mono eyebrows, pill kiosk buttons, discrete-cell PIN pad, dark theme), with a tighter type scale, spacing, states and motion |
| **Console navigation** | Top masthead with 4 tabs: Sessions, Inventory, Analytics, Baseline Log | Left sidebar with 23 items in 5 groups | The real top masthead, with **7 tabs** (Today, Sessions, Inventory, Counter, Analytics, Baseline Log, Setup), a **sub-nav** inside each tab using V1's page names, an **All pages** menu, and a **bottom tab bar on phones** |
| **Sign-in** | One shared 4-digit PIN | Name, then PIN in a pop-up; owner phone code | The real two-panel screen and digit cells, but **pick your name first**, so each person has their own PIN; owner phone code |
| **Kiosk flow** | Welcome → Privacy → Department → Size → Style preferences → Tone and body shape → Recommendations → Handoff | Language → Consent → Who for → Department → Needs → Size → Colours → Tone → Fit goals → Picks → Handoff | The real five-step progress, regrouped: **Section → Looking for → Size → Colouring & fit → Picks**, then Handoff |
| **Results** | One hero pick + a ranked list; tap to inspect; shows a match % | Three hero cards + more | The real **hero + ranked list** pattern, now with: no match %; “why it suits you”; true size availability; an add-to-try toggle on every row; a try-list tray; “Store pick · offer” labels |
| **Sessions** | “Stylist Client Dossiers”: filter chips with counts, code search, expandable cards, log purchase, no-purchase reasons kept only in the browser | A live queue and a separate visit history | **One Sessions page**: a live board (Waiting · With staff · Done today) plus the real expandable list with chips, code search, date range and paging; outcomes are saved for every device |
| **Analytics** | Verdict card, stat grid, two charts, top-recommended and slow-stock tables; a fixed “insufficient data” verdict | A results page with control-group lift, funnel, rejection reasons | The real page order, with the **corrected metric definitions**, a verdict built from three measured targets, and V1's lift, funnel, reasons and attribution |
| **Baseline Log** | Daily ledger form, live average bill, kill-threshold reminder | A pilot scorecard with footfall | The **real ledger** (bills, revenue, pieces per bill, live average, notes, “FitFirst was in use”), plus footfall, a before/after summary, and **lockable pass marks** |
| **Counter, stock room, setup** | Not built (Inventory has inline stock edit, AI auto-tagger, CSV import, photo update) | Full billing, intake, review, inward, import, count, labels, settings, setup guide, pitch kit, ops console | All of V1's, under the right tab, restyled into the real identity |

### Where every V1 menu item lives in V2

Every one of V1's 23 sidebar items exists in V2 under the same name. Each top tab opens a row of sub-tabs. The **All pages** menu lists all of them in V1's grouping; it opens from the ☰ icon in the top bar, from the avatar menu, or from **More** on phones.

| V1 sidebar | V2 top tab → sub-tab |
|---|---|
| Today | Today |
| Live queue | Sessions → Live queue |
| Visits | Sessions → Visits |
| Catalogue | Inventory → Catalogue |
| Intake | Inventory → Intake |
| Review queue | Inventory → Review queue |
| Purchase inward | Inventory → Purchase inward |
| Import & sync | Inventory → Import & sync |
| Stock count | Inventory → Stock count |
| Labels | Inventory → Labels |
| Billing counter | Counter → Billing counter |
| Sales | Counter → Sales |
| Day close | Counter → Day close |
| Results | Analytics → Results (the real “Pilot analytics” page, extended) |
| Clearance | Analytics → Clearance |
| Demand gaps | Analytics → Demand gaps |
| Team | Analytics → Team |
| Pilot scorecard | Baseline Log → Pilot scorecard |
| *(real app)* Baseline Log | Baseline Log → Daily log |
| Settings | Setup → Settings (14 areas) |
| Setup guide | Setup → Setup guide |
| Pitch kit | Setup → Pitch kit |
| FitFirst ops | Setup → FitFirst ops |

**Who sees what.** The console shows each person only the pages for their role, the same rule as V1:

- **Results, Clearance and Demand gaps** are for the owner and manager.
- **Sales staff** get Today, Sessions, Catalogue, Billing counter, Sales and Team. Where a tab holds only one page they can open, the tab is named after that page, so staff see “Team” rather than an “Analytics” tab with nothing else in it.
- **All pages** lists every page for everyone. Pages outside your role are greyed with a lock and say who can open them, with a “switch person” link.
- **Opening another role's page by link** shows who it is for and offers “Switch person”.
- **Tab counts** only appear for pages you can open.

The **Visits** list keeps everything V1's page had: code search, date range, outcome filter (including “Left midway”), channel filter (kiosk, assisted tablet, QR on phone), and paging. On top of that it has the real console's expandable session cards.

## 2. Screen coverage checklist

Every entry was opened in headless Chrome on 15 Nov 2026 with no JavaScript errors and no control without a handler.

**Shopper — kiosk, assisted tablet, QR on phone** (one flow, three modes)
- [x] Welcome / attract — the real editorial two-column entrance; shop name from settings, not hard-coded
- [x] Language choice (assisted and QR); language switch on every screen
- [x] Privacy — per-purpose switches, full notice, “I'd rather not” → kind “nothing saved” screen
- [x] Step 1 · Section (Women · Men · Kids), who it is for, under-18 switch
- [x] Step 2 · Looking for — type, occasion, budget
- [x] Step 3 · Size — only the size systems that apply; free-size note; height
- [x] Step 4 · Colouring & fit — numbered tones 1–10, three-question quiz, fit goals, colour likes. Under-18 profiles see colours only
- [x] Camera tone check — reading, confirm one of three, “not sure → pick a swatch”, camera denied
- [x] Step 5 · Picks — loading, results (hero + list), empty state with alternatives, “tell me when it arrives”, edit-answers sheet, “see it on me” QR
- [x] Handoff — code card, staff-notified state, offline state, try list, QR to phone, rating, reset bar, add a family member
- [x] Idle prompt (“Still there?”) and reset; Start over; Call staff

**Shopper — phone**
- [x] Enter a code
- [x] Lookbook with family tabs
- [x] Piece detail
- [x] Try-on: three consents → photo and drape → rendering → result with before/after slider and AI label → quality-check failure
- [x] Share on WhatsApp
- [x] Remember me
- [x] Privacy and delete my data
- [x] E-bill

**Console**
- [x] Sign-in: choose your name → PIN (digit cells, lock-out after 5 tries) · owner phone code
- [x] Today — three different versions: owner/manager, sales staff, intake
- [x] Sessions → Live queue (Waiting · With staff · Done today) · Visits (chips incl. “Left midway”, channel filter, search, dates, paging, expand)
- [x] Session detail — picks with racks and talking points; Tried / Rejected / Add to bill / Hold / Swap; add another piece; record a sale; mark no purchase (reasons with descriptions); pick list; erase
- [x] Inventory → Catalogue (with drawer: overview, stock, history), Add stock (quick/full intake), AI review, Receive stock, Import & sync, Stock count, Labels
- [x] Counter → New bill, Sales register (register, GST summary, exports), Day close
- [x] Analytics → Pilot analytics, Clearance, Demand gaps, Team
- [x] Baseline Log → Daily log · Pilot scorecard
- [x] Setup → Settings (14 areas), Setup guide, Pitch kit, FitFirst ops
- [x] All pages menu (every page, grouped as in V1's sidebar)

**Presenting**
- [x] Demo launcher with three guided paths
- [x] Presenter notes
- [x] Simulate a walk-in
- [x] Demo scenarios
- [x] Light/dark on every surface

## 3. What V2 changed, and why (implemented)

### 3a. Problems in the real apps that V2 fixes

| # | Problem in the real apps | Why it matters | What V2 does |
|---|---|---|---|
| 1 | A match % on the hero pick | Scores are not probabilities and can exceed 1.0 | No percentage anywhere a shopper sees; “why it suits you” lines instead |
| 2 | Jargon on shopper screens (“Complexion Undertone”, “Tailored size”, “Silhouette cut”, “Connect with Floor Stylist”) | Shoppers hesitate; staff have to explain | Plain words: “Your colouring & fit”, “Your size”, “Show my picks to staff” |
| 3 | Body-shape labels (“Pear / A-Line”, “Curvy & Defined”) | Body-shaming risk | Fit goals (“What should your outfit do?”) |
| 4 | Style preferences mix garment types and patterns, after size | A saree shopper is asked for a chest size; preferences barely affect ranking | Category, occasion and budget come **first**, then only the sizes that apply |
| 5 | Tone and body shape are mandatory, with silent defaults when skipped | Recommendations quietly assume “Tone 2” | Everything in step 4 can be skipped; nothing is assumed |
| 6 | “Ahmedabad Showroom” is hard-coded | Cannot be shown to a second shop | Shop name and area come from settings |
| 7 | A shared console PIN | No one is accountable; a leaver keeps access | Each person picks their name and uses their own PIN |
| 8 | No-purchase reasons stored only in that browser | Two devices disagree | Saved on the session, shown on every device |
| 9 | The step dots disagree with “Step 01 / 04” text | Small, but looks unfinished | Five labelled steps; the current one is named |
| 10 | Results can only be shown to staff as a code | Shoppers lose their picks when they leave | QR to the phone lookbook; family sharing |
| 11 | No “today” view, and Sessions is the landing page for everyone | Owners land on an operational list; staff land on history | Role-aware Today |
| 12 | The pilot verdict was a fixed “insufficient data” | A verdict with no basis | The verdict comes from three measured targets, with sample-size rules |
| 13 | The analytics “basket” counted item events | Inflated numbers | Bill-based definitions (from the engineering review) |

### 3b. Changes compared with V1

| # | Change vs V1 | Why |
|---|---|---|
| 14 | 23-item sidebar → 7 top tabs, each with sub-tabs that keep V1's page names, plus an “All pages” menu | Far less to scan at once; matches the real console; nothing from V1 is lost or renamed |
| 15 | Live queue and Visits sit under one Sessions tab, with the real console's expandable session cards | Staff and owners look in one place, and still get both views |
| 16 | Kiosk: 9 screens → 5 steps | Who-for joins Section; colours, tone and fit goals share one screen, as tone and body shape do in the real app |
| 17 | Three equal hero cards → one hero plus a ranked list | The real app's pattern; on a big screen it reads like a lookbook, and on a phone it stacks naturally |

### 3c. Added for demonstrations

| # | Addition | Why |
|---|---|---|
| 18 | Presenter notes and a demo launcher with guided paths | You can demonstrate to an owner, staff or a customer without a script |
| 19 | “Today” and the owner's value line (“₹3.7L of older stock sold in the last 7 days”) | The owner sees the reason to pay first |
| 20 | Today's activity in the demo data | V1 had nothing “today”, so the first screen looked empty |
| 21 | Phone bottom tab bar for the console | Staff on a phone get a real mobile layout, not a shrunken desktop |
| 22 | Motion: step transitions, staggered list reveal, chart draw-in, pop-in confirmations, toast spring | Each one confirms an action or guides the eye; all switch off with “reduce motion” |
| 23 | Dark theme on every surface | The real console already has one; the kiosk and phone now match |
| 24 | Old links keep working (`#/visit/…`, `#/queue`, `#/insights`, `#/pilot`) | Nothing breaks if someone follows a V1 link |
| 25 | Control-group status is shown only to owners and managers | Staff seeing it could change how they sell to those shoppers and spoil the measurement |

## 4. Still open — recommendations not implemented, or needing a decision

| # | Item | Why it matters | Recommendation | In V2? |
|---|---|---|---|---|
| 4.1 | **Real product photos** | Drawn garments cannot show whether picks look right; this is now the biggest gap in a client demo | Photograph 60–100 real pieces (checklist S0-10) and drop them in | No |
| 4.2 | Assisted-mode staff lines (“Picks are ready”, “Open console”) are English even when the shopper chose Hindi or Gujarati | Correct for staff, but it reads as mixed language on a shared screen | Decide whether staff text follows the shopper's language | No — needs a decision |
| 4.3 | Hindi and Gujarati copy | About 150 shopper strings are AI drafts; the new V2 strings likewise | Native-speaker and sensitivity review before any shopper sees them | Drafts only |
| 4.4 | The real console's AI auto-tagger was a banner inside the “Add New SKU” form | V2 uses V1's step-by-step intake instead (photos → AI read → check highlights → stock) | Confirm with the person who adds stock which is faster in practice | Intake only |
| 4.5 | Inline stock edit in the real Inventory table | V2 moves it into the piece drawer, by size, with a reason | Confirm staff are happy with one extra tap in exchange for per-size accuracy | Drawer only |
| 4.6 | Several sections share one console | An owner with no billing needs sees an empty Counter tab | Hide Counter when the shop uses path A (its own billing software) | No — needs D-05 |
| 4.7 | Second store | Only the gate and prompt are shown | Model a second store's data once multi-store is in scope | Partly |
| 4.8 | Body-shape quiz (optional) | The plan allows it for shoppers who like it | Leave out until D-11 is decided | No |
| 4.9 | Keyboard and screen-reader pass | Basic labels and focus states exist; not audited | Run an accessibility check with a screen reader before a public pilot | Partly |
| 4.10 | Everything V1 could not simulate | Camera measurement, AI tagging, try-on rendering, payments, printing, SMS/WhatsApp, offline sync, two devices at once | See `PROTOTYPE_GAPS_AND_IMPROVEMENTS.md` section 8 at the repo root | Simulated |

## 5. How V2 was checked (15 Nov 2026, headless Chrome)

- **Every screen renders.** All 24 console pages and 14 settings areas render with no JavaScript errors, and every button, input and form has a handler.
- **57 console workflow checks passed**, for example:
  - wrong PIN rejected, role limits;
  - claim → tried → rejected → hold → add to bill → record sale; stock reduced by size;
  - billing with a scanned visit, a manager-approved discount and UPI; the GST slab boundary;
  - return → credit note → exchange;
  - sessions search, filter, expand and paging;
  - intake to live; purchase inward;
  - items and sales imports, and a replay importing nothing;
  - stock count, labels, day close;
  - analytics export, presenter notes, baseline ledger validation and saving;
  - clearance push; ruleset activation; device enrolment; erasure keeping the bill;
  - AI-off manual intake; the intake role's console.
- **Three of those checks are engine properties**, which held on the demo data:
  - a nudged piece never outranks one that suits 0.10 better;
  - at most two nudged pieces in a top five;
  - a sold-out size is never recommended.
- **21 phone and kiosk checks passed**:
  - try-on consents, and a failed try-on not counted;
  - self-service erasure keeping the bill;
  - a family visit with a child (child sees no tone or fit questions);
  - an assisted visit assigned to staff;
  - poor light (camera abstains), quiz sets undertone, offline handoff, help request;
  - decline screen, empty results with alternatives, “tell me when it arrives”.
- **Layout:** no page scrolls sideways at 390 px (phone) or 820 px (tablet). Light and dark themes were captured and reviewed.
- **Nothing else changed:**
  - V1 (`prototype/`) is byte-for-byte unchanged (checksums compared before and after);
  - no file in `backend/`, `dashboard/` or `kiosk/` changed.

**Not verified:** Firefox and Safari; real phones, tablets and kiosk hardware; screen readers; printing on real printers.
